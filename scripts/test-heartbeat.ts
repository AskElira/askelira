/**
 * Test script for Steven's Heartbeat (Phase 5)
 *
 * Tests the heartbeat registry (start/stop/status) without making API calls.
 * Requires TEST_GOAL_ID env var.
 *
 * Usage: npx tsx scripts/test-heartbeat.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import {
  startHeartbeat,
  stopHeartbeat,
  getHeartbeatStatus,
} from '../lib/heartbeat';

const envGoalId = process.env.TEST_GOAL_ID;

if (!envGoalId) {
  console.error('ERROR: TEST_GOAL_ID env var is required');
  console.error('Usage: TEST_GOAL_ID=<uuid> npx tsx scripts/test-heartbeat.ts');
  process.exit(1);
}

const TEST_GOAL_ID: string = envGoalId;

async function runTests(): Promise<void> {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string): void {
    if (condition) {
      console.log(`  PASS: ${name}`);
      passed++;
    } else {
      console.error(`  FAIL: ${name}`);
      failed++;
    }
  }

  console.log('=== Steven Heartbeat Registry Tests ===\n');

  // Test 1: Status before start
  console.log('Test 1: Status before start');
  const statusBefore = getHeartbeatStatus(TEST_GOAL_ID);
  assert(statusBefore.active === false, 'Should not be active before start');
  assert(statusBefore.intervalMs === 0, 'Interval should be 0 before start');
  assert(statusBefore.goalId === TEST_GOAL_ID, 'Goal ID should match');

  // Test 2: Start heartbeat
  console.log('\nTest 2: Start heartbeat');
  // Use a very long interval to prevent actual cycle from running during test
  startHeartbeat(TEST_GOAL_ID, 600_000);
  const statusAfterStart = getHeartbeatStatus(TEST_GOAL_ID);
  assert(statusAfterStart.active === true, 'Should be active after start');
  assert(statusAfterStart.intervalMs === 600_000, 'Interval should be 600000ms');
  assert(statusAfterStart.goalId === TEST_GOAL_ID, 'Goal ID should match');

  // Test 3: Idempotent start
  console.log('\nTest 3: Idempotent start (second call is no-op)');
  startHeartbeat(TEST_GOAL_ID, 300_000);
  const statusAfterDouble = getHeartbeatStatus(TEST_GOAL_ID);
  assert(
    statusAfterDouble.intervalMs === 600_000,
    'Interval should remain 600000ms (not overwritten)',
  );

  // Test 4: Stop heartbeat
  console.log('\nTest 4: Stop heartbeat');
  stopHeartbeat(TEST_GOAL_ID);
  const statusAfterStop = getHeartbeatStatus(TEST_GOAL_ID);
  assert(statusAfterStop.active === false, 'Should not be active after stop');
  assert(statusAfterStop.intervalMs === 0, 'Interval should be 0 after stop');

  // Test 5: Stop is safe to call again
  console.log('\nTest 5: Stop is safe to call again (no-op)');
  stopHeartbeat(TEST_GOAL_ID);
  const statusAfterDoubleStop = getHeartbeatStatus(TEST_GOAL_ID);
  assert(
    statusAfterDoubleStop.active === false,
    'Should still be inactive after double stop',
  );

  // Test 6: Start with custom interval
  console.log('\nTest 6: Start with custom interval');
  startHeartbeat(TEST_GOAL_ID, 60_000);
  const statusCustom = getHeartbeatStatus(TEST_GOAL_ID);
  assert(statusCustom.intervalMs === 60_000, 'Interval should be 60000ms');
  assert(statusCustom.nextCheckAt !== null, 'Next check should be scheduled');
  stopHeartbeat(TEST_GOAL_ID);

  // Summary
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

  if (failed > 0) {
    process.exit(1);
  }

  // Clean exit — clear any timers
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
