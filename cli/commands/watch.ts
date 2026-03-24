// ============================================================
// AskElira CLI — watch command
// ============================================================
// `askelira watch [goalId]` — live TUI refresh every 3s

import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
import * as api from '../lib/api';
import type { GoalDetail, LogEntry } from '../lib/api';
import {
  statusBadge,
  progressBar,
  truncate,
  relativeTime,
  agentColor,
  translateAction,
  formatTime,
  boxTop,
  boxBottom,
  boxRow,
  boxDivider,
} from '../lib/format';

// ANSI escape codes for screen control
const CLEAR_SCREEN = '\x1B[2J\x1B[H';
const HIDE_CURSOR = '\x1B[?25l';
const SHOW_CURSOR = '\x1B[?25h';

/**
 * Main watch command handler.
 */
export async function watchCommand(goalId: string): Promise<void> {
  let running = true;
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  // Restore terminal on exit
  function cleanup(): void {
    running = false;
    if (pollInterval) clearInterval(pollInterval);
    process.stdout.write(SHOW_CURSOR);
    if (process.stdin.isTTY && process.stdin.setRawMode) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
    console.log('');
    console.log(chalk.gray('  Stopped watching.'));
  }

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });

  // Initial load with spinner
  const spinner = ora('Connecting to building...').start();

  let lastData: GoalDetail | null = null;

  try {
    const res = await api.getGoal(goalId);
    if (!res.ok) {
      spinner.fail(chalk.red('Failed to load building'));
      const errData = res.data as unknown as { error?: string };
      console.log(chalk.red(`  ${errData?.error || `HTTP ${res.status}`}`));
      process.exitCode = 1;
      return;
    }
    lastData = res.data;
    spinner.stop();
  } catch (err: unknown) {
    spinner.fail(chalk.red('Connection error'));
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(chalk.red(`  ${message}`));
    process.exitCode = 1;
    return;
  }

  // Hide cursor and set up raw mode for keyboard input
  process.stdout.write(HIDE_CURSOR);

  if (process.stdin.isTTY && process.stdin.setRawMode) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (key: string) => {
      if (key === 'q' || key === '\u0003') {
        // q or Ctrl+C
        cleanup();
        process.exit(0);
      }
      if (key === 'l') {
        // Switch to logs view
        cleanup();
        console.log(chalk.gray(`\n  Tip: run \`askelira logs ${goalId} --tail\` for live logs\n`));
        process.exit(0);
      }
    });
  }

  // Render function
  function render(data: GoalDetail): void {
    const { goal, floors, recentLogs } = data;
    const width = 64;
    const liveCount = floors.filter((f) => f.status === 'live').length;
    const progress = floors.length > 0 ? liveCount / floors.length : 0;

    // Clear screen - try console.clear() first for best compatibility
    if (process.stdout.isTTY) {
      console.clear();
    }

    let output = '';

    output += boxTop('AskElira Watch', width) + '\n';
    output += boxRow(`${chalk.bold('Goal:')} ${truncate(goal.goalText, width - 14)}`, width) + '\n';
    output += boxRow(
      `${chalk.gray('Status:')} ${statusBadge(goal.status)}  ${chalk.gray('Progress:')} ${progressBar(progress)} ${Math.round(progress * 100)}%`,
      width,
    ) + '\n';
    output += boxDivider(width) + '\n';

    // Floors section
    output += boxRow(chalk.bold('Floors'), width) + '\n';

    for (const floor of floors) {
      const badge = statusBadge(floor.status);
      const iter = floor.iterationCount > 0 ? chalk.gray(` (iter ${floor.iterationCount})`) : '';
      output +=
        boxRow(
          `  F${floor.floorNumber} ${truncate(floor.name, 25)} ${badge}${iter}`,
          width,
        ) + '\n';
    }

    output += boxDivider(width) + '\n';

    // Recent agent activity
    output += boxRow(chalk.bold('Recent Activity'), width) + '\n';

    const displayLogs = recentLogs.slice(0, 8);
    if (displayLogs.length === 0) {
      output += boxRow(chalk.gray('  No activity yet.'), width) + '\n';
    } else {
      for (const log of displayLogs) {
        const time = chalk.gray(formatTime(log.timestamp));
        const colorFn = agentColor(log.agentName);
        const agent = colorFn(log.agentName);
        const action = translateAction(log.action);
        output += boxRow(`  ${time} ${agent} ${action}`, width) + '\n';
      }
    }

    output += boxDivider(width) + '\n';

    // Keyboard shortcuts
    output +=
      boxRow(
        `${chalk.gray('q')} quit  ${chalk.gray('l')} logs  ${chalk.gray('Refreshing every 3s...')}`,
        width,
      ) + '\n';
    output += boxRow(chalk.gray(`Last updated: ${new Date().toLocaleTimeString()}`), width) + '\n';
    output += boxBottom(width) + '\n';

    process.stdout.write(output);
  }

  // Initial render
  if (lastData) {
    render(lastData);
  }

  // Poll every 3s
  pollInterval = setInterval(async () => {
    if (!running) return;

    try {
      const res = await api.getGoal(goalId);
      if (res.ok) {
        lastData = res.data;
        render(res.data);
      }
    } catch {
      // Silently retry on next poll
    }
  }, 3000);

  // Keep process alive
  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (!running) {
        clearInterval(check);
        resolve();
      }
    }, 500);
  });
}
