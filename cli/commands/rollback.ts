// ============================================================
// AskElira CLI — rollback command
// ============================================================
// `askelira rollback [goalId]` — restore floor to prior snapshot
// Interactive: select floor, select snapshot, confirm, execute.

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import * as api from '../lib/api';
import {
  statusBadge,
  truncate,
  relativeTime,
} from '../lib/format';

/**
 * Main rollback command handler.
 */
export async function rollbackCommand(goalId?: string): Promise<void> {
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

  // Load goal and floors
  const loadSpinner = ora('Loading floors...').start();

  let floors: Array<{
    id: string;
    floorNumber: number;
    name: string;
    status: string;
    iterationCount: number;
  }>;

  try {
    const res = await api.getGoal(resolvedGoalId);

    if (!res.ok) {
      loadSpinner.fail(chalk.red('Failed to load building'));
      const errData = res.data as unknown as { error?: string };
      console.log(chalk.red(`  ${errData?.error || `HTTP ${res.status}`}`));
      process.exitCode = 1;
      return;
    }

    loadSpinner.stop();
    floors = res.data.floors;

    if (floors.length === 0) {
      console.log(chalk.gray('  No floors found for this building.'));
      process.exitCode = 1;
      return;
    }
  } catch (err: unknown) {
    loadSpinner.fail(chalk.red('Connection error'));
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(chalk.red(`  ${message}`));
    process.exitCode = 1;
    return;
  }

  // Select floor
  const floorChoices = floors.map((f) => ({
    name: `F${f.floorNumber} ${f.name} ${statusBadge(f.status)} (${f.iterationCount} iterations)`,
    value: f.id,
  }));

  const { floorId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'floorId',
      message: 'Select floor to rollback:',
      choices: floorChoices,
    },
  ]);

  const selectedFloor = floors.find((f) => f.id === floorId);

  // Load snapshots for this floor
  const snapSpinner = ora('Loading snapshots...').start();

  try {
    const snapRes = await api.getSnapshots(floorId);

    if (!snapRes.ok) {
      snapSpinner.fail(chalk.red('Failed to load snapshots'));
      const errData = snapRes.data as unknown as { error?: string };
      console.log(chalk.red(`  ${errData?.error || `HTTP ${snapRes.status}`}`));
      process.exitCode = 1;
      return;
    }

    snapSpinner.stop();

    const snapshots = snapRes.data.snapshots;

    if (!snapshots || snapshots.length === 0) {
      console.log('');
      console.log(chalk.yellow('  No snapshots available for this floor.'));
      console.log(chalk.gray('  Snapshots are created automatically before destructive changes.'));
      console.log(chalk.gray('  This floor may not have been modified since creation.'));
      console.log('');
      return;
    }

    // Select snapshot
    const snapshotChoices = snapshots.map((s: { id: string; reason: string; status: string; createdAt: string }) => ({
      name: `${s.reason} ${chalk.gray(`[${s.status}]`)} ${chalk.gray(relativeTime(s.createdAt))}`,
      value: s.id,
    }));

    const { snapshotId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'snapshotId',
        message: `Select snapshot to restore (${snapshots.length} available):`,
        choices: snapshotChoices,
      },
    ]);

    // Confirm
    const floorLabel = selectedFloor
      ? `F${selectedFloor.floorNumber} ${selectedFloor.name}`
      : floorId;

    const selectedSnapshot = snapshots.find((s: { id: string }) => s.id === snapshotId);
    const snapshotLabel = selectedSnapshot
      ? `"${selectedSnapshot.reason}" (${selectedSnapshot.status})`
      : snapshotId;

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Rollback ${floorLabel} to ${snapshotLabel}?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.gray('  Rollback cancelled.'));
      return;
    }

    // Execute rollback
    const rollbackSpinner = ora('Rolling back floor...').start();

    const rollbackRes = await api.rollbackFloor(floorId, snapshotId);

    if (!rollbackRes.ok) {
      rollbackSpinner.fail(chalk.red('Rollback failed'));
      const errData = rollbackRes.data as unknown as { error?: string };
      console.log(chalk.red(`  ${errData?.error || `HTTP ${rollbackRes.status}`}`));
      process.exitCode = 1;
      return;
    }

    rollbackSpinner.succeed(chalk.green(`Floor rolled back successfully`));
    console.log('');
    console.log(`  ${chalk.gray('Floor:')} ${floorLabel}`);
    console.log(`  ${chalk.gray('Snapshot:')} ${snapshotLabel}`);
    console.log('');
    console.log(chalk.gray(`  Tip: askelira floors ${resolvedGoalId}  to verify the rollback`));
    console.log('');
  } catch (err: unknown) {
    snapSpinner.stop();
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(chalk.red(`  ${message}`));
    process.exitCode = 1;
  }
}
