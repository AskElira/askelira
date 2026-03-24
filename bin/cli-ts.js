#!/usr/bin/env node

/**
 * Wrapper to run TypeScript CLI with tsx
 * This allows the execute command and other new features to work
 */

const { spawn } = require('child_process');
const path = require('path');

const tsCliPath = path.join(__dirname, '..', 'cli', 'bin', 'askelira.ts');
const args = process.argv.slice(2);

// Run with tsx
const child = spawn('npx', ['tsx', tsCliPath, ...args], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
