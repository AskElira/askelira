const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOME = require('os').homedir();
const ASKELIRA_DIR = path.join(HOME, '.askelira');
const MEMORY_DIR = path.join(ASKELIRA_DIR, 'memory');
const ENV_FILE = path.join(ASKELIRA_DIR, '.env');
const ENV_TEMPLATE = path.join(__dirname, '..', '.env.template');

function checkOpenClaw() {
  try {
    execSync('openclaw --version', { stdio: 'ignore' });
    console.log('  [ok] OpenClaw found');
    return true;
  } catch {
    console.log('  [!!] OpenClaw not found — run: npm install -g openclaw');
    return false;
  }
}

function createMemoryDir() {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
    console.log('  [ok] Created ~/.askelira/memory/');
  } else {
    console.log('  [ok] ~/.askelira/memory/ exists');
  }
}

function copyEnvTemplate() {
  if (fs.existsSync(ENV_FILE)) {
    console.log('  [ok] ~/.askelira/.env exists');
    return;
  }

  if (fs.existsSync(ENV_TEMPLATE)) {
    fs.copyFileSync(ENV_TEMPLATE, ENV_FILE);
    console.log('  [ok] Copied .env.template to ~/.askelira/.env');
  } else {
    const defaults = [
      '# AskElira Configuration',
      'BRAVE_API_KEY=',
      'OPENCLAW_PORT=5678',
      '',
    ].join('\n');
    fs.writeFileSync(ENV_FILE, defaults, 'utf-8');
    console.log('  [ok] Created ~/.askelira/.env with defaults');
  }
}

function printWelcome() {
  console.log(`
========================================
  AskElira 2.0 installed successfully!
========================================

Next steps:

  1. Add your Brave API key (optional):
     Edit ~/.askelira/.env

  2. Start the gateway:
     askelira start

  3. Run your first swarm:
     askelira swarm --question "Your question here"

Docs: https://github.com/askelira/askelira#readme
========================================
`);
}

console.log('\n[AskElira] Running postinstall...\n');
checkOpenClaw();
createMemoryDir();
copyEnvTemplate();
printWelcome();
