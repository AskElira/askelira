const { spawn } = require('child_process');
const chalk = require('chalk');

const PORT = 5678;

class Gateway {
  constructor() {
    this.process = null;
    this.port = PORT;
  }

  async start() {
    if (await this.isRunning()) {
      console.log(chalk.yellow(`Gateway already running on port ${this.port}`));
      return;
    }

    console.log(chalk.cyan(`Starting OpenClaw gateway on port ${this.port}...`));

    this.process = spawn('openclaw', ['gateway', '--port', String(this.port)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });

    this.process.stdout.on('data', (data) => {
      console.log(chalk.gray(`[gateway] ${data.toString().trim()}`));
    });

    this.process.stderr.on('data', (data) => {
      console.error(chalk.red(`[gateway] ${data.toString().trim()}`));
    });

    this.process.on('error', (err) => {
      console.error(chalk.red(`Gateway failed to start: ${err.message}`));
    });

    await this.waitForReady();
  }

  async isRunning() {
    try {
      const response = await fetch(`http://localhost:${this.port}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async waitForReady(timeout = 30000) {
    const start = Date.now();
    const interval = 500;

    while (Date.now() - start < timeout) {
      if (await this.isRunning()) {
        console.log(chalk.green(`Gateway ready on port ${this.port}`));
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`Gateway failed to start within ${timeout / 1000}s`);
  }
}

module.exports = { Gateway };
