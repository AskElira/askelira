const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const CONFIG_DIR = path.join(require('os').homedir(), '.askelira');
const CONFIG_FILE = path.join(CONFIG_DIR, '.env');

module.exports = async function config(options) {
  if (options.path) {
    console.log(CONFIG_FILE);
    return;
  }

  if (options.set) {
    return handleSet(options.set);
  }

  if (options.get) {
    return handleGet(options.get);
  }

  // Default: list all
  return handleList();
};

function loadConfig() {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  if (!fs.existsSync(CONFIG_FILE)) return {};

  const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
  const config = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    config[key] = value;
  }

  return config;
}

function saveConfig(config) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  const lines = ['# AskElira Configuration'];
  for (const [key, value] of Object.entries(config)) {
    lines.push(`${key}=${value}`);
  }
  lines.push('');
  fs.writeFileSync(CONFIG_FILE, lines.join('\n'), 'utf-8');
}

function handleSet(pair) {
  const eqIndex = pair.indexOf('=');
  if (eqIndex === -1) {
    console.error(chalk.red('Error: Use format --set KEY=VALUE'));
    process.exit(1);
  }

  const key = pair.slice(0, eqIndex).trim();
  const value = pair.slice(eqIndex + 1).trim();
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);

  const display = key.toLowerCase().includes('key') ? mask(value) : value;
  console.log(chalk.green(`Set ${key}=${display}`));
}

function handleGet(key) {
  const config = loadConfig();
  if (key in config) {
    const display = key.toLowerCase().includes('key') ? mask(config[key]) : config[key];
    console.log(`${key}=${display}`);
  } else {
    console.log(chalk.yellow(`${key} is not set`));
  }
}

function handleList() {
  const config = loadConfig();
  const keys = Object.keys(config);

  if (keys.length === 0) {
    console.log(chalk.yellow('No configuration set.'));
    console.log(chalk.gray(`Config file: ${CONFIG_FILE}`));
    return;
  }

  console.log(chalk.cyan('\nAskElira Configuration:\n'));
  for (const [key, value] of Object.entries(config)) {
    const display = key.toLowerCase().includes('key') ? mask(value) : value;
    console.log(`  ${chalk.white(key)} = ${chalk.gray(display)}`);
  }
  console.log(chalk.gray(`\n  File: ${CONFIG_FILE}\n`));
}

function mask(value) {
  if (!value || value.length <= 4) return '****';
  return value.slice(0, 4) + '*'.repeat(value.length - 4);
}
