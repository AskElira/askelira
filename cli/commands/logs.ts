// ============================================================
// AskElira CLI — logs command
// ============================================================
// `askelira logs [goalId]` — last 20 logs
// `askelira logs [goalId] --tail` — poll every 3s
// `askelira logs [goalId] --agent alba` — filter by agent

import chalk from 'chalk';
import ora from 'ora';
import * as api from '../lib/api';
import type { LogEntry } from '../lib/api';
import {
  agentColor,
  formatTime,
  translateAction,
  truncate,
} from '../lib/format';

/**
 * Format a single log line for output.
 */
function formatLogLine(log: LogEntry): string {
  const time = chalk.gray(formatTime(log.timestamp));
  const colorFn = agentColor(log.agentName);
  const agent = colorFn(padRight(log.agentName, 8));
  const action = translateAction(log.action);
  const summary = log.outputSummary
    ? chalk.gray(` - ${truncate(log.outputSummary, 60)}`)
    : '';
  return `  ${time} ${agent} ${action}${summary}`;
}

/**
 * Pad a string to the right.
 */
function padRight(str: string, len: number): string {
  if (str.length >= len) return str;
  return str + ' '.repeat(len - str.length);
}

/**
 * Tail mode: poll every 3s for new logs, printing only unseen ones.
 */
async function tailLogs(
  goalId: string,
  options: { agent?: string; floor?: string },
): Promise<void> {
  let lastTimestamp = '';
  const seenIds = new Set<string>();
  let running = true;

  // Handle SIGINT gracefully
  const cleanup = () => {
    running = false;
    console.log('');
    console.log(chalk.gray('  Stopped tailing logs.'));
    process.exit(0);
  };
  process.on('SIGINT', cleanup);

  console.log('');
  console.log(
    chalk.gray(`  Tailing logs for ${goalId}... (Ctrl+C to stop)`),
  );
  console.log('');

  // Initial fetch
  try {
    const res = await api.getLogs(goalId, {
      limit: 20,
      agent: options.agent,
      floor: options.floor,
    });

    if (res.ok && res.data.logs) {
      for (const log of res.data.logs) {
        seenIds.add(log.id);
        console.log(formatLogLine(log));
        if (log.timestamp > lastTimestamp) {
          lastTimestamp = log.timestamp;
        }
      }
    }
  } catch {
    // Initial fetch failed, will retry in poll loop
  }

  console.log('');
  console.log(chalk.gray('  --- live tail ---'));

  // Poll loop
  const poll = async () => {
    if (!running) return;

    try {
      const res = await api.getLogs(goalId, {
        limit: 50,
        agent: options.agent,
        floor: options.floor,
      });

      if (res.ok && res.data.logs) {
        const newLogs = res.data.logs.filter((l) => !seenIds.has(l.id));
        for (const log of newLogs) {
          seenIds.add(log.id);
          console.log(formatLogLine(log));
          if (log.timestamp > lastTimestamp) {
            lastTimestamp = log.timestamp;
          }
        }
      }
    } catch {
      // Silently retry on next poll
    }
  };

  const interval = setInterval(poll, 3000);

  // Keep process alive until SIGINT
  await new Promise<void>((resolve) => {
    const checkRunning = setInterval(() => {
      if (!running) {
        clearInterval(checkRunning);
        clearInterval(interval);
        resolve();
      }
    }, 500);
  });
}

/**
 * Main logs command handler.
 */
export async function logsCommand(
  goalId: string,
  options: { tail?: boolean; agent?: string; floor?: string },
): Promise<void> {
  // Tail mode
  if (options.tail) {
    await tailLogs(goalId, options);
    return;
  }

  // Single fetch mode
  const spinner = ora('Loading logs...').start();

  try {
    const res = await api.getLogs(goalId, {
      limit: 20,
      agent: options.agent,
      floor: options.floor,
    });

    if (!res.ok) {
      spinner.fail(chalk.red('Failed to load logs'));
      const errData = res.data as unknown as { error?: string };
      console.log(chalk.red(`  ${errData?.error || `HTTP ${res.status}`}`));
      process.exitCode = 1;
      return;
    }

    spinner.stop();

    const { logs } = res.data;

    if (!logs || logs.length === 0) {
      console.log('');
      console.log(chalk.gray('  No logs found.'));
      console.log('');
      return;
    }

    console.log('');
    console.log(chalk.bold('  Agent Logs'));
    if (options.agent) {
      console.log(chalk.gray(`  Filtered by agent: ${options.agent}`));
    }
    console.log('');

    for (const log of logs) {
      console.log(formatLogLine(log));
    }

    console.log('');
    console.log(chalk.gray(`  Showing ${logs.length} log(s). Use --tail for live updates.`));
    console.log('');
  } catch (err: unknown) {
    spinner.fail(chalk.red('Connection error'));
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(chalk.red(`  ${message}`));
    process.exitCode = 1;
  }
}
