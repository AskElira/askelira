/**
 * Test script for Floor Zero (Elira designs the building).
 *
 * WARNING: This script calls the Anthropic API and writes to the database.
 *          It costs real API tokens. Only run when needed.
 *
 * Run: npx tsx scripts/test-floor-zero.ts
 */
import { resolve } from 'path';
import { config } from 'dotenv';
config({ path: resolve(__dirname, '..', '.env') });

import { designBuilding } from '../lib/floor-zero';

const GOAL_ID = 'b17ae928-5997-4de9-80ef-1264c363df05';
const GOAL_TEXT =
  'Build a Miami Google Maps scraper that extracts business listings daily and emails a CSV report';

async function main() {
  console.log('=== Floor Zero Test ===');
  console.log(`Goal ID: ${GOAL_ID}`);
  console.log(`Goal:    ${GOAL_TEXT}`);
  console.log('');

  const result = await designBuilding(GOAL_ID, GOAL_TEXT, 'Miami, FL area. Small business owner.');

  // --- Validate ---
  let pass = true;

  if (result.floorCount < 2 || result.floorCount > 6) {
    console.error(`FAIL: floorCount is ${result.floorCount} (expected 2-6)`);
    pass = false;
  } else {
    console.log(`PASS: floorCount = ${result.floorCount}`);
  }

  for (const floor of result.floors) {
    if (floor.complexity > 3) {
      console.error(
        `FAIL: Floor ${floor.number} "${floor.name}" has complexity ${floor.complexity} (max 3)`,
      );
      pass = false;
    }

    if (!floor.successCondition || floor.successCondition.trim().length === 0) {
      console.error(
        `FAIL: Floor ${floor.number} "${floor.name}" has no success condition`,
      );
      pass = false;
    }
  }

  if (pass) {
    console.log('PASS: All floors have complexity <= 3 and success conditions');
  }

  // --- Print full plan ---
  console.log('');
  console.log('=== Building Plan ===');
  console.log(`Summary: ${result.buildingSummary}`);
  console.log(`Total estimated hours: ${result.totalEstimatedHours}`);
  console.log('');

  for (const floor of result.floors) {
    console.log(`Floor ${floor.number}: ${floor.name}`);
    console.log(`  Description:      ${floor.description}`);
    console.log(`  Success:          ${floor.successCondition}`);
    console.log(`  Complexity:       ${floor.complexity}`);
    console.log(`  Estimated hours:  ${floor.estimatedHours}`);
    console.log('');
  }

  console.log(pass ? '=== ALL TESTS PASSED ===' : '=== SOME TESTS FAILED ===');
  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
