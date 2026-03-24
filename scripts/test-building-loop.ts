/**
 * Test script for the Building Loop Engine (Phase 4).
 *
 * WARNING: This script calls the Anthropic API and writes to the database.
 *          It costs real API tokens. Only run when needed.
 *
 * Prerequisites:
 *   - .env must have POSTGRES_URL and ANTHROPIC_API_KEY set
 *   - A goal must exist in the database with at least one floor
 *   - Set TEST_GOAL_ID env var or edit the constant below
 *
 * Run: npx tsx scripts/test-building-loop.ts
 */
import { resolve } from 'path';
import { config } from 'dotenv';
config({ path: resolve(__dirname, '..', '.env') });

import { runFloor } from '../lib/building-loop';
import { getGoal, updateFloorStatus } from '../lib/building-manager';

const TEST_GOAL_ID = process.env.TEST_GOAL_ID;

async function main() {
  if (!TEST_GOAL_ID) {
    console.error('ERROR: TEST_GOAL_ID env var is required.');
    console.error('Usage: TEST_GOAL_ID=<uuid> npx tsx scripts/test-building-loop.ts');
    process.exit(1);
  }

  console.log('=== Building Loop Engine Test ===');
  console.log(`Goal ID: ${TEST_GOAL_ID}`);
  console.log('');

  // Load goal and find Floor 1
  const goal = await getGoal(TEST_GOAL_ID);
  console.log(`Goal: ${goal.goalText}`);
  console.log(`Status: ${goal.status}`);
  console.log(`Floors: ${goal.floors.length}`);
  console.log('');

  const floor1 = goal.floors.find((f) => f.floorNumber === 1);
  if (!floor1) {
    console.error('ERROR: No Floor 1 found for this goal.');
    process.exit(1);
  }

  console.log(`Floor 1: ${floor1.name} (status: ${floor1.status})`);
  console.log(`Success condition: ${floor1.successCondition}`);
  console.log('');

  // Set floor to 'researching' if not already
  if (floor1.status !== 'researching') {
    console.log(`Setting Floor 1 status to 'researching'...`);
    await updateFloorStatus(floor1.id, 'researching');
  }

  // Run the loop
  console.log('Starting building loop for Floor 1...');
  console.log('---');
  console.log('');

  const result = await runFloor(floor1.id);

  console.log('');
  console.log('---');
  console.log(`Result: ${result}`);
  console.log(result === 'live' ? '=== FLOOR WENT LIVE ===' : '=== FLOOR BLOCKED ===');

  process.exit(result === 'live' ? 0 : 1);
}

main().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
