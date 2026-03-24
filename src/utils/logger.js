const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const LOG_DIR = path.join(require('os').homedir(), '.askelira', 'logs');

const LEVELS = {
  debug: { priority: 0, color: chalk.gray,   label: 'DEBUG' },
  info:  { priority: 1, color: chalk.cyan,   label: 'INFO ' },
  warn:  { priority: 2, color: chalk.yellow, label: 'WARN ' },
  error: { priority: 3, color: chalk.red,    label: 'ERROR' },
};

class Logger {
  constructor({ minLevel = 'info', writeToFile = true } = {}) {
    this.minLevel = minLevel;
    this.writeToFile = writeToFile;
  }

  debug(message, data) { this._log('debug', message, data); }
  info(message, data)  { this._log('info', message, data); }
  warn(message, data)  { this._log('warn', message, data); }
  error(message, data) { this._log('error', message, data); }

  _log(level, message, data) {
    const config = LEVELS[level];
    if (!config || config.priority < LEVELS[this.minLevel].priority) return;

    const timestamp = new Date().toISOString();
    const prefix = `${timestamp} [${config.label}]`;

    // Console output with color
    const colored = `${chalk.gray(timestamp)} ${config.color(`[${config.label}]`)} ${message}`;
    if (level === 'error') {
      console.error(colored);
    } else {
      console.log(colored);
    }
    if (data !== undefined) {
      console.log(chalk.gray(`  ${JSON.stringify(data)}`));
    }

    // File output
    if (this.writeToFile) {
      this._writeToFile(prefix, message, data);
    }
  }

  _writeToFile(prefix, message, data) {
    try {
      fs.mkdirSync(LOG_DIR, { recursive: true });
      const date = new Date().toISOString().split('T')[0];
      const filePath = path.join(LOG_DIR, `${date}.log`);
      let line = `${prefix} ${message}\n`;
      if (data !== undefined) {
        line += `  ${JSON.stringify(data)}\n`;
      }
      fs.appendFileSync(filePath, line, 'utf-8');
    } catch {
      // Silently fail — don't let logging break the app
    }
  }
}

const logger = new Logger({
  minLevel: process.env.LOG_LEVEL || 'info',
  writeToFile: process.env.LOG_TO_FILE !== 'false',
});

module.exports = { Logger, logger };
