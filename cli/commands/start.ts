// ============================================================
// AskElira CLI — start command
// ============================================================
// `askelira start [goalId]` — start Steven heartbeat monitoring

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import * as api from '../lib/api';
import { truncate, formatInterval } from '../lib/format';

/**
 * Main start command handler.
 */
export async function startCommand(goalId?: string): Promise<void> {
  // If no goalId, prompt for one
  let targetGoalId = goalId;

  if (!targetGoalId) {
    const spinner = ora('Loading buildings...').start();
    try {
      const res = await api.listGoals();
      spinner.stop();

      if (!res.ok || res.data.goals.length === 0) {
        console.log(chalk.gray('  No buildings found. Run `askelira build` first.'));
        process.exitCode = 1;
        return;
      }

      const choices = res.data.goals.map((g) => ({
        name: `${truncate(g.goalText, 50)} ${chalk.gray(`(${g.status})`)}`,
        value: g.id,
      }));

      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'goalId',
          message: 'Select a building:',
          choices,
        },
      ]);

      targetGoalId = answer.goalId;
    } catch (err: unknown) {
      spinner.fail(chalk.red('Connection error'));
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.log(chalk.red(`  ${message}`));
      process.exitCode = 1;
      return;
    }
  }

  // Select interval
  const { interval } = await inquirer.prompt([
    {
      type: 'list',
      name: 'interval',
      message: 'Heartbeat check interval:',
      choices: [
        { name: 'Every 1 minute (testing)', value: 60000 },
        { name: 'Every 5 minutes (default)', value: 300000 },
        { name: 'Every 15 minutes', value: 900000 },
        { name: 'Every 30 minutes', value: 1800000 },
        { name: 'Every 1 hour', value: 3600000 },
        { name: 'Every 6 hours', value: 21600000 },
        { name: 'Every 24 hours', value: 86400000 },
      ],
      default: 300000,
    },
  ]);

  // At this point targetGoalId is always a string
  const resolvedGoalId = targetGoalId as string;

  const spinner = ora(`Starting heartbeat (${formatInterval(interval)})...`).start();

  try {
    const res = await api.startHeartbeatApi(resolvedGoalId, interval);

    if (!res.ok) {
      spinner.fail(chalk.red('Failed to start heartbeat'));
      const errData = res.data as unknown as { error?: string };
      console.log(chalk.red(`  ${errData?.error || `HTTP ${res.status}`}`));
      process.exitCode = 1;
      return;
    }

    spinner.succeed(chalk.green('Heartbeat started'));
    console.log('');
    console.log(`  ${chalk.gray('Goal:')}     ${chalk.cyan(resolvedGoalId)}`);
    console.log(`  ${chalk.gray('Interval:')} ${formatInterval(interval)}`);
    console.log(`  ${chalk.gray('Agent:')}    ${chalk.blue('Steven')}`);
    console.log('');
    console.log(chalk.gray(`  Steven will check live floors every ${formatInterval(interval)}.`));
    console.log(chalk.gray(`  View status: askelira heartbeat ${resolvedGoalId}`));
    console.log(chalk.gray(`  Stop: askelira stop ${resolvedGoalId}`));
    console.log('');
  } catch (err: unknown) {
    spinner.fail(chalk.red('Connection error'));
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(chalk.red(`  ${message}`));
    process.exitCode = 1;
  }
}
