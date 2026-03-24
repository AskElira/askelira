// ============================================================
// AskElira CLI — init command
// ============================================================
// Single interview: collect operator profile + API keys,
// write ~/.openclaw/workspace/USER.md and ~/.openclaw/.env.

import chalk from 'chalk';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const WORKSPACE_DIR = path.join(os.homedir(), '.openclaw', 'workspace');
const ENV_PATH = path.join(os.homedir(), '.openclaw', '.env');
const USER_MD_PATH = path.join(WORKSPACE_DIR, 'USER.md');

export async function initCommand(): Promise<void> {
  console.log('');
  console.log(chalk.bold('  AskElira Init'));
  console.log(chalk.gray('  Operator profile + API keys in one pass'));
  console.log('');

  // Check for existing config
  if (fs.existsSync(USER_MD_PATH) && fs.existsSync(ENV_PATH)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Existing config found. Overwrite?',
        default: false,
      },
    ]);
    if (!overwrite) {
      console.log(chalk.gray('  Aborted.'));
      return;
    }
  }

  // ── 1. Name + Timezone ──────────────────────────────────────
  const { name, timezone } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Your name:',
      validate: (input: string) => input.trim().length > 0 || 'Required',
    },
    {
      type: 'input',
      name: 'timezone',
      message: 'Timezone (e.g. America/New_York):',
      default: Intl.DateTimeFormat().resolvedOptions().timeZone,
      validate: (input: string) => input.trim().length > 0 || 'Required',
    },
  ]);

  // ── 2. What are you automating? ─────────────────────────────
  const { goal } = await inquirer.prompt([
    {
      type: 'input',
      name: 'goal',
      message: 'What are you automating?',
      validate: (input: string) => input.trim().length > 0 || 'Required',
    },
  ]);

  // ── 3. Search provider + API key ────────────────────────────
  const { searchProvider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'searchProvider',
      message: 'Search provider:',
      choices: [
        { name: 'auto (Tavily first, Brave fallback)', value: 'auto' },
        { name: 'Tavily', value: 'tavily' },
        { name: 'Brave Search', value: 'brave' },
      ],
    },
  ]);

  let tavilyKey = '';
  let braveKey = '';

  if (searchProvider === 'tavily' || searchProvider === 'auto') {
    const { key } = await inquirer.prompt([
      {
        type: 'password',
        name: 'key',
        message: 'Tavily API key:',
        mask: '*',
        validate: (input: string) => input.trim().length > 0 || 'Required for Tavily',
      },
    ]);
    tavilyKey = key.trim();
  }

  if (searchProvider === 'brave' || searchProvider === 'auto') {
    const prompt = searchProvider === 'auto'
      ? 'Brave API key (fallback, or Enter to skip):'
      : 'Brave Search API key:';
    const validate = searchProvider === 'auto'
      ? () => true
      : (input: string) => input.trim().length > 0 || 'Required for Brave';

    const { key } = await inquirer.prompt([
      {
        type: 'password',
        name: 'key',
        message: prompt,
        mask: '*',
        validate,
      },
    ]);
    braveKey = (key || '').trim();
  }

  // ── 4. Anthropic API key ────────────────────────────────────
  const { anthropicKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'anthropicKey',
      message: 'Anthropic API key:',
      mask: '*',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) return 'Required';
        if (!input.startsWith('sk-ant-')) return 'Should start with sk-ant-';
        return true;
      },
    },
  ]);

  // ── 5. OpenClaw gateway ─────────────────────────────────────
  const { gatewayUrl, gatewayToken } = await inquirer.prompt([
    {
      type: 'input',
      name: 'gatewayUrl',
      message: 'OpenClaw gateway URL:',
      default: 'ws://127.0.0.1:18789',
    },
    {
      type: 'password',
      name: 'gatewayToken',
      message: 'Gateway token (Enter to skip):',
      mask: '*',
    },
  ]);

  // ── 6. Telegram (optional) ──────────────────────────────────
  const { wantTelegram } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'wantTelegram',
      message: 'Configure Telegram notifications?',
      default: false,
    },
  ]);

  let telegramBotToken = '';
  let telegramChatId = '';

  if (wantTelegram) {
    const tgAnswers = await inquirer.prompt([
      {
        type: 'password',
        name: 'botToken',
        message: 'Telegram bot token:',
        mask: '*',
        validate: (input: string) => input.trim().length > 0 || 'Required',
      },
      {
        type: 'input',
        name: 'chatId',
        message: 'Telegram chat ID:',
        validate: (input: string) => input.trim().length > 0 || 'Required',
      },
    ]);
    telegramBotToken = tgAnswers.botToken.trim();
    telegramChatId = tgAnswers.chatId.trim();
  }

  // ── Write USER.md ───────────────────────────────────────────
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });

  const userMd = `# USER.md — Operator Profile

- **Name:** ${name.trim()}
- **Timezone:** ${timezone.trim()}
- **Goal:** ${goal.trim()}
- **Search Provider:** ${searchProvider}
- **Primary Channel:** ${wantTelegram ? 'Telegram' : 'CLI'}

## Preferences

- Direct answers, no fluff.
- Show costs upfront.
- Ask before spending > $5 on API calls.

---

_Generated by \`askelira init\` on ${new Date().toISOString().split('T')[0]}_
`;

  fs.writeFileSync(USER_MD_PATH, userMd, 'utf8');

  // ── Write .env ──────────────────────────────────────────────
  const envLines: string[] = [
    '# AskElira — generated by `askelira init`',
    '',
    '# Anthropic',
    `ANTHROPIC_API_KEY=${anthropicKey.trim()}`,
    '',
    '# Search',
    `SEARCH_PROVIDER=${searchProvider}`,
  ];

  if (tavilyKey) envLines.push(`TAVILY_API_KEY=${tavilyKey}`);
  if (braveKey) envLines.push(`BRAVE_SEARCH_API_KEY=${braveKey}`);

  envLines.push(
    '',
    '# OpenClaw Gateway',
    `OPENCLAW_GATEWAY_URL=${gatewayUrl.trim()}`,
  );
  if (gatewayToken && gatewayToken.trim()) {
    envLines.push(`OPENCLAW_GATEWAY_TOKEN=${gatewayToken.trim()}`);
  }
  envLines.push(`AGENT_ROUTING_MODE=gateway`);

  if (wantTelegram) {
    envLines.push(
      '',
      '# Telegram',
      `TELEGRAM_BOT_TOKEN=${telegramBotToken}`,
      `TELEGRAM_CHAT_ID=${telegramChatId}`,
    );
  }

  envLines.push('');

  fs.writeFileSync(ENV_PATH, envLines.join('\n'), 'utf8');

  // ── Summary ─────────────────────────────────────────────────
  console.log('');
  console.log(chalk.bold('  Done.'));
  console.log('');
  console.log(`  ${chalk.green('\u2713')} ${chalk.gray('USER.md')}  ${USER_MD_PATH}`);
  console.log(`  ${chalk.green('\u2713')} ${chalk.gray('.env')}     ${ENV_PATH}`);
  console.log('');

  const summary = [
    ['Name', name.trim()],
    ['Timezone', timezone.trim()],
    ['Search', searchProvider],
    ['Anthropic', anthropicKey.trim().substring(0, 12) + '...'],
    ['Gateway', gatewayUrl.trim()],
    ['Telegram', wantTelegram ? 'configured' : 'skipped'],
  ];

  for (const [label, value] of summary) {
    console.log(`  ${chalk.gray(label + ':')} ${value}`);
  }

  console.log('');
  console.log(chalk.gray('  Run `askelira build` to create your first automation.'));
  console.log('');
}
