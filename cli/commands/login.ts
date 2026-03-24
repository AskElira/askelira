// ============================================================
// AskElira CLI — login command
// ============================================================

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import http from 'http';
import https from 'https';
import * as auth from '../lib/auth';
import { VerifyKeyResponse } from '../types';

/**
 * Verify the API key against the AskElira server.
 */
async function verifyKey(
  baseUrl: string,
  email: string,
  apiKey: string,
): Promise<VerifyKeyResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/auth/verify-key', baseUrl);
    const payload = JSON.stringify({ email, apiKey });
    const transport = url.protocol === 'https:' ? https : http;

    const req = transport.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data) as VerifyKeyResponse;
            resolve(parsed);
          } catch {
            reject(new Error(`Invalid response from server: ${data}`));
          }
        });
      },
    );

    req.on('error', (err: Error) => {
      reject(new Error(`Connection failed: ${err.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Connection timed out after 10 seconds'));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Interactive login command.
 * Prompts for email and API key, verifies against the server, and stores credentials.
 */
export async function loginCommand(): Promise<void> {
  console.log('');
  console.log(chalk.bold('  AskElira Login'));
  console.log(chalk.gray('  Authenticate with your AskElira account'));
  console.log('');

  // Check if already logged in
  if (auth.isAuthenticated()) {
    const email = auth.getEmail();
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Already logged in as ${chalk.cyan(email)}. Re-authenticate?`,
        default: false,
      },
    ]);
    if (!overwrite) {
      console.log(chalk.gray('  Login cancelled.'));
      return;
    }
  }

  // Prompt for credentials
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Email:',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) return 'Email is required';
        if (!input.includes('@')) return 'Enter a valid email address';
        return true;
      },
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'API Key:',
      mask: '*',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) return 'API key is required';
        return true;
      },
    },
  ]);

  const email = answers.email.trim();
  const apiKey = answers.apiKey.trim();

  // Optional: allow custom base URL via env
  const baseUrl =
    process.env.ASKELIRA_API_URL || auth.getBaseUrl();

  const spinner = ora('Verifying credentials...').start();

  try {
    const result = await verifyKey(baseUrl, email, apiKey);

    if (result.valid && result.customerId) {
      auth.setAll({
        email,
        apiKey,
        customerId: result.customerId,
        baseUrl,
      });

      spinner.succeed(chalk.green('Logged in successfully!'));
      console.log('');
      console.log(`  ${chalk.gray('Email:')}      ${chalk.cyan(email)}`);
      console.log(
        `  ${chalk.gray('Customer:')}   ${chalk.cyan(result.customerId)}`,
      );
      console.log(
        `  ${chalk.gray('Config:')}     ${chalk.gray(auth.getConfigPath())}`,
      );
      console.log('');
    } else {
      spinner.fail(chalk.red('Authentication failed'));
      console.log(
        chalk.red(`  ${result.error || 'Invalid email or API key'}`),
      );
      process.exitCode = 1;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    spinner.fail(chalk.red('Connection error'));
    console.log(chalk.red(`  ${message}`));
    console.log('');
    console.log(
      chalk.gray(
        `  Make sure the AskElira server is running at ${baseUrl}`,
      ),
    );
    console.log(
      chalk.gray(
        '  Or set ASKELIRA_API_URL to point to your local dev server.',
      ),
    );
    process.exitCode = 1;
  }
}
