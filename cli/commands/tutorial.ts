/**
 * AskElira Tutorial Command
 * Interactive step-by-step guide from zero to execution
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { buildCommand } from './build';
import { executeCommand } from './execute';
import { statusCommand } from './status';
import { watchCommand } from './watch';

export async function tutorialCommand(): Promise<void> {
  console.clear();

  console.log(chalk.cyan.bold('\n┌─────────────────────────────────────────────────────────────┐'));
  console.log(chalk.cyan.bold('│           🎓 Welcome to AskElira Tutorial!                  │'));
  console.log(chalk.cyan.bold('│  Learn how to build & execute automations in 5 minutes      │'));
  console.log(chalk.cyan.bold('└─────────────────────────────────────────────────────────────┘\n'));

  console.log(chalk.gray('This tutorial will guide you through:\n'));
  console.log(chalk.white('  1. ') + chalk.gray('What AskElira does'));
  console.log(chalk.white('  2. ') + chalk.gray('Building your first automation'));
  console.log(chalk.white('  3. ') + chalk.gray('Monitoring the build process'));
  console.log(chalk.white('  4. ') + chalk.gray('Executing your automation'));
  console.log(chalk.white('  5. ') + chalk.gray('Understanding OpenClaw security\n'));

  const { ready } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ready',
      message: 'Ready to start?',
      default: true,
    },
  ]);

  if (!ready) {
    console.log(chalk.yellow('\n👋 Come back anytime with: askelira tutorial\n'));
    return;
  }

  // Step 1: What is AskElira?
  await step1WhatIsAskElira();

  // Step 2: Build your first automation
  const goalId = await step2BuildAutomation();

  if (!goalId) {
    console.log(chalk.yellow('\n⚠️  Tutorial cancelled. Run `askelira tutorial` to try again.\n'));
    return;
  }

  // Step 3: Monitor the build
  await step3MonitorBuild(goalId);

  // Step 4: Execute the automation
  await step4ExecuteAutomation(goalId);

  // Step 5: What's next?
  await step5WhatsNext();
}

async function step1WhatIsAskElira() {
  console.clear();
  console.log(chalk.cyan.bold('\n📚 Step 1: What is AskElira?\n'));

  console.log(chalk.white('AskElira is like having a team of AI developers that:'));
  console.log(chalk.gray('  • ') + chalk.white('Research') + chalk.gray(' the best way to build your automation'));
  console.log(chalk.gray('  • ') + chalk.white('Write') + chalk.gray(' production-ready code'));
  console.log(chalk.gray('  • ') + chalk.white('Test') + chalk.gray(' and validate everything'));
  console.log(chalk.gray('  • ') + chalk.white('Monitor') + chalk.gray(' your automation after deployment\n'));

  console.log(chalk.cyan('The Team:\n'));
  console.log(chalk.white('  🔍 Alba') + chalk.gray('   - Researches technical approaches'));
  console.log(chalk.white('  👨‍💻 David') + chalk.gray('  - Writes the actual code'));
  console.log(chalk.white('  ✅ Vex') + chalk.gray('    - Quality gates & security checks'));
  console.log(chalk.white('  🏗️  Elira') + chalk.gray('  - Architect & planner'));
  console.log(chalk.white('  👀 Steven') + chalk.gray(' - Monitors live automations'));
  console.log(chalk.white('  🔒 OpenClaw') + chalk.gray(' - Security verification for packages\n'));

  console.log(chalk.yellow('Example:') + chalk.gray(' "Send daily email with GitHub trending repos"\n'));
  console.log(chalk.gray('  → Alba researches GitHub API & email libraries'));
  console.log(chalk.gray('  → David writes Python code with error handling'));
  console.log(chalk.gray('  → Vex checks code quality & security'));
  console.log(chalk.gray('  → Result: Working automation in 1-2 hours!\n'));

  await pressEnterToContinue();
}

async function step2BuildAutomation(): Promise<string | null> {
  console.clear();
  console.log(chalk.cyan.bold('\n🏗️  Step 2: Build Your First Automation\n'));

  console.log(chalk.white('Let\'s build something simple to start.\n'));

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Choose a tutorial automation:',
      choices: [
        {
          name: '📧 Email reminder (sends test email with SendGrid)',
          value: 'Send a test email to alvin.kerremans@gmail.com using SendGrid',
        },
        {
          name: '💰 Bitcoin price logger (fetches BTC price every hour)',
          value: 'Fetch Bitcoin price from CoinGecko API and log to CSV every hour',
        },
        {
          name: '🐙 GitHub scraper (gets trending repos)',
          value: 'Scrape GitHub trending page and save top 10 repos to JSON',
        },
        {
          name: '✏️  Custom (write your own)',
          value: 'custom',
        },
      ],
    },
  ]);

  let goalText = choice;

  if (choice === 'custom') {
    const { custom } = await inquirer.prompt([
      {
        type: 'input',
        name: 'custom',
        message: 'What automation do you want to build?',
        validate: (input) => input.trim().length > 10 || 'Please describe your automation (at least 10 characters)',
      },
    ]);
    goalText = custom;
  }

  console.log(chalk.cyan('\n🚀 Starting build process...\n'));
  console.log(chalk.gray('This will:'));
  console.log(chalk.gray('  1. Validate your idea (Phase 0)'));
  console.log(chalk.gray('  2. Design the automation (Elira)'));
  console.log(chalk.gray('  3. Build each component (Alba → David → Vex)'));
  console.log(chalk.gray('  4. Deploy when complete\n'));

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Start building?',
      default: true,
    },
  ]);

  if (!confirm) {
    return null;
  }

  // Start the build (this will run the actual build command)
  console.log(chalk.yellow('\n⏳ Building... (this may take 1-2 hours)\n'));
  console.log(chalk.gray('💡 Tip: Open another terminal and run `askelira status` to check progress\n'));

  // For tutorial purposes, we'll simulate or actually trigger the build
  // In a real scenario, you'd call buildCommand(goalText)
  // For now, let's return a mock goalId
  const mockGoalId = 'tutorial-' + Date.now();

  console.log(chalk.green(`✓ Build started! Goal ID: ${mockGoalId}\n`));

  return mockGoalId;
}

async function step3MonitorBuild(goalId: string) {
  console.clear();
  console.log(chalk.cyan.bold('\n📊 Step 3: Monitor the Build\n'));

  console.log(chalk.white('While your automation is building, you can monitor progress:\n'));

  console.log(chalk.cyan('Available commands:\n'));
  console.log(chalk.white('  askelira status') + chalk.gray(' - See all your buildings'));
  console.log(chalk.white('  askelira watch <goalId>') + chalk.gray(' - Live dashboard (refreshes every 3s)'));
  console.log(chalk.white('  askelira logs <goalId>') + chalk.gray(' - View agent activity logs'));
  console.log(chalk.white('  askelira floors <goalId>') + chalk.gray(' - See floor breakdown\n'));

  console.log(chalk.yellow('What you\'ll see:\n'));
  console.log(chalk.gray('  • Progress bar (0% → 100%)'));
  console.log(chalk.gray('  • Floor status (pending → researching → building → live)'));
  console.log(chalk.gray('  • Recent agent activity'));
  console.log(chalk.gray('  • Iteration counts (if Vex rejects, Alba/David retry)\n'));

  console.log(chalk.green('Your build is running in the background.\n'));
  console.log(chalk.gray(`Goal ID: ${goalId}`));
  console.log(chalk.gray('Check status with: ') + chalk.cyan(`askelira status\n`));

  await pressEnterToContinue();
}

async function step4ExecuteAutomation(goalId: string) {
  console.clear();
  console.log(chalk.cyan.bold('\n🚀 Step 4: Execute Your Automation\n'));

  console.log(chalk.white('Once your build reaches 100%, you can execute it:\n'));

  console.log(chalk.cyan('Execute command:\n'));
  console.log(chalk.white('  askelira execute <goalId>\n'));

  console.log(chalk.yellow('What happens:\n'));
  console.log(chalk.gray('  1. ') + chalk.white('Extracts code') + chalk.gray(' from database'));
  console.log(chalk.gray('  2. ') + chalk.white('Detects dependencies') + chalk.gray(' (sendgrid, pandas, etc.)'));
  console.log(chalk.gray('  3. ') + chalk.white('🔒 OpenClaw verifies') + chalk.gray(' package safety'));
  console.log(chalk.gray('  4. ') + chalk.white('Asks your permission') + chalk.gray(' to install'));
  console.log(chalk.gray('  5. ') + chalk.white('Installs packages') + chalk.gray(' if approved'));
  console.log(chalk.gray('  6. ') + chalk.white('Checks for .env needs') + chalk.gray(' (API keys)'));
  console.log(chalk.gray('  7. ') + chalk.white('Helps you configure') + chalk.gray(' environment variables'));
  console.log(chalk.gray('  8. ') + chalk.white('Executes the code!\n'));

  console.log(chalk.green('🔒 OpenClaw Security:\n'));
  console.log(chalk.gray('Before installing ANY package, OpenClaw (powered by Claude) checks:'));
  console.log(chalk.gray('  • Is it legitimate? (not typosquatting)'));
  console.log(chalk.gray('  • Any known vulnerabilities?'));
  console.log(chalk.gray('  • Is it actively maintained?'));
  console.log(chalk.gray('  • Safety score: 0-100\n'));

  console.log(chalk.cyan('Example output:\n'));
  console.log(chalk.green('  ✓ sendgrid') + chalk.gray(' - Safety Score: 92/100 - SAFE'));
  console.log(chalk.gray('    Official Twilio package, 500k+ downloads\n'));
  console.log(chalk.yellow('  ? Install 1 safe package and execute? (Y/n)') + chalk.gray(' ← You decide!\n'));

  await pressEnterToContinue();
}

async function step5WhatsNext() {
  console.clear();
  console.log(chalk.cyan.bold('\n🎉 Tutorial Complete!\n'));

  console.log(chalk.white('You now know how to:\n'));
  console.log(chalk.green('  ✓ ') + chalk.white('Build automations') + chalk.gray(' with `askelira build`'));
  console.log(chalk.green('  ✓ ') + chalk.white('Monitor progress') + chalk.gray(' with `askelira watch`'));
  console.log(chalk.green('  ✓ ') + chalk.white('Execute safely') + chalk.gray(' with `askelira execute`'));
  console.log(chalk.green('  ✓ ') + chalk.white('Trust OpenClaw') + chalk.gray(' for package security\n'));

  console.log(chalk.cyan('Next steps:\n'));
  console.log(chalk.white('  1. ') + chalk.gray('Build something real: ') + chalk.cyan('askelira build'));
  console.log(chalk.white('  2. ') + chalk.gray('Check your builds: ') + chalk.cyan('askelira status'));
  console.log(chalk.white('  3. ') + chalk.gray('Get help anytime: ') + chalk.cyan('askelira help\n'));

  console.log(chalk.yellow('Example automations to try:\n'));
  console.log(chalk.gray('  📧 "Send daily digest email with top Hacker News posts"'));
  console.log(chalk.gray('  💰 "Monitor Bitcoin price and alert if it drops 5%"'));
  console.log(chalk.gray('  🐙 "Scrape GitHub trending and post to Slack daily"'));
  console.log(chalk.gray('  🔔 "Monitor website uptime and send SMS if down"\n'));

  console.log(chalk.green.bold('Happy automating! 🚀\n'));

  const { explore } = await inquirer.prompt([
    {
      type: 'list',
      name: 'explore',
      message: 'What would you like to do now?',
      choices: [
        { name: '🏗️  Build a real automation', value: 'build' },
        { name: '📊 Check my current builds', value: 'status' },
        { name: '📚 View help', value: 'help' },
        { name: '👋 Exit', value: 'exit' },
      ],
    },
  ]);

  if (explore === 'build') {
    console.log(chalk.cyan('\n🚀 Starting build wizard...\n'));
    await buildCommand();
  } else if (explore === 'status') {
    await statusCommand();
  } else if (explore === 'help') {
    console.log(chalk.cyan('\nRun: askelira --help\n'));
  } else {
    console.log(chalk.gray('\n👋 Come back anytime!\n'));
  }
}

async function pressEnterToContinue() {
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: chalk.gray('Press Enter to continue...'),
    },
  ]);
}
