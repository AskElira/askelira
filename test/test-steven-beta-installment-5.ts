/**
 * Steven Beta -- Installment 5: Regression Tests
 * Run: npx tsx test/test-steven-beta-installment-5.ts
 */

import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  // ── SB-041: Goal detail requires auth + ownership ──
  console.log('\nSB-041: Goal detail requires auth + ownership');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/goals/[id]/route.ts'),
      'utf-8',
    );
    assert(src.includes('getServerSession'), 'Has getServerSession import');
    assert(src.includes("status: 401"), 'Returns 401 for unauthenticated');
    assert(
      src.includes('goal.customerId !== session.user.email'),
      'Checks ownership against session email',
    );
  }

  // ── SB-042: Expand verifies ownership ──
  console.log('\nSB-042: Expand verifies ownership');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/goals/[id]/expand/route.ts'),
      'utf-8',
    );
    assert(
      src.includes('goal.customerId !== session.user.email'),
      'Checks ownership',
    );
  }

  // ── SB-043: Snapshots verifies ownership via goal ──
  console.log('\nSB-043: Snapshots verifies ownership via goal');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/floors/[floorId]/snapshots/route.ts'),
      'utf-8',
    );
    assert(src.includes('getGoal'), 'Imports getGoal');
    assert(
      src.includes('goal.customerId !== session.user.email'),
      'Checks ownership via goal',
    );
  }

  // ── SB-044: Heartbeat start verifies ownership ──
  console.log('\nSB-044: Heartbeat start verifies ownership');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/heartbeat/[goalId]/start/route.ts'),
      'utf-8',
    );
    assert(
      src.includes('goal.customerId !== session.user.email'),
      'Checks ownership',
    );
  }

  // ── SB-045: Heartbeat GET/POST verifies ownership ──
  console.log('\nSB-045: Heartbeat GET/POST verifies ownership');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/heartbeat/[goalId]/route.ts'),
      'utf-8',
    );
    // Should have ownership check in both GET and POST
    const getIdx = src.indexOf('async function GET');
    const postIdx = src.indexOf('async function POST');
    const getBody = src.substring(getIdx, postIdx);
    const postBody = src.substring(postIdx);
    assert(
      getBody.includes('goal.customerId !== session.user.email'),
      'GET handler checks ownership',
    );
    assert(
      postBody.includes('goal.customerId !== session.user.email'),
      'POST handler checks ownership',
    );
  }

  // ── SB-046: Rollback verifies ownership ──
  console.log('\nSB-046: Rollback verifies ownership');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/floors/[floorId]/rollback/route.ts'),
      'utf-8',
    );
    assert(
      src.includes('goal.customerId !== session.user.email'),
      'Checks ownership via goal',
    );
  }

  // ── SB-047: Goal creation has goalText length limit ──
  console.log('\nSB-047: Goal creation has goalText length limit');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/goals/new/route.ts'),
      'utf-8',
    );
    assert(
      src.includes('goalText.length > 5000'),
      'Checks goalText length limit (5000)',
    );
  }

  // ── SB-048: Expand has field length limits ──
  console.log('\nSB-048: Expand has field length limits');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/goals/[id]/expand/route.ts'),
      'utf-8',
    );
    assert(
      src.includes('name.length > 200'),
      'Checks name length limit',
    );
    assert(
      src.includes('description.length > 5000'),
      'Checks description length limit',
    );
    assert(
      src.includes('successCondition.length > 2000'),
      'Checks successCondition length limit',
    );
  }

  // ── SB-049: workspace-manager no longer has @ts-nocheck ──
  console.log('\nSB-049: workspace-manager @ts-nocheck removed');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../lib/workspace/workspace-manager.ts'),
      'utf-8',
    );
    assert(
      !src.includes('@ts-nocheck'),
      'No @ts-nocheck directive',
    );
  }

  // ── SB-050: Plan route verifies ownership ──
  console.log('\nSB-050: Plan route verifies ownership');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/goals/[id]/plan/route.ts'),
      'utf-8',
    );
    assert(
      src.includes('goal.customerId !== session.user.email'),
      'Checks ownership',
    );
  }

  // ── Summary ──
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Steven Beta Installment 5: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
