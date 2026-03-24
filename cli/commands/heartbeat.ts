// ============================================================
// AskElira CLI — heartbeat command
// ============================================================
// `askelira heartbeat [goalId]` — show status + recent checks
// `askelira heartbeat [goalId] --trigger` — run one cycle now

import chalk from 'chalk';
import ora from 'ora';
import * as api from '../lib/api';
import {
  relativeTime,
  agentColor,
  translateAction,
  formatTime,
  boxTop,
  boxBottom,
  boxRow,
  boxDivider,
} from '../lib/format';

/**
 * Main heartbeat command handler.
 */
export async function heartbeatCommand(
  goalId: string,
  options: { trigger?: boolean },
): Promise<void> {
  // Trigger mode: run one heartbeat cycle
  if (options.trigger) {
    await triggerOneCycle(goalId);
    return;
  }

  // Status mode: show heartbeat info
  await showHeartbeatStatus(goalId);
}

/**
 * Show Steven's heartbeat status and recent checks.
 */
async function showHeartbeatStatus(goalId: string): Promise<void> {
  const spinner = ora('Loading heartbeat status...').start();

  try {
    const res = await api.getHeartbeat(goalId);

    if (!res.ok) {
      spinner.fail(chalk.red('Failed to load heartbeat'));
      const errData = res.data as unknown as { error?: string };
      console.log(chalk.red(`  ${errData?.error || `HTTP ${res.status}`}`));
      process.exitCode = 1;
      return;
    }

    spinner.stop();

    const { status, recentLogs } = res.data;
    const width = 60;

    console.log('');
    console.log(boxTop('Steven Heartbeat', width));

    // Status info
    const activeLabel = status.active
      ? chalk.green('ACTIVE')
      : chalk.gray('INACTIVE');
    console.log(boxRow(`${chalk.gray('Status:')}     ${activeLabel}`, width));
    console.log(boxRow(`${chalk.gray('Goal:')}       ${chalk.cyan(status.goalId)}`, width));
    console.log(
      boxRow(
        `${chalk.gray('Monitoring:')} ${status.liveFloors} live floor(s)`,
        width,
      ),
    );
    console.log(
      boxRow(
        `${chalk.gray('Interval:')}   ${Math.round(status.intervalMs / 1000)}s`,
        width,
      ),
    );

    if (status.lastCheckedAt) {
      console.log(
        boxRow(
          `${chalk.gray('Last check:')} ${relativeTime(status.lastCheckedAt)}`,
          width,
        ),
      );
    }
    if (status.nextCheckAt) {
      console.log(
        boxRow(
          `${chalk.gray('Next check:')} ${relativeTime(status.nextCheckAt)}`,
          width,
        ),
      );
    }

    // Recent heartbeat logs
    if (recentLogs.length > 0) {
      console.log(boxDivider(width));
      console.log(boxRow(chalk.bold('Recent Checks'), width));
      console.log(boxRow('', width));

      for (const log of recentLogs.slice(0, 10)) {
        const time = chalk.gray(formatTime(log.timestamp));
        const colorFn = agentColor(log.agentName);
        const agent = colorFn(log.agentName);
        const action = translateAction(log.action);
        const summary = log.outputSummary
          ? chalk.gray(` - ${log.outputSummary.substring(0, 30)}`)
          : '';
        console.log(boxRow(`  ${time} ${agent} ${action}${summary}`, width));
      }
    }

    console.log(boxBottom(width));
    console.log('');
    console.log(chalk.gray(`  Tip: askelira heartbeat ${goalId} --trigger  to run a check now`));
    console.log('');
  } catch (err: unknown) {
    spinner.fail(chalk.red('Connection error'));
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(chalk.red(`  ${message}`));
    process.exitCode = 1;
  }
}

/**
 * Trigger a single heartbeat cycle and show results.
 */
async function triggerOneCycle(goalId: string): Promise<void> {
  const spinner = ora('Triggering heartbeat cycle...').start();

  try {
    const res = await api.triggerHeartbeat(goalId);

    if (!res.ok) {
      spinner.fail(chalk.red('Failed to trigger heartbeat'));
      const errData = res.data as unknown as { error?: string };
      console.log(chalk.red(`  ${errData?.error || `HTTP ${res.status}`}`));
      process.exitCode = 1;
      return;
    }

    const { message, results } = res.data;
    spinner.succeed(chalk.green(message));

    if (results.length > 0) {
      console.log('');
      for (const r of results) {
        const icon = r.error ? chalk.red('\u2717') : chalk.green('\u2713');
        const info = r.error
          ? chalk.red(r.error)
          : chalk.gray('healthy');
        console.log(`  ${icon} F${r.floorNumber} ${r.name} - ${info}`);
      }
      console.log('');
    } else {
      console.log(chalk.gray('  No live floors to check.'));
      console.log('');
    }
  } catch (err: unknown) {
    spinner.fail(chalk.red('Connection error'));
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(chalk.red(`  ${message}`));
    process.exitCode = 1;
  }
}
