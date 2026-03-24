// ============================================================
// AskElira CLI — run command
// ============================================================
// `askelira run [goalId]` — manually trigger heartbeat check
// `askelira run [goalId] --floor 2` — check specific floor
// `askelira run [goalId] --dry-run` — show what would run

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import * as api from '../lib/api';
import {
  statusBadge,
  truncate,
  agentColor,
  translateAction,
} from '../lib/format';

interface RunOptions {
  floor?: string;
  dryRun?: boolean;
}

/**
 * Main run command handler.
 */
export async function runCommand(
  goalId?: string,
  options: RunOptions = {},
): Promise<void> {
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

  // Dry run mode: show what would run
  if (options.dryRun) {
    await dryRunMode(resolvedGoalId, options.floor);
    return;
  }

  // If specific floor requested, show what we're doing
  if (options.floor) {
    console.log('');
    console.log(chalk.gray(`  Targeting floor ${options.floor} only`));
  }

  // Trigger heartbeat cycle
  const spinner = ora('Running heartbeat check...').start();

  try {
    const res = await api.triggerHeartbeat(resolvedGoalId);

    if (!res.ok) {
      spinner.fail(chalk.red('Failed to run heartbeat'));
      const errData = res.data as unknown as { error?: string };
      console.log(chalk.red(`  ${errData?.error || `HTTP ${res.status}`}`));
      process.exitCode = 1;
      return;
    }

    const { message, results } = res.data;
    spinner.succeed(chalk.green(message));

    if (results.length === 0) {
      console.log(chalk.gray('  No live floors to check.'));
      console.log('');
      return;
    }

    console.log('');

    // Filter by floor if specified
    const filtered = options.floor
      ? results.filter((r) => String(r.floorNumber) === options.floor)
      : results;

    if (filtered.length === 0 && options.floor) {
      console.log(chalk.yellow(`  Floor ${options.floor} not found in results.`));
      console.log(chalk.gray('  Available floors:'));
      for (const r of results) {
        console.log(chalk.gray(`    F${r.floorNumber} ${r.name}`));
      }
      console.log('');
      return;
    }

    for (const r of filtered) {
      const icon = r.error ? chalk.red('\u2717') : chalk.green('\u2713');
      const info = r.error ? chalk.red(r.error) : chalk.gray('healthy');
      console.log(`  ${icon} F${r.floorNumber} ${r.name} - ${info}`);
    }
    console.log('');
  } catch (err: unknown) {
    spinner.fail(chalk.red('Connection error'));
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(chalk.red(`  ${message}`));
    process.exitCode = 1;
  }
}

/**
 * Dry run mode — show what would be checked without executing.
 */
async function dryRunMode(goalId: string, floorFilter?: string): Promise<void> {
  const spinner = ora('Loading building state...').start();

  try {
    const res = await api.getGoal(goalId);

    if (!res.ok) {
      spinner.fail(chalk.red('Failed to load building'));
      const errData = res.data as unknown as { error?: string };
      console.log(chalk.red(`  ${errData?.error || `HTTP ${res.status}`}`));
      process.exitCode = 1;
      return;
    }

    spinner.stop();

    const { goal, floors } = res.data;
    const liveFloors = floors.filter((f) => f.status === 'live');

    console.log('');
    console.log(chalk.bold('  DRY RUN — No changes will be made'));
    console.log('');
    console.log(`  ${chalk.gray('Goal:')} ${truncate(goal.goalText, 50)}`);
    console.log(`  ${chalk.gray('Status:')} ${statusBadge(goal.status)}`);
    console.log(`  ${chalk.gray('Total floors:')} ${floors.length}`);
    console.log(`  ${chalk.gray('Live floors:')} ${liveFloors.length}`);
    console.log('');

    if (liveFloors.length === 0) {
      console.log(chalk.yellow('  No live floors to check. Nothing would run.'));
      console.log('');
      return;
    }

    const targeted = floorFilter
      ? liveFloors.filter((f) => String(f.floorNumber) === floorFilter)
      : liveFloors;

    if (targeted.length === 0 && floorFilter) {
      console.log(chalk.yellow(`  Floor ${floorFilter} is not live. Nothing would run.`));
      console.log('');
      return;
    }

    console.log(chalk.bold('  Steven would check:'));
    for (const f of targeted) {
      console.log(`    ${chalk.blue('\u2022')} F${f.floorNumber} ${f.name} ${statusBadge(f.status)}`);
      if (f.successCondition) {
        console.log(`      ${chalk.gray('Condition:')} ${truncate(f.successCondition, 50)}`);
      }
    }
    console.log('');
    console.log(chalk.gray('  Remove --dry-run to execute.'));
    console.log('');
  } catch (err: unknown) {
    spinner.fail(chalk.red('Connection error'));
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(chalk.red(`  ${message}`));
    process.exitCode = 1;
  }
}
