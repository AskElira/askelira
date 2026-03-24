/**
 * Steven Beta -- Installment 2: Regression Tests
 * Run: npx tsx test/test-steven-beta-installment-2.ts
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
  // ── SB-011: Plan route validates goalId before rate limit ──
  console.log('\nSB-011: Plan route validates goalId before rate limiting');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/goals/[id]/plan/route.ts'),
      'utf-8',
    );
    const nullCheckIdx = src.indexOf("if (!goalId)");
    const rateLimitIdx = src.indexOf("checkRateLimit(`goals_plan:");
    assert(
      nullCheckIdx < rateLimitIdx,
      'goalId null check comes before rate limit check',
    );
  }

  // ── SB-012: Billing status requires auth and filters by user ──
  console.log('\nSB-012: Billing status requires auth');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/billing/status/route.ts'),
      'utf-8',
    );
    assert(src.includes('getServerSession'), 'Has getServerSession auth check');
    assert(src.includes("status: 401"), 'Returns 401 on missing auth');
    assert(
      src.includes('customer_id = ${session.user.email}') || src.includes('WHERE g.customer_id'),
      'Filters subscriptions by user email',
    );
  }

  // ── SB-013: SwarmProgress onerror calls onError ──
  console.log('\nSB-013: SwarmProgress onerror calls onError');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../components/SwarmProgress.tsx'),
      'utf-8',
    );
    // Find the onerror handler and check it calls onError
    const onerrorIdx = src.indexOf('source.onerror');
    const onerrorBlock = src.substring(onerrorIdx, onerrorIdx + 100);
    assert(
      onerrorBlock.includes('onError'),
      'onerror handler calls onError callback',
    );
  }

  // ── SB-014: test-anthropic no longer leaks API key ──
  console.log('\nSB-014: test-anthropic no longer leaks API key');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/test-anthropic/route.ts'),
      'utf-8',
    );
    assert(
      !src.includes('apiKeyPrefix'),
      'No apiKeyPrefix in response',
    );
    assert(
      !src.includes('envKeys'),
      'No envKeys in response',
    );
    assert(
      !src.includes('substring(0, 15)'),
      'No API key substring',
    );
  }

  // ── SB-015: skeleton-pulse keyframe exists ──
  console.log('\nSB-015: skeleton-pulse CSS keyframe defined');
  {
    const css = fs.readFileSync(
      path.join(__dirname, '../app/globals.css'),
      'utf-8',
    );
    assert(
      css.includes('@keyframes skeleton-pulse'),
      'skeleton-pulse keyframe is defined in globals.css',
    );
  }

  // ── SB-016: steven-pulse keyframe exists ──
  console.log('\nSB-016: steven-pulse CSS keyframe defined');
  {
    const css = fs.readFileSync(
      path.join(__dirname, '../app/globals.css'),
      'utf-8',
    );
    assert(
      css.includes('@keyframes steven-pulse'),
      'steven-pulse keyframe is defined in globals.css',
    );
  }

  // ── SB-017: Heartbeat start requires auth ──
  console.log('\nSB-017: Heartbeat start requires auth');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/heartbeat/[goalId]/start/route.ts'),
      'utf-8',
    );
    assert(src.includes('getServerSession'), 'Has getServerSession import');
    assert(src.includes("status: 401"), 'Returns 401 on missing auth');
  }

  // ── SB-018: Floors rollback requires auth ──
  console.log('\nSB-018: Floors rollback requires auth');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/floors/[floorId]/rollback/route.ts'),
      'utf-8',
    );
    assert(src.includes('getServerSession'), 'Has getServerSession import');
    assert(src.includes("status: 401"), 'Returns 401 on missing auth');
  }

  // ── SB-019: Goals expand requires auth ──
  console.log('\nSB-019: Goals expand requires auth');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/goals/[id]/expand/route.ts'),
      'utf-8',
    );
    assert(src.includes('getServerSession'), 'Has getServerSession import');
    assert(src.includes("status: 401"), 'Returns 401 on missing auth');
  }

  // ── SB-020: Billing checkout requires auth ──
  console.log('\nSB-020: Billing checkout requires auth');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/billing/checkout/route.ts'),
      'utf-8',
    );
    assert(src.includes('getServerSession'), 'Has getServerSession import');
    assert(src.includes("status: 401"), 'Returns 401 on missing auth');
  }

  // ── Summary ──
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Steven Beta Installment 2: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
