#!/usr/bin/env node

/**
 * CLI entry point for a single autonomous improvement iteration.
 *
 * Usage:
 *   node scripts/autonomous-improve.js
 *   npm run improve
 *
 * This runs ONE iteration of the autonomous loop and exits.
 * For continuous operation, use the full autonomous loop directly.
 *
 * SECURITY NOTE:
 *   The underlying ClaudeCodeRunner uses --permission-mode bypassPermissions.
 *   Only run this in trusted environments. See docs/AUTONOMOUS_LOOP.md.
 */

const path = require('path');
const fs = require('fs');

const CONFIG_PATH = path.join(__dirname, '..', '.autonomous-config.json');

async function main() {
  // Load config
  let config = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    } catch (err) {
      console.error('Failed to parse .autonomous-config.json:', err.message);
      process.exit(1);
    }
  }

  if (config.enabled === false) {
    console.log('Autonomous improvements are disabled in .autonomous-config.json');
    console.log('Set "enabled": true to allow improvements.');
    process.exit(0);
  }

  const AutonomousLoop = require('../src/automation/autonomous-loop');

  const loop = new AutonomousLoop({
    projectDir: path.join(__dirname, '..'),
    loopInterval: 0, // single iteration, no waiting
    ...config,
  });

  console.log('Running single autonomous improvement iteration...');
  console.log('Project:', loop.config.projectDir);
  console.log('');

  try {
    await loop.runIteration();
    const stats = loop.getStats();
    console.log('');
    console.log('Iteration complete.');
    console.log(`Result: ${loop.history[0]?.result || 'unknown'}`);
    console.log(`Stats: ${JSON.stringify(stats)}`);
  } catch (err) {
    console.error('Iteration failed:', err.message);
    process.exit(1);
  }
}

main();
