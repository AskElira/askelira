// ============================================================
// AskElira CLI — Workspace Command (Phase 3)
// ============================================================
// View, list, and read workspace files via the API.
// `askelira workspace` — show workspace info
// `askelira workspace ls` — list files
// `askelira workspace cat <file>` — read a file
// `askelira workspace open` — open in Finder/Explorer

import chalk from 'chalk';
import ora from 'ora';
import * as auth from '../lib/auth';
import * as api from '../lib/api';
import { exec } from 'child_process';

// ── Types ────────────────────────────────────────────────────

interface WorkspaceListResponse {
  ok: boolean;
  customerId: string;
  files: string[];
  error?: string;
}

interface WorkspaceFileResponse {
  ok: boolean;
  customerId: string;
  path: string;
  content: string;
  error?: string;
}

// ── Fetch helpers ────────────────────────────────────────────

function getBaseUrl(): string {
  return process.env.ASKELIRA_URL || auth.getBaseUrl() || 'http://localhost:3000';
}

async function fetchJson<T>(urlPath: string): Promise<T> {
  // Use native http/https like api.ts
  const http = await import('http');
  const https = await import('https');

  return new Promise((resolve, reject) => {
    const baseUrl = getBaseUrl();
    const url = new URL(urlPath, baseUrl);
    const transport = url.protocol === 'https:' ? https : http;

    const headers: Record<string, string> = {
      'x-api-key': auth.getApiKey(),
      'x-email': auth.getEmail(),
      'x-customer-id': auth.getCustomerId(),
    };

    const req = transport.request(url, { method: 'GET', headers }, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as T);
        } catch {
          reject(new Error(`Invalid JSON: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (err: Error) => reject(err));
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.end();
  });
}

// ── Command handlers ─────────────────────────────────────────

async function showInfo(): Promise<void> {
  if (!auth.isAuthenticated()) {
    console.log(chalk.red('  Not logged in. Run `askelira login` first.'));
    return;
  }

  const customerId = auth.getCustomerId();
  console.log('');
  console.log(chalk.bold('  Workspace'));
  console.log(chalk.gray('  -'.repeat(20)));
  console.log(`  Customer ID: ${chalk.cyan(customerId)}`);
  console.log(`  API:         ${chalk.gray(getBaseUrl())}/api/workspaces/${customerId}`);
  console.log('');
  console.log(chalk.gray('  Use `askelira workspace ls` to list files'));
  console.log(chalk.gray('  Use `askelira workspace cat <file>` to read a file'));
  console.log(chalk.gray('  Use `askelira workspace open` to open in Finder'));
  console.log('');
}

async function listFiles(): Promise<void> {
  if (!auth.isAuthenticated()) {
    console.log(chalk.red('  Not logged in. Run `askelira login` first.'));
    return;
  }

  const customerId = auth.getCustomerId();
  const spinner = ora('Loading workspace files...').start();

  try {
    const data = await fetchJson<WorkspaceListResponse>(
      `/api/workspaces/${encodeURIComponent(customerId)}`,
    );

    spinner.stop();

    if (!data.ok || data.error) {
      console.log(chalk.red(`  Error: ${data.error || 'Unknown error'}`));
      return;
    }

    if (!data.files || data.files.length === 0) {
      console.log(chalk.gray('  No files in workspace'));
      return;
    }

    console.log('');
    console.log(chalk.bold('  Workspace Files'));
    console.log(chalk.gray('  -'.repeat(20)));

    for (const file of data.files) {
      const isDir = file.endsWith('/');
      const indent = (file.replace(/\/$/, '').split('/').length - 1) * 2;
      const name = file.replace(/\/$/, '').split('/').pop() || file;
      const prefix = ' '.repeat(indent + 2);

      if (isDir) {
        console.log(`${prefix}${chalk.blue(name + '/')}`);
      } else {
        console.log(`${prefix}${chalk.white(name)}`);
      }
    }

    console.log('');
    console.log(chalk.gray(`  ${data.files.length} entries`));
    console.log('');
  } catch (err) {
    spinner.stop();
    const msg = err instanceof Error ? err.message : String(err);
    console.log(chalk.red(`  Error: ${msg}`));
  }
}

async function catFile(filePath: string): Promise<void> {
  if (!auth.isAuthenticated()) {
    console.log(chalk.red('  Not logged in. Run `askelira login` first.'));
    return;
  }

  const customerId = auth.getCustomerId();
  const spinner = ora(`Reading ${filePath}...`).start();

  try {
    const data = await fetchJson<WorkspaceFileResponse>(
      `/api/workspaces/${encodeURIComponent(customerId)}/${filePath}`,
    );

    spinner.stop();

    if (!data.ok || data.error) {
      console.log(chalk.red(`  Error: ${data.error || 'File not found'}`));
      return;
    }

    console.log('');
    console.log(chalk.gray(`  --- ${filePath} ---`));
    console.log('');
    console.log(data.content);
    console.log('');
  } catch (err) {
    spinner.stop();
    const msg = err instanceof Error ? err.message : String(err);
    console.log(chalk.red(`  Error: ${msg}`));
  }
}

function openWorkspace(): void {
  const customerId = auth.getCustomerId();
  if (!customerId) {
    console.log(chalk.red('  Not logged in. Run `askelira login` first.'));
    return;
  }

  // Compute the local workspace path
  const os = require('os');
  const path = require('path');
  const workspacesRoot = process.env.WORKSPACES_PATH || path.join(os.homedir(), 'askelira', 'workspaces');
  const safeId = customerId.replace(/[/\\]/g, '').replace(/\.\./g, '').replace(/[^a-zA-Z0-9\-_.@]/g, '_').slice(0, 128);
  const workspacePath = path.join(workspacesRoot, safeId);

  const platform = process.platform;
  const cmd =
    platform === 'darwin'
      ? `open "${workspacePath}"`
      : platform === 'win32'
        ? `explorer "${workspacePath}"`
        : `xdg-open "${workspacePath}"`;

  console.log(chalk.gray(`  Opening: ${workspacePath}`));

  exec(cmd, (err) => {
    if (err) {
      console.log(chalk.yellow(`  Could not open workspace: ${err.message}`));
      console.log(chalk.gray(`  Path: ${workspacePath}`));
    }
  });
}

// ── Exported command ─────────────────────────────────────────

export async function workspaceCommand(
  subcommand?: string,
  args?: string[],
): Promise<void> {
  switch (subcommand) {
    case 'ls':
    case 'list':
      await listFiles();
      break;
    case 'cat':
    case 'read':
      if (!args || args.length === 0) {
        console.log(chalk.red('  Usage: askelira workspace cat <file>'));
        return;
      }
      await catFile(args.join('/'));
      break;
    case 'open':
      openWorkspace();
      break;
    default:
      await showInfo();
      break;
  }
}
