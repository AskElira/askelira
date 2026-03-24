#!/usr/bin/env node
// ============================================================
// AskElira CLI — Main Entry Point
// ============================================================

import { Command } from 'commander';
import chalk from 'chalk';
import { loginCommand } from '../commands/login';
import { logoutCommand } from '../commands/logout';
import { whoamiCommand } from '../commands/whoami';
import { statusCommand } from '../commands/status';
import { floorsCommand } from '../commands/floors';
import { logsCommand } from '../commands/logs';
import { watchCommand } from '../commands/watch';
import { buildCommand } from '../commands/build';
import { heartbeatCommand } from '../commands/heartbeat';
import { workspaceCommand } from '../commands/workspace';
import { runCommand } from '../commands/run';
import { rollbackCommand } from '../commands/rollback';
import { startCommand } from '../commands/start';
import { stopCommand } from '../commands/stop';
import { initCommand } from '../commands/init';
import { completionCommand } from '../commands/completion';
import { executeCommand } from '../commands/execute';
import { retryCommand } from '../commands/retry';
import { configShowCommand, configSearchCommand, configGatewayCommand, configTestCommand } from '../commands/config';
import { gatewayStatusCommand } from '../commands/gateway';
import { checkForUpdates } from '../lib/update-checker';
import * as api from '../lib/api';
import * as auth from '../lib/auth';
import {
  statusBadge,
  truncate,
  relativeTime,
  progressBar,
} from '../lib/format';

// ── Global Error Handling ────────────────────────────────────

process.on('uncaughtException', (err: Error) => {
  console.error('');
  console.error(chalk.red('  Unexpected error:'));
  console.error(chalk.red(`  ${err.message}`));
  if (process.env.DEBUG) {
    console.error(chalk.gray(err.stack || ''));
  }
  console.error('');
  console.error(chalk.gray('  If this keeps happening, file a bug:'));
  console.error(chalk.gray('  https://github.com/askelira/askelira/issues'));
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.error('');
  console.error(chalk.red('  Unhandled error:'));
  console.error(chalk.red(`  ${message}`));
  console.error('');
  process.exit(1);
});

// ── Program Setup ────────────────────────────────────────────

const program = new Command();

program
  .name('askelira')
  .description(
    chalk.cyan(`
    ___   ______ __ __ ______ __    ____  ____   ___
   /   | / ___// //_// ____// /   /  _/ / __ \\ /   |
  / /| | \\__ \\/ ,<  / __/  / /    / /  / /_/ // /| |
 / ___ |___/ / /| |/ /___ / /____/ /  / _  _// ___ |
/_/  |_/____/_/ |_/_____//_____/___/ /_/ |_|/_/  |_|
`) +
      chalk.gray('\nBuild automations from your terminal\n\n') +
      chalk.gray('  Docs:  https://askelira.com/docs\n') +
      chalk.gray('  Host:  https://askelira.com\n'),
  )
  .version('1.0.0')
  .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.gray('$')} askelira init                    ${chalk.gray('Setup wizard (profile + API keys)')}
  ${chalk.gray('$')} askelira build                   ${chalk.gray('Create a new automation')}
  ${chalk.gray('$')} askelira execute <goalId>        ${chalk.gray('Run automation with OpenClaw security')}
  ${chalk.gray('$')} askelira status                  ${chalk.gray('List all buildings')}
  ${chalk.gray('$')} askelira watch <goalId>          ${chalk.gray('Live building dashboard')}
  ${chalk.gray('$')} askelira logs <goalId> --tail     ${chalk.gray('Stream agent logs')}
  ${chalk.gray('$')} askelira completion install       ${chalk.gray('Install shell completions')}
`);

// ── Auth Commands ──────────────────────────────────────────

program
  .command('login')
  .description('Authenticate with your AskElira account')
  .action(async () => {
    await loginCommand();
    await checkForUpdates();
  });

program
  .command('logout')
  .description('Clear stored credentials')
  .action(async () => {
    await logoutCommand();
    await checkForUpdates();
  });

program
  .command('whoami')
  .description('Show current logged-in user')
  .action(async () => {
    whoamiCommand();
    await checkForUpdates();
  });

// ── Building Commands ────────────────────────────────────────

program
  .command('build')
  .description('Create a new goal and start building')
  .argument('[goal]', 'Goal text (or interactive if omitted)')
  .action(async (goal?: string) => {
    await buildCommand(goal);
    await checkForUpdates();
  });

program
  .command('status')
  .description('Show status of a goal or all goals')
  .argument('[goalId]', 'Goal ID (shows all if omitted)')
  .option('--json', 'Output as JSON')
  .action(async (goalId?: string, options?: { json?: boolean }) => {
    if (options?.json) {
      await jsonStatusCommand(goalId);
    } else {
      await statusCommand(goalId);
    }
    await checkForUpdates();
  });

program
  .command('floors')
  .description('List floors for a goal')
  .argument('[goalId]', 'Goal ID (prompts to select if omitted)')
  .option('--json', 'Output as JSON')
  .action(async (goalId?: string, options?: { json?: boolean }) => {
    if (options?.json) {
      await jsonFloorsCommand(goalId);
    } else {
      await floorsCommand(goalId);
    }
    await checkForUpdates();
  });

program
  .command('logs')
  .description('View agent logs for a goal')
  .argument('<goalId>', 'Goal ID')
  .option('--tail', 'Poll for new logs every 3 seconds')
  .option('--agent <name>', 'Filter by agent name (Alba, Vex, David, Elira, Steven)')
  .option('--floor <floorId>', 'Filter by floor ID')
  .action(async (goalId: string, options: { tail?: boolean; agent?: string; floor?: string }) => {
    await logsCommand(goalId, options);
    await checkForUpdates();
  });

program
  .command('watch')
  .description('Live dashboard -- refreshes every 3s')
  .argument('<goalId>', 'Goal ID to watch')
  .action(async (goalId: string) => {
    await watchCommand(goalId);
  });

program
  .command('heartbeat')
  .description('View or trigger Steven heartbeat checks')
  .argument('<goalId>', 'Goal ID')
  .option('--trigger', 'Run one heartbeat cycle immediately')
  .action(async (goalId: string, options: { trigger?: boolean }) => {
    await heartbeatCommand(goalId, options);
    await checkForUpdates();
  });

// ── Floor Control Commands ───────────────────────────────────

program
  .command('run')
  .description('Trigger a heartbeat check manually')
  .argument('[goalId]', 'Goal ID (prompts to select if omitted)')
  .option('--floor <number>', 'Check specific floor number only')
  .option('--dry-run', 'Show what would run without executing')
  .action(async (goalId?: string, options?: { floor?: string; dryRun?: boolean }) => {
    await runCommand(goalId, options);
    await checkForUpdates();
  });

program
  .command('rollback')
  .description('Rollback a floor to a previous snapshot')
  .argument('[goalId]', 'Goal ID (prompts to select if omitted)')
  .action(async (goalId?: string) => {
    await rollbackCommand(goalId);
    await checkForUpdates();
  });

program
  .command('retry')
  .description('Restart stuck builds that are at 0% progress')
  .argument('[goalId]', 'Goal ID (prompts to select if omitted)')
  .action(async (goalId?: string) => {
    await retryCommand(goalId);
    await checkForUpdates();
  });

program
  .command('execute')
  .description('Extract and run automation code with OpenClaw safety verification')
  .argument('<goalId>', 'Goal ID to execute')
  .option('--autorun', 'Automatically run after extraction (skip manual step)')
  .option('--skip-verify', 'Skip OpenClaw safety verification (NOT recommended)')
  .action(async (goalId: string, options: any) => {
    await executeCommand(goalId, options);
    await checkForUpdates();
  });

// ── Workspace Command ────────────────────────────────────────

program
  .command('workspace')
  .description('View, list, or read workspace files')
  .argument('[subcommand]', 'Subcommand: ls, cat, open (default: info)')
  .argument('[args...]', 'Arguments for subcommand (e.g., file path for cat)')
  .action(async (subcommand?: string, args?: string[]) => {
    await workspaceCommand(subcommand, args);
    await checkForUpdates();
  });

// ── Heartbeat Control Commands ───────────────────────────────

program
  .command('start')
  .description('Start the heartbeat monitor for a goal')
  .argument('[goalId]', 'Goal ID (prompts to select if omitted)')
  .action(async (goalId?: string) => {
    await startCommand(goalId);
    await checkForUpdates();
  });

program
  .command('stop')
  .description('Stop the heartbeat monitor for a goal')
  .argument('[goalId]', 'Goal ID (prompts to select if omitted)')
  .action(async (goalId?: string) => {
    await stopCommand(goalId);
    await checkForUpdates();
  });

// ── Setup Commands ───────────────────────────────────────────

program
  .command('init')
  .description('Setup wizard -- operator profile, API keys, .env')
  .action(async () => {
    await initCommand();
    await checkForUpdates();
  });


program
  .command('completion')
  .description('Generate shell completion scripts')
  .argument('[shell]', 'Shell type: bash, zsh, or install')
  .action(async (shell?: string) => {
    completionCommand(shell);
  });

// ── Config Commands ─────────────────────────────────────────

const configCmd = program
  .command('config')
  .description('View and manage configuration');

configCmd
  .command('show')
  .description('Display all configuration settings')
  .action(async () => {
    await configShowCommand();
  });

configCmd
  .command('search')
  .description('Configure search provider and API keys')
  .option('--provider <provider>', 'Search provider: brave, tavily, perplexity, auto')
  .option('--tavily-key <key>', 'Set Tavily API key')
  .option('--brave-key <key>', 'Set Brave Search API key')
  .action(async (options: { provider?: string; tavilyKey?: string; braveKey?: string }) => {
    await configSearchCommand(options);
  });

configCmd
  .command('gateway')
  .description('Configure OpenClaw gateway connection')
  .option('--url <url>', 'Gateway WebSocket URL')
  .option('--token <token>', 'Gateway authentication token')
  .option('--mode <mode>', 'Routing mode: gateway, direct, gateway-only')
  .action(async (options: { url?: string; token?: string; mode?: string }) => {
    await configGatewayCommand(options);
  });

configCmd
  .command('test')
  .description('Test all configured API keys and connections')
  .action(async () => {
    await configTestCommand();
  });

// Default config action — show config
configCmd.action(async () => {
  await configShowCommand();
});

// ── Gateway Command ─────────────────────────────────────────

const gatewayCmd = program
  .command('gateway')
  .description('OpenClaw gateway operations');

gatewayCmd
  .command('status')
  .description('Check gateway connection status')
  .action(async () => {
    await gatewayStatusCommand();
  });

// Default gateway action — show status
gatewayCmd.action(async () => {
  await gatewayStatusCommand();
});

// ── Parse & fallback ──────────────────────────────────────

program.parse(process.argv);

// If no command provided and logged in, show mini dashboard
if (!process.argv.slice(2).length) {
  showMiniDashboard().then(() => checkForUpdates()).catch(() => {
    program.outputHelp();
  });
}

// ── Mini Dashboard ───────────────────────────────────────────

async function showMiniDashboard(): Promise<void> {
  if (!auth.isAuthenticated()) {
    program.outputHelp();
    return;
  }

  try {
    const res = await api.listGoals();
    if (!res.ok || res.data.goals.length === 0) {
      program.outputHelp();
      return;
    }

    const goals = res.data.goals.slice(0, 3);

    console.log('');
    console.log(chalk.bold('  AskElira') + chalk.gray(` -- ${auth.getEmail()}`));
    console.log('');

    for (const goal of goals) {
      const badge = statusBadge(goal.status);
      const goalText = truncate(goal.goalText, 45);
      const progress = goal.floorCount > 0 ? goal.liveFloors / goal.floorCount : 0;
      const bar = goal.floorCount > 0 ? progressBar(progress) : '';
      const time = relativeTime(goal.createdAt);

      console.log(`  ${badge} ${chalk.white(goalText)}`);
      console.log(`    ${chalk.gray('ID:')} ${chalk.cyan(goal.id)}  ${bar ? `${bar} ` : ''}${chalk.gray(time)}`);
    }

    if (res.data.goals.length > 3) {
      console.log(chalk.gray(`  ... and ${res.data.goals.length - 3} more`));
    }

    console.log('');
    console.log(chalk.gray('  Run `askelira --help` for all commands'));
    console.log('');
  } catch {
    program.outputHelp();
  }
}

// ── JSON Output Helpers ──────────────────────────────────────

async function jsonStatusCommand(goalId?: string): Promise<void> {
  try {
    if (goalId) {
      const res = await api.getGoal(goalId);
      if (!res.ok) {
        console.log(JSON.stringify({ error: 'Failed to load', status: res.status }, null, 2));
        process.exitCode = 1;
        return;
      }
      console.log(JSON.stringify(res.data, null, 2));
    } else {
      const res = await api.listGoals();
      if (!res.ok) {
        console.log(JSON.stringify({ error: 'Failed to load', status: res.status }, null, 2));
        process.exitCode = 1;
        return;
      }
      console.log(JSON.stringify(res.data, null, 2));
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(JSON.stringify({ error: message }, null, 2));
    process.exitCode = 1;
  }
}

async function jsonFloorsCommand(goalId?: string): Promise<void> {
  if (!goalId) {
    console.log(JSON.stringify({ error: 'Goal ID required for --json output' }, null, 2));
    process.exitCode = 1;
    return;
  }
  try {
    const res = await api.getGoal(goalId);
    if (!res.ok) {
      console.log(JSON.stringify({ error: 'Failed to load', status: res.status }, null, 2));
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify({ floors: res.data.floors }, null, 2));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.log(JSON.stringify({ error: message }, null, 2));
    process.exitCode = 1;
  }
}
