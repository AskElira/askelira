#!/usr/bin/env node

/**
 * Execute Automation Script
 * Extracts automation code from database and executes it
 */

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { writeFileSync, mkdirSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const goalId = process.argv[2];

if (!goalId) {
  console.error('Usage: node execute-automation.mjs <goalId>');
  process.exit(1);
}

async function main() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('EXTRACTING AUTOMATION CODE');
  console.log('='.repeat(80));

  // Get floors with snapshots
  const floors = await prisma.floor.findMany({
    where: { goalId },
    orderBy: { floorNumber: 'asc' },
    include: {
      snapshots: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (floors.length === 0) {
    console.error('No floors found for this goal');
    process.exit(1);
  }

  // Create execution directory
  const execDir = path.join(process.cwd(), 'automation-exec', goalId);
  mkdirSync(execDir, { recursive: true });

  console.log(`\nExecution directory: ${execDir}\n`);

  for (const floor of floors) {
    console.log(`\nFloor ${floor.floorNumber}: ${floor.name}`);
    console.log('-'.repeat(80));

    if (!floor.snapshots[0]) {
      console.log('  No code found (no snapshots)');
      continue;
    }

    const snapshot = floor.snapshots[0];
    const buildOutput = snapshot.buildOutput;
    const language = snapshot.language || 'python';

    console.log(`  Language: ${language}`);
    console.log(`  Code length: ${buildOutput.length} characters`);

    // Determine file extension
    const ext = language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'txt';
    const filename = `floor-${floor.floorNumber}-${floor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${ext}`;
    const filepath = path.join(execDir, filename);

    // Write code to file
    writeFileSync(filepath, buildOutput);
    console.log(`  Saved to: ${filename}`);

    // Show first 50 lines
    const lines = buildOutput.split('\n');
    console.log(`\n  Code preview (first 30 lines):`);
    console.log('  ' + '-'.repeat(78));
    lines.slice(0, 30).forEach(line => {
      console.log('  ' + line);
    });
    if (lines.length > 30) {
      console.log('  ' + `... (${lines.length - 30} more lines)`);
    }
    console.log('  ' + '-'.repeat(78));
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('EXTRACTION COMPLETE');
  console.log('='.repeat(80) + '\n');
  console.log(`Code saved to: ${execDir}`);
  console.log(`\nTo run the automation:`);
  console.log(`  cd ${execDir}`);
  console.log(`  # Install dependencies (if any)`);
  console.log(`  # Then run the main script`);
  console.log();

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('Error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
