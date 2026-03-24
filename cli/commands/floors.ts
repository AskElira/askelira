// ============================================================
// AskElira CLI — floors command
// ============================================================
// `askelira floors [goalId]` — detailed floor table

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import * as api from '../lib/api';
import {
  statusBadge,
  relativeTime,
  truncate,
  formatDuration,
  boxTop,
  boxBottom,
  boxRow,
  boxDivider,
} from '../lib/format';

/**
 * Prompt user to select a goal from their list.
 */
async function selectGoal(): Promise<string | null> {
  const spinner = ora('Loading buildings...').start();

  try {
    const res = await api.listGoals();
    spinner.stop();

    if (!res.ok || res.data.goals.length === 0) {
      console.log(chalk.gray('  No buildings found. Run `askelira build` first.'));
      return null;
    }

    const choices = res.data.goals.map((g) => ({
      name: `${truncate(g.goalText, 50)} ${chalk.gray(`(${g.status})`)}`,
      value: g.id,
    }));

    const { goalId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'goalId',
        message: 'Select a building:',
        choices,
      },
    ]);

    return goalId;
  } catch (err: unknown) {
    spinner.fail(chalk.red('Connection error'));
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(chalk.red(`  ${message}`));
    return null;
  }
}

/**
 * Main floors command handler.
 */
export async function floorsCommand(goalId?: string): Promise<void> {
  let targetGoalId = goalId;

  if (!targetGoalId) {
    const selected = await selectGoal();
    if (!selected) {
      process.exitCode = 1;
      return;
    }
    targetGoalId = selected;
  }

  const spinner = ora('Loading floors...').start();

  try {
    const res = await api.getGoal(targetGoalId);

    if (!res.ok) {
      spinner.fail(chalk.red('Failed to load building'));
      const errData = res.data as unknown as { error?: string };
      console.log(chalk.red(`  ${errData?.error || `HTTP ${res.status}`}`));
      process.exitCode = 1;
      return;
    }

    spinner.stop();

    const { goal, floors } = res.data;
    const width = 72;

    console.log('');
    console.log(boxTop(`Floors - ${truncate(goal.goalText, 40)}`, width));

    if (floors.length === 0) {
      console.log(boxRow(chalk.gray('No floors designed yet.'), width));
      console.log(boxBottom(width));
      return;
    }

    // Header
    console.log(
      boxRow(
        `${chalk.bold(pad('Floor', 8))}${chalk.bold(pad('Name', 22))}${chalk.bold(pad('Status', 14))}${chalk.bold(pad('Iter', 6))}${chalk.bold(pad('Time', 12))}`,
        width,
      ),
    );
    console.log(boxDivider(width));

    for (const floor of floors) {
      const floorNum = pad(`F${floor.floorNumber}`, 8);
      const name = pad(truncate(floor.name, 20), 22);
      const badge = pad(statusBadgeRaw(floor.status), 14);
      const iter = pad(String(floor.iterationCount), 6);
      const time = floor.completedAt
        ? pad(relativeTime(floor.completedAt), 12)
        : floor.status === 'pending'
          ? pad(chalk.gray('-'), 12)
          : pad(relativeTime(floor.createdAt), 12);

      console.log(boxRow(`${floorNum}${name}${badge}${iter}${time}`, width));

      // Success condition on separate line
      if (floor.successCondition) {
        console.log(
          boxRow(
            `        ${chalk.gray(truncate(floor.successCondition, width - 16))}`,
            width,
          ),
        );
      }
    }

    console.log(boxDivider(width));

    // Summary row
    const liveCount = floors.filter((f) => f.status === 'live').length;
    const buildingCount = floors.filter((f) =>
      ['researching', 'building', 'auditing'].includes(f.status),
    ).length;
    const blockedCount = floors.filter((f) =>
      ['blocked', 'broken'].includes(f.status),
    ).length;

    const summaryParts = [
      chalk.green(`${liveCount} live`),
      chalk.yellow(`${buildingCount} active`),
      chalk.gray(`${floors.length - liveCount - buildingCount - blockedCount} pending`),
    ];
    if (blockedCount > 0) {
      summaryParts.push(chalk.red(`${blockedCount} blocked`));
    }

    console.log(boxRow(`Summary: ${summaryParts.join('  ')}`, width));

    // Heartbeat status
    try {
      const hbRes = await api.getHeartbeat(targetGoalId);
      if (hbRes.ok) {
        const hb = hbRes.data.status;
        const hbStatus = hb.active
          ? chalk.green('ACTIVE')
          : chalk.gray('INACTIVE');
        const lastCheck = hb.lastCheckedAt
          ? relativeTime(hb.lastCheckedAt)
          : chalk.gray('never');
        console.log(boxDivider(width));
        console.log(
          boxRow(
            `${chalk.blue('Steven:')} ${hbStatus}  ${chalk.gray('Last check:')} ${lastCheck}  ${chalk.gray('Monitoring:')} ${hb.liveFloors} floor(s)`,
            width,
          ),
        );
      }
    } catch {
      // Heartbeat info is optional — don't fail the command
    }

    console.log(boxBottom(width));
    console.log('');
  } catch (err: unknown) {
    spinner.fail(chalk.red('Connection error'));
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(chalk.red(`  ${message}`));
    process.exitCode = 1;
  }
}

/**
 * Pad a string (accounting for ANSI) to a minimum length.
 */
function pad(str: string, len: number): string {
  // Strip ANSI for length calculation
  // eslint-disable-next-line no-control-regex
  const stripped = str.replace(/\u001B\[[0-9;]*[a-zA-Z]/g, '');
  const diff = len - stripped.length;
  if (diff <= 0) return str;
  return str + ' '.repeat(diff);
}

/**
 * Raw status badge without brackets for table use.
 */
function statusBadgeRaw(status: string): string {
  const colors: Record<string, (s: string) => string> = {
    planning: chalk.blue,
    building: chalk.yellow,
    goal_met: chalk.green,
    blocked: chalk.red,
    pending: chalk.gray,
    researching: chalk.cyan,
    auditing: chalk.magenta,
    live: chalk.green,
    broken: chalk.red,
  };
  const colorFn = colors[status] || chalk.white;
  return colorFn(status.toUpperCase());
}
