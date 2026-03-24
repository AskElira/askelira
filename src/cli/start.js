const { Gateway } = require('../gateway');
const { start: startUI } = require('../ui/server');
const chalk = require('chalk');

module.exports = async function start(options = {}) {
  const noUI = options.noUi || false;

  console.log(chalk.cyan('🚀 Starting AskElira...'));

  // Check OpenClaw
  const hasOpenClaw = await checkOpenClaw();
  if (!hasOpenClaw) {
    console.log('Installing OpenClaw...');
    await installOpenClaw();
  }

  // Start gateway
  const gateway = new Gateway();
  await gateway.start();
  console.log(chalk.green(`  Gateway: http://localhost:${gateway.port}`));

  // Start UI server
  let uiServer = null;
  if (!noUI) {
    const ui = startUI();
    uiServer = ui.server;
    console.log(chalk.green(`  UI:      http://localhost:3000`));
  }

  console.log(chalk.green('\n✅ AskElira ready!\n'));

  // Graceful shutdown
  const shutdown = () => {
    console.log(chalk.yellow('\nShutting down...'));

    if (uiServer) {
      uiServer.close(() => console.log(chalk.gray('  UI server stopped')));
    }

    if (gateway.process) {
      gateway.process.kill();
      console.log(chalk.gray('  Gateway stopped'));
    }

    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

async function checkOpenClaw() {
  try { require('openclaw'); return true; } catch { return false; }
}

async function installOpenClaw() {
  const { execSync } = require('child_process');
  execSync('npm install -g openclaw', { stdio: 'inherit' });
}
