// ============================================================
// AskElira CLI — stop command
// ============================================================
// `askelira stop [goalId]` — stop Steven heartbeat monitoring

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import * as api from '../lib/api';
import { truncate } from '../lib/format';

/**
 * Main stop command handler.
 */
export async function stopCommand(goalId?: string): Promise<void> {
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

  // At this point targetGoalId is always a string
  const resolvedGoalId = targetGoalId as string;

  // Confirm
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Stop heartbeat monitoring for ${chalk.cyan(resolvedGoalId)}?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.gray('  Cancelled.'));
    return;
  }

  const spinner = ora('Stopping heartbeat...').start();

  try {
    const res = await api.stopHeartbeatApi(resolvedGoalId);

    if (!res.ok) {
      spinner.fail(chalk.red('Failed to stop heartbeat'));
      const errData = res.data as unknown as { error?: string };
      console.log(chalk.red(`  ${errData?.error || `HTTP ${res.status}`}`));
      process.exitCode = 1;
      return;
    }

    spinner.succeed(chalk.green('Heartbeat stopped'));
    console.log('');
    console.log(`  ${chalk.gray('Goal:')} ${chalk.cyan(resolvedGoalId)}`);
    console.log(chalk.gray('  Steven is no longer monitoring this building.'));
    console.log('');
    console.log(chalk.gray(`  Restart: askelira start ${resolvedGoalId}`));
    console.log('');
  } catch (err: unknown) {
    spinner.fail(chalk.red('Connection error'));
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(chalk.red(`  ${message}`));
    process.exitCode = 1;
  }
}
