// ============================================================
// AskElira CLI — config command
// ============================================================
// Manage search provider, gateway, and LLM configuration.

import chalk from 'chalk';
import * as auth from '../lib/auth';

/**
 * Display all configuration in a table format.
 */
export async function configShowCommand(): Promise<void> {
  console.log('');
  console.log(chalk.bold('  AskElira Configuration'));
  console.log(chalk.gray('  ─────────────────────────────────────────'));
  console.log('');

  // Auth
  console.log(chalk.bold('  Authentication'));
  console.log(`    ${chalk.gray('Email:')}           ${auth.getEmail() || chalk.yellow('(not set)')}`);
  console.log(`    ${chalk.gray('Customer ID:')}     ${auth.getCustomerId() || chalk.yellow('(not set)')}`);
  console.log(`    ${chalk.gray('API Key:')}         ${auth.getApiKey() ? chalk.green('configured') : chalk.yellow('(not set)')}`);
  console.log(`    ${chalk.gray('Base URL:')}        ${auth.getBaseUrl()}`);
  console.log('');

  // LLM
  console.log(chalk.bold('  LLM'));
  console.log(`    ${chalk.gray('Anthropic Key:')}   ${auth.getLLMApiKey() ? chalk.green('configured') : chalk.yellow('(not set)')}`);
  console.log('');

  // Search
  console.log(chalk.bold('  Search'));
  console.log(`    ${chalk.gray('Provider:')}        ${auth.getSearchProvider()}`);
  console.log(`    ${chalk.gray('Brave Key:')}       ${auth.getSearchApiKey('brave') ? chalk.green('configured') : chalk.yellow('(not set)')}`);
  console.log(`    ${chalk.gray('Tavily Key:')}      ${auth.getSearchApiKey('tavily') ? chalk.green('configured') : chalk.yellow('(not set)')}`);
  console.log('');

  // Gateway
  console.log(chalk.bold('  Gateway'));
  console.log(`    ${chalk.gray('URL:')}             ${auth.getGatewayUrl() || chalk.yellow('(not configured)')}`);
  console.log(`    ${chalk.gray('Token:')}           ${auth.getGatewayToken() ? chalk.green('configured') : chalk.yellow('(not set)')}`);
  console.log(`    ${chalk.gray('Routing Mode:')}    ${auth.getGatewayMode()}`);
  console.log('');

  console.log(`  ${chalk.gray('Config file:')} ${auth.getConfigPath()}`);
  console.log('');
}

/**
 * Configure search provider settings.
 */
export async function configSearchCommand(options: {
  provider?: string;
  tavilyKey?: string;
  braveKey?: string;
}): Promise<void> {
  if (!options.provider && !options.tavilyKey && !options.braveKey) {
    // Display current search config
    console.log('');
    console.log(chalk.bold('  Search Configuration'));
    console.log(`    ${chalk.gray('Provider:')}    ${auth.getSearchProvider()}`);
    console.log(`    ${chalk.gray('Brave Key:')}   ${auth.getSearchApiKey('brave') ? chalk.green('configured') : chalk.yellow('(not set)')}`);
    console.log(`    ${chalk.gray('Tavily Key:')}  ${auth.getSearchApiKey('tavily') ? chalk.green('configured') : chalk.yellow('(not set)')}`);
    console.log('');
    console.log(chalk.gray('  Usage: askelira config search --provider tavily --tavily-key <key>'));
    console.log('');
    return;
  }

  if (options.provider) {
    const valid = ['brave', 'tavily', 'perplexity', 'auto'];
    if (!valid.includes(options.provider)) {
      console.error(chalk.red(`  Invalid provider: ${options.provider}. Must be one of: ${valid.join(', ')}`));
      process.exitCode = 1;
      return;
    }
    auth.set('search.provider', options.provider);
    console.log(chalk.green(`  Search provider set to: ${options.provider}`));
  }

  if (options.tavilyKey) {
    auth.set('search.tavilyApiKey', options.tavilyKey);
    console.log(chalk.green('  Tavily API key saved'));
  }

  if (options.braveKey) {
    auth.set('search.braveApiKey', options.braveKey);
    console.log(chalk.green('  Brave API key saved'));
  }
}

/**
 * Configure gateway settings.
 */
export async function configGatewayCommand(options: {
  url?: string;
  token?: string;
  mode?: string;
}): Promise<void> {
  if (!options.url && !options.token && !options.mode) {
    // Display current gateway config
    console.log('');
    console.log(chalk.bold('  Gateway Configuration'));
    console.log(`    ${chalk.gray('URL:')}      ${auth.getGatewayUrl() || chalk.yellow('(not configured)')}`);
    console.log(`    ${chalk.gray('Token:')}    ${auth.getGatewayToken() ? chalk.green('configured') : chalk.yellow('(not set)')}`);
    console.log(`    ${chalk.gray('Mode:')}     ${auth.getGatewayMode()}`);
    console.log('');
    console.log(chalk.gray('  Usage: askelira config gateway --url ws://127.0.0.1:18789 --mode gateway'));
    console.log('');
    return;
  }

  if (options.url) {
    auth.set('gateway.url', options.url);
    console.log(chalk.green(`  Gateway URL set to: ${options.url}`));
  }

  if (options.token) {
    auth.set('gateway.token', options.token);
    console.log(chalk.green('  Gateway token saved'));
  }

  if (options.mode) {
    const valid = ['gateway', 'direct', 'gateway-only'];
    if (!valid.includes(options.mode)) {
      console.error(chalk.red(`  Invalid mode: ${options.mode}. Must be one of: ${valid.join(', ')}`));
      process.exitCode = 1;
      return;
    }
    auth.set('gateway.mode', options.mode);
    console.log(chalk.green(`  Gateway mode set to: ${options.mode}`));
  }
}

/**
 * Test all configured API keys and connections.
 */
export async function configTestCommand(): Promise<void> {
  console.log('');
  console.log(chalk.bold('  Testing Configuration'));
  console.log('');

  // Test Anthropic API
  const anthropicKey = auth.getLLMApiKey();
  if (anthropicKey) {
    process.stdout.write(`  ${chalk.gray('Anthropic API...')}  `);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      if (res.ok) {
        console.log(chalk.green('PASS'));
      } else {
        console.log(chalk.red(`FAIL (${res.status})`));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`FAIL (${msg})`));
    }
  } else {
    console.log(`  ${chalk.gray('Anthropic API...')}  ${chalk.yellow('SKIP (no key)')}`);
  }

  // Test Brave Search
  const braveKey = auth.getSearchApiKey('brave');
  if (braveKey) {
    process.stdout.write(`  ${chalk.gray('Brave Search...')}   `);
    try {
      const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=test&count=1`, {
        headers: { 'X-Subscription-Token': braveKey, 'Accept': 'application/json' },
      });
      if (res.ok) {
        console.log(chalk.green('PASS'));
      } else {
        console.log(chalk.red(`FAIL (${res.status})`));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`FAIL (${msg})`));
    }
  } else {
    console.log(`  ${chalk.gray('Brave Search...')}   ${chalk.yellow('SKIP (no key)')}`);
  }

  // Test Tavily Search
  const tavilyKey = auth.getSearchApiKey('tavily');
  if (tavilyKey) {
    process.stdout.write(`  ${chalk.gray('Tavily Search...')}  `);
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: tavilyKey, query: 'test', max_results: 1 }),
      });
      if (res.ok) {
        console.log(chalk.green('PASS'));
      } else {
        console.log(chalk.red(`FAIL (${res.status})`));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`FAIL (${msg})`));
    }
  } else {
    console.log(`  ${chalk.gray('Tavily Search...')}  ${chalk.yellow('SKIP (no key)')}`);
  }

  // Test Gateway
  const gatewayUrl = auth.getGatewayUrl();
  if (gatewayUrl) {
    process.stdout.write(`  ${chalk.gray('Gateway...')}        `);
    try {
      // Simple HTTP check — the real connection uses WebSocket
      const httpUrl = gatewayUrl.replace(/^ws/, 'http');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(httpUrl, { signal: controller.signal }).catch(() => null);
      clearTimeout(timeout);
      if (res) {
        console.log(chalk.green(`REACHABLE (${res.status})`));
      } else {
        console.log(chalk.yellow('UNREACHABLE'));
      }
    } catch {
      console.log(chalk.yellow('UNREACHABLE'));
    }
  } else {
    console.log(`  ${chalk.gray('Gateway...')}        ${chalk.yellow('SKIP (no URL)')}`);
  }

  console.log('');
}
