#!/usr/bin/env node
'use strict';

/**
 * Enhanced AskElira CLI with Beautiful Visual Output
 *
 * Features:
 * - Colorful branded output
 * - ASCII art banner
 * - Progress bars and spinners
 * - Boxed messages
 * - Gradient text
 * - Interactive prompts
 * - Conversational TUI dashboard (talk to your dashboard!)
 */

const { Command } = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const { SingleBar, MultiBar, Presets } = require('cli-progress');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

// Dynamic imports for ES modules (boxen, gradient-string, ora)
let boxen, gradient, ora;

async function loadESModules() {
  try {
    boxen = (await import('boxen')).default;
    gradient = (await import('gradient-string')).default;
    ora = (await import('ora')).default;
  } catch (error) {
    console.error('Failed to load dependencies:', error.message);
    process.exit(1);
  }
}

const program = new Command();
const WORKSPACE_DIR = path.join(os.homedir(), 'askelira');

// ---------------------------------------------------------------------------
// AskElira Brand Colors
// ---------------------------------------------------------------------------

const colors = {
  primary: '#2dd4bf',      // Teal/Cyan
  secondary: '#a78bfa',    // Purple
  success: '#4ade80',      // Green
  warning: '#facc15',      // Yellow
  error: '#f87171',        // Red
  info: '#60a5fa',         // Blue
  agent: {
    alba: '#4ade80',
    david: '#2dd4bf',
    vex: '#f87171',
    elira: '#a78bfa',
    steven: '#facc15',
  }
};

// ---------------------------------------------------------------------------
// ASCII Art Banner
// ---------------------------------------------------------------------------

function showBanner() {
  console.clear();
  const banner = figlet.textSync('AskElira', {
    font: 'ANSI Shadow',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });

  console.log(gradient.pastel.multiline(banner));
  console.log(chalk.hex(colors.primary).bold('  ChatGPT for Automations'));
  console.log(chalk.gray('  AI agents that build working code\n'));
}

// ---------------------------------------------------------------------------
// Styled Messages
// ---------------------------------------------------------------------------

function successBox(message, title = 'Success') {
  console.log(boxen(chalk.hex(colors.success)(message), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: colors.success,
    title: chalk.hex(colors.success).bold(`✓ ${title}`),
    titleAlignment: 'center',
  }));
}

function errorBox(message, title = 'Error') {
  console.log(boxen(chalk.hex(colors.error)(message), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: colors.error,
    title: chalk.hex(colors.error).bold(`✗ ${title}`),
    titleAlignment: 'center',
  }));
}

function infoBox(message, title = 'Info') {
  console.log(boxen(chalk.hex(colors.info)(message), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: colors.info,
    title: chalk.hex(colors.info).bold(`ⓘ ${title}`),
    titleAlignment: 'center',
  }));
}

function warningBox(message, title = 'Warning') {
  console.log(boxen(chalk.hex(colors.warning)(message), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: colors.warning,
    title: chalk.hex(colors.warning).bold(`⚠ ${title}`),
    titleAlignment: 'center',
  }));
}

// ---------------------------------------------------------------------------
// Progress Indicators
// ---------------------------------------------------------------------------

function createProgressBar(title) {
  return new SingleBar({
    format: chalk.hex(colors.primary)(`${title} |`) +
            chalk.hex(colors.secondary)('{bar}') +
            chalk.hex(colors.primary)('| {percentage}%') +
            chalk.gray(' | {value}/{total} | {status}'),
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true,
  }, Presets.shades_classic);
}

function createSpinner(text) {
  return ora({
    text: chalk.hex(colors.primary)(text),
    spinner: 'dots12',
    color: 'cyan',
  });
}

// ---------------------------------------------------------------------------
// Building Visualization
// ---------------------------------------------------------------------------

function showBuildingProgress(floors = 5) {
  console.log(chalk.hex(colors.primary).bold('\n🏢 Building Progress:\n'));

  const multibar = new MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format: '{name} |{bar}| {percentage}% | {status}',
    barCompleteChar: '█',
    barIncompleteChar: '░',
  }, Presets.shades_grey);

  const floorBars = [];
  for (let i = 1; i <= floors; i++) {
    const bar = multibar.create(100, 0, {
      name: chalk.hex(colors.secondary)(`Floor ${i}`),
      status: chalk.gray('pending'),
    });
    floorBars.push(bar);
  }

  // Simulate building progress
  const interval = setInterval(() => {
    floorBars.forEach((bar, index) => {
      const current = bar.value;
      if (current < 100) {
        const increment = Math.floor(Math.random() * 15) + 5;
        const newValue = Math.min(current + increment, 100);
        bar.update(newValue, {
          status: newValue >= 100 ?
            chalk.hex(colors.success)('live ✓') :
            chalk.hex(colors.warning)('building...'),
        });
      }
    });

    // Check if all complete
    if (floorBars.every(bar => bar.value >= 100)) {
      clearInterval(interval);
      multibar.stop();
      successBox('All floors are live! 🎉', 'Building Complete');
    }
  }, 500);
}

// ---------------------------------------------------------------------------
// Agent Activity Display
// ---------------------------------------------------------------------------

function showAgentActivity() {
  const agents = ['Alba', 'David', 'Vex', 'Elira', 'Steven'];
  const actions = [
    'researching patterns',
    'building floor',
    'auditing code',
    'fixing bugs',
    'deploying changes',
  ];

  console.log(chalk.hex(colors.primary).bold('\n🤖 Agent Activity:\n'));

  agents.forEach((agent, index) => {
    const color = Object.values(colors.agent)[index];
    const action = actions[index];
    console.log(
      chalk.hex(color).bold(`  ${agent.padEnd(8)}`) +
      chalk.gray(' → ') +
      chalk.white(action) +
      chalk.gray(` (Floor ${index + 1})`)
    );
  });
  console.log();
}

// ---------------------------------------------------------------------------
// Dashboard Summary
// ---------------------------------------------------------------------------

function showDashboard(stats = {}) {
  const {
    buildings = 3,
    floors = 12,
    liveFloors = 8,
    agents = 5,
    activeBuildings = 2,
  } = stats;

  const dashboardContent = `
${chalk.hex(colors.primary).bold('Buildings:')}     ${chalk.white(buildings)} total, ${chalk.hex(colors.success)(activeBuildings)} active
${chalk.hex(colors.secondary).bold('Floors:')}       ${chalk.white(floors)} total, ${chalk.hex(colors.success)(liveFloors)} live
${chalk.hex(colors.warning).bold('Agents:')}       ${chalk.white(agents)} active
${chalk.hex(colors.info).bold('Status:')}       ${chalk.hex(colors.success)('●')} All systems operational
  `;

  console.log(boxen(dashboardContent, {
    padding: 1,
    margin: 1,
    borderStyle: 'double',
    borderColor: colors.primary,
    title: chalk.hex(colors.primary).bold('📊 AskElira Dashboard'),
    titleAlignment: 'center',
  }));
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

program
  .name('askelira')
  .description('ChatGPT for Automations - AI agents that build working code\n' +
              '  💬 NEW: Conversational TUI dashboard! Run "askelira info" to learn more')
  .version('2.1.0')
  .hook('preAction', () => {
    // Show banner before any command
    if (!process.env.ASKELIRA_NO_BANNER) {
      showBanner();
    }
  });

// init command with enhanced visuals
program
  .command('init')
  .description('Create workspace with visual setup wizard')
  .action(async () => {
    const spinner = createSpinner('Initializing AskElira workspace...');
    spinner.start();

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!fs.existsSync(WORKSPACE_DIR)) {
      fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
      spinner.succeed(chalk.hex(colors.success)(`Created workspace: ${WORKSPACE_DIR}`));
    } else {
      spinner.info(chalk.hex(colors.info)(`Workspace exists: ${WORKSPACE_DIR}`));
    }

    // Create files
    const files = {
      'SOUL.md': '# SOUL.md - Your AI\'s Personality\n',
      'AGENTS.md': '# AGENTS.md - Current Tasks & Results\n',
      'TOOLS.md': '# TOOLS.md - Your API Keys & Capabilities\n',
    };

    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(WORKSPACE_DIR, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(chalk.hex(colors.success)(`  ✓ Created ${filename}`));
      } else {
        console.log(chalk.gray(`  ⏭  ${filename} already exists`));
      }
    }

    successBox(
      `Workspace ready at:\n${chalk.bold(WORKSPACE_DIR)}\n\n` +
      `Next steps:\n` +
      `  1. Edit ${chalk.bold('AGENTS.md')} to set your goal\n` +
      `  2. Run ${chalk.hex(colors.primary).bold('askelira web')} to start UI\n` +
      `  3. Run ${chalk.hex(colors.primary).bold('askelira dashboard')} for conversational TUI\n\n` +
      chalk.hex(colors.info)('💬 Tip: ') + chalk.gray('The dashboard is conversational - just talk to it!'),
      'Setup Complete'
    );
  });

// web command
program
  .command('web')
  .description('Start web UI with enhanced startup display')
  .option('-p, --port <port>', 'Port to run on', '3001')
  .action((options) => {
    const port = options.port || '3001';

    infoBox(
      `Starting AskElira web interface...\n\n` +
      `URL: ${chalk.hex(colors.primary).bold(`http://localhost:${port}`)}\n` +
      `Press ${chalk.bold('Ctrl+C')} to stop`,
      '🌐 Web Server'
    );

    const env = { ...process.env, PORT: port };
    const child = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      env,
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', (err) => {
      errorBox(`Failed to start: ${err.message}`, 'Server Error');
      process.exit(1);
    });
  });

// dashboard command - Conversational TUI mode
program
  .command('dashboard')
  .alias('tui')
  .description('Launch conversational terminal dashboard - talk to your dashboard!')
  .action(() => {
    infoBox(
      '💬 Starting Conversational TUI Dashboard...\n\n' +
      chalk.hex(colors.primary).bold('Talk to your dashboard with natural language!\n\n') +
      chalk.gray('Examples:\n') +
      chalk.gray('  • "show me the dashboard"\n') +
      chalk.gray('  • "what are the agents doing?"\n') +
      chalk.gray('  • "how is customer dashboard?"\n') +
      chalk.gray('  • "list all buildings"\n') +
      chalk.gray('  • "help" for more commands\n\n') +
      'Type ' + chalk.hex(colors.primary).bold('"quit"') + ' or press ' + chalk.bold('Ctrl+C') + ' to exit',
      '💬 Conversational Dashboard'
    );

    // Launch the conversational TUI
    const tuiPath = path.join(__dirname, 'tui-dashboard.js');
    const child = spawn('node', [tuiPath], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', (err) => {
      errorBox(`Failed to start TUI: ${err.message}`, 'TUI Error');
      process.exit(1);
    });
  });

// status command
program
  .command('status')
  .description('Show current building status with visual progress')
  .action(() => {
    showDashboard({
      buildings: 3,
      floors: 12,
      liveFloors: 8,
      agents: 5,
      activeBuildings: 2,
    });
    showAgentActivity();
  });

// build command (simulation)
program
  .command('build')
  .description('Visualize building process with progress bars')
  .option('-f, --floors <number>', 'Number of floors', '5')
  .action((options) => {
    infoBox('Starting building process...', '🏗️ Build');
    showBuildingProgress(parseInt(options.floors, 10));
  });

// agents command
program
  .command('agents')
  .description('Show agent activity in real-time')
  .action(() => {
    showAgentActivity();

    console.log(chalk.hex(colors.info).bold('💬 Tip: ') +
                chalk.gray('Run ') +
                chalk.hex(colors.primary)('askelira dashboard') +
                chalk.gray(' for live updates and ask ') +
                chalk.hex(colors.info)('"what are agents doing?"'));
  });

// help command override to show conversational TUI info
program
  .command('info')
  .description('Show detailed information about conversational TUI')
  .action(() => {
    console.log();
    console.log(boxen(
      chalk.hex(colors.primary).bold('💬 Conversational Dashboard!\n\n') +
      chalk.gray('The ') + chalk.hex(colors.primary).bold('askelira dashboard') +
      chalk.gray(' command launches a conversational interface.\n') +
      chalk.gray('Talk to your dashboard using natural language!\n\n') +
      chalk.hex(colors.secondary).bold('Examples:\n\n') +
      chalk.hex(colors.info)('  askelira> show me the dashboard\n') +
      chalk.hex(colors.info)('  askelira> what are the agents doing?\n') +
      chalk.hex(colors.info)('  askelira> how is customer dashboard?\n') +
      chalk.hex(colors.info)('  askelira> list all buildings\n') +
      chalk.hex(colors.info)('  askelira> help\n') +
      chalk.hex(colors.info)('  askelira> quit\n\n') +
      chalk.hex(colors.success).bold('✨ Features:\n\n') +
      chalk.gray('  • Natural language understanding\n') +
      chalk.gray('  • Real-time updates every 5 seconds\n') +
      chalk.gray('  • Color-coded agents and buildings\n') +
      chalk.gray('  • Progress bars and status indicators\n') +
      chalk.gray('  • Helpful suggestions when confused\n\n') +
      chalk.hex(colors.warning).bold('Try it now:\n\n') +
      chalk.hex(colors.primary)('  askelira dashboard'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: colors.primary,
        title: chalk.hex(colors.primary).bold('💬 Conversational TUI'),
        titleAlignment: 'center',
      }
    ));
  });

// Main execution
async function main() {
  await loadESModules();
  program.parse(process.argv);

  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    showDashboard();
    console.log(chalk.hex(colors.info).bold('\nAvailable Commands:\n'));
    console.log(chalk.hex(colors.primary)('  askelira init') + chalk.gray('      - Initialize workspace'));
    console.log(chalk.hex(colors.primary)('  askelira web') + chalk.gray('       - Start web UI'));
    console.log(chalk.hex(colors.primary)('  askelira dashboard') + chalk.gray('  - Launch conversational TUI'));
    console.log(chalk.hex(colors.primary)('  askelira status') + chalk.gray('    - Show current status'));
    console.log(chalk.hex(colors.primary)('  askelira build') + chalk.gray('     - Simulate building'));
    console.log(chalk.hex(colors.primary)('  askelira agents') + chalk.gray('    - Show agent activity'));
    console.log();
    console.log(boxen(
      chalk.hex(colors.primary).bold('💬 New: Conversational Dashboard!\n\n') +
      chalk.gray('The dashboard command now launches a conversational interface.\n') +
      chalk.gray('Talk to your dashboard using natural language:\n\n') +
      chalk.hex(colors.info)('  "show dashboard"') + chalk.gray(' - View stats\n') +
      chalk.hex(colors.info)('  "what are agents doing?"') + chalk.gray(' - See agent activity\n') +
      chalk.hex(colors.info)('  "how is [building] doing?"') + chalk.gray(' - Check building\n') +
      chalk.hex(colors.info)('  "help"') + chalk.gray(' - See all commands'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: colors.primary,
        title: chalk.hex(colors.primary).bold('✨ Featured'),
        titleAlignment: 'center',
      }
    ));
    console.log(chalk.gray('Run any command with --help for more info\n'));
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
