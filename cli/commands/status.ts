// ============================================================
// AskElira CLI — status command
// ============================================================
// `askelira status` — list all buildings
// `askelira status [goalId]` — detail view

import chalk from 'chalk';
import ora from 'ora';
import * as api from '../lib/api';
import {
  statusBadge,
  progressBar,
  truncate,
  relativeTime,
  boxTop,
  boxBottom,
  boxRow,
  boxDivider,
} from '../lib/format';

/**
 * List mode: show all goals in a compact table.
 */
async function listAllGoals(): Promise<void> {
  const spinner = ora('Loading buildings...').start();

  try {
    const res = await api.listGoals();

    if (!res.ok) {
      spinner.fail(chalk.red('Failed to load buildings'));
      const errData = res.data as unknown as { error?: string };
      console.log(chalk.red(`  ${errData?.error || `HTTP ${res.status}`}`));
      process.exitCode = 1;
      return;
    }

    const { goals } = res.data;
    spinner.stop();

    if (goals.length === 0) {
      console.log('');
      console.log(chalk.gray('  No buildings found.'));
      console.log(chalk.gray('  Run `askelira build` to create your first one.'));
      console.log('');
      return;
    }

    console.log('');
    console.log(chalk.bold('  Your Buildings'));
    console.log('');

    for (const goal of goals) {
      const badge = statusBadge(goal.status);
      const goalText = truncate(goal.goalText, 50);
      const floorInfo = goal.floorCount > 0
        ? `${goal.liveFloors}/${goal.floorCount} floors live`
        : 'No floors';
      const time = relativeTime(goal.createdAt);

      console.log(`  ${badge} ${chalk.white(goalText)}`);
      console.log(`    ${chalk.gray('ID:')} ${chalk.cyan(goal.id)}  ${chalk.gray(floorInfo)}  ${chalk.gray(time)}`);

      // Floor progress bar
      if (goal.floorCount > 0) {
        const progress = goal.liveFloors / goal.floorCount;
        const bar = progressBar(progress);
        console.log(`    ${bar} ${chalk.gray(`${Math.round(progress * 100)}%`)}`);
      }
      console.log('');
    }
  } catch (err: unknown) {
    spinner.fail(chalk.red('Connection error'));
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(chalk.red(`  ${message}`));
    process.exitCode = 1;
  }
}

/**
 * Detail mode: show full goal info with floor progress bars.
 */
async function showGoalDetail(goalId: string): Promise<void> {
  const spinner = ora('Loading building...').start();

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

    const { goal, floors, stevenSuggestions } = res.data;
    const width = 60;
    const liveCount = floors.filter((f) => f.status === 'live').length;
    const progress = floors.length > 0 ? liveCount / floors.length : 0;

    console.log('');
    console.log(boxTop('Building Status', width));
    console.log(boxRow(`${chalk.bold('Goal:')} ${truncate(goal.goalText, width - 14)}`, width));
    console.log(boxRow(`${chalk.gray('ID:')} ${chalk.cyan(goal.id)}`, width));
    console.log(boxRow(`${chalk.gray('Status:')} ${statusBadge(goal.status)}`, width));
    console.log(boxRow(`${chalk.gray('Created:')} ${relativeTime(goal.createdAt)}`, width));
    console.log(boxRow(`${chalk.gray('Progress:')} ${progressBar(progress)} ${Math.round(progress * 100)}%`, width));
    console.log(boxDivider(width));

    // Building summary
    if (goal.buildingSummary) {
      console.log(boxRow(chalk.bold('Blueprint:'), width));
      const summaryLines = wrapText(goal.buildingSummary, width - 6);
      for (const line of summaryLines) {
        console.log(boxRow(chalk.gray(line), width));
      }
      console.log(boxDivider(width));
    }

    // Floors
    console.log(boxRow(chalk.bold(`Floors (${floors.length})`), width));
    console.log(boxRow('', width));

    for (const floor of floors) {
      const floorBadge = statusBadge(floor.status);
      const iter = floor.iterationCount > 0 ? chalk.gray(` iter:${floor.iterationCount}`) : '';
      console.log(
        boxRow(
          `  F${floor.floorNumber} ${chalk.white(truncate(floor.name, 25))} ${floorBadge}${iter}`,
          width,
        ),
      );
      if (floor.description) {
        console.log(boxRow(`     ${chalk.gray(truncate(floor.description, width - 12))}`, width));
      }
    }

    // Steven suggestions
    if (stevenSuggestions && stevenSuggestions.length > 0) {
      console.log(boxDivider(width));
      console.log(boxRow(chalk.bold(`Steven Suggestions (${stevenSuggestions.length})`), width));
      for (const suggestion of stevenSuggestions.slice(0, 5)) {
        console.log(boxRow(`  ${chalk.blue('\u2022')} ${truncate(suggestion, width - 10)}`, width));
      }
    }

    console.log(boxBottom(width));
    console.log('');
    console.log(chalk.gray(`  Tip: askelira floors ${goalId}  |  askelira logs ${goalId}  |  askelira watch ${goalId}`));
    console.log('');
  } catch (err: unknown) {
    spinner.fail(chalk.red('Connection error'));
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(chalk.red(`  ${message}`));
    process.exitCode = 1;
  }
}

/**
 * Wrap text to fit within a given width.
 */
function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (current.length + word.length + 1 > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

/**
 * Main status command handler.
 */
export async function statusCommand(goalId?: string): Promise<void> {
  if (goalId) {
    await showGoalDetail(goalId);
  } else {
    await listAllGoals();
  }
}
