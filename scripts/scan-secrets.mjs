#!/usr/bin/env node
// AskElira 2.1 -- Secrets Scanner (Steven Delta SD-026)
// Scans codebase for accidentally committed secrets.
// Usage: node scripts/scan-secrets.mjs
// Exit code 0 = clean, 1 = secrets found

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';

const PATTERNS = [
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g },
  { name: 'Stripe Secret Key', pattern: /sk_live_[0-9a-zA-Z]{24,}/g },
  { name: 'Stripe Webhook Secret', pattern: /whsec_[0-9a-zA-Z]{24,}/g },
  { name: 'Generic Private Key', pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g },
  { name: 'Anthropic API Key', pattern: /sk-ant-[0-9a-zA-Z_-]{40,}/g },
  { name: 'Generic Bearer Token', pattern: /Bearer\s+[0-9a-zA-Z._-]{40,}/g },
  { name: 'Telegram Bot Token', pattern: /\d{8,}:[A-Za-z0-9_-]{35}/g },
];

const IGNORE_DIRS = new Set([
  'node_modules', '.next', '.git', 'dist', 'build', 'coverage',
  'out', 'release', '.vercel', '.cache',
]);

const SCAN_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.yml', '.yaml',
  '.md', '.env.example', '.env.template', '.sql', '.sh',
]);

let findings = 0;

function scanFile(filepath) {
  // Skip .env files (expected to have secrets locally)
  if (filepath.endsWith('.env') || filepath.includes('.env.local')) return;

  const content = readFileSync(filepath, 'utf-8');

  for (const { name, pattern } of PATTERNS) {
    pattern.lastIndex = 0;
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Skip if it's clearly a placeholder
        if (match.includes('...') || match.includes('your_') || match.includes('change-me')) continue;
        console.error(`FOUND: ${name} in ${filepath}`);
        console.error(`       ${match.slice(0, 20)}...`);
        findings++;
      }
    }
  }
}

function scanDir(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry)) continue;
    if (entry.startsWith('.') && entry !== '.github') continue;

    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (stat.isFile()) {
      const ext = extname(entry);
      if (SCAN_EXTENSIONS.has(ext) || entry === '.env.example') {
        scanFile(fullPath);
      }
    }
  }
}

console.log('AskElira 2.1 -- Scanning for leaked secrets...\n');
scanDir(process.cwd());

if (findings > 0) {
  console.error(`\nFOUND ${findings} potential secret(s). Remove before committing.`);
  process.exit(1);
} else {
  console.log('No secrets found. Clean.');
}
