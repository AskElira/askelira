/**
 * Steven Beta -- Installment 4: Regression Tests
 * Run: npx tsx test/test-steven-beta-installment-4.ts
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
  // ── SB-031: Usage API email bypass removed ──
  console.log('\nSB-031: Usage API email bypass removed');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/usage/route.ts'),
      'utf-8',
    );
    assert(!src.includes('emailParam'), 'No emailParam variable');
    assert(src.includes('session.user.email'), 'Uses session email directly');
    assert(src.includes("status: 401"), 'Returns 401');
  }

  // ── SB-032: Plan route has auth ──
  console.log('\nSB-032: Plan route has auth');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/goals/[id]/plan/route.ts'),
      'utf-8',
    );
    assert(src.includes('getServerSession'), 'Has getServerSession import');
    assert(src.includes("status: 401"), 'Returns 401');
  }

  // ── SB-033: Build route requires auth ──
  console.log('\nSB-033: Build route requires auth');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/build/route.ts'),
      'utf-8',
    );
    assert(!src.includes("demo@askelira.com"), 'No demo fallback');
    assert(src.includes("status: 401"), 'Returns 401');
    assert(
      src.includes('session.user.email'),
      'Uses authenticated email',
    );
  }

  // ── SB-034: Loop start has CRON_SECRET auth ──
  console.log('\nSB-034: Loop start has CRON_SECRET auth');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/loop/start/[floorId]/route.ts'),
      'utf-8',
    );
    assert(src.includes('CRON_SECRET'), 'Checks CRON_SECRET');
    assert(src.includes('x-cron-secret'), 'Reads x-cron-secret header');
    assert(src.includes("status: 401"), 'Returns 401');
  }

  // ── SB-035: stallRecoveryTimestamps has cleanup ──
  console.log('\nSB-035: stallRecoveryTimestamps has cleanup');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../lib/heartbeat.ts'),
      'utf-8',
    );
    // Find the cleanup interval near stallRecoveryTimestamps
    const stallIdx = src.indexOf('const stallRecoveryTimestamps');
    const afterStall = src.substring(stallIdx, stallIdx + 500);
    assert(
      afterStall.includes('setInterval') && afterStall.includes('stallRecoveryTimestamps.delete'),
      'Has cleanup interval that deletes old entries',
    );
  }

  // ── SB-036: step-runner no longer uses `as any` ──
  console.log('\nSB-036: step-runner no longer uses `as any` for alba fields');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../lib/step-runner.ts'),
      'utf-8',
    );
    // Check AlbaResult has the extended fields (look in a wider range)
    const albaStart = src.indexOf('interface AlbaResult');
    const albaBlock = src.substring(albaStart, albaStart + 500);
    assert(
      albaBlock.includes('patternValidation'),
      'AlbaResult has patternValidation field',
    );
    assert(
      albaBlock.includes('riskAnalysis'),
      'AlbaResult has riskAnalysis field',
    );
    // Check the casts are gone
    assert(
      !src.includes('(albaResult as any)'),
      'No (albaResult as any) casts remain',
    );
  }

  // ── SB-037: No unused templateUsed variable ──
  console.log('\nSB-037: No unused templateUsed variable');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/goals/[id]/plan/route.ts'),
      'utf-8',
    );
    assert(
      !src.includes('let templateUsed'),
      'No templateUsed variable declaration',
    );
    assert(
      !src.includes('templateUsed = true'),
      'No templateUsed assignment',
    );
  }

  // ── SB-038: Heartbeat fetch has abort cleanup ──
  console.log('\nSB-038: Heartbeat fetch has abort cleanup');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../hooks/useBuilding.ts'),
      'utf-8',
    );
    // Find the heartbeat useEffect and check for AbortController
    const heartbeatIdx = src.indexOf('Fetch heartbeat status');
    const heartbeatBlock = src.substring(heartbeatIdx, heartbeatIdx + 1000);
    assert(
      heartbeatBlock.includes('AbortController'),
      'Uses AbortController',
    );
    assert(
      heartbeatBlock.includes('controller.abort'),
      'Cleanup calls abort()',
    );
  }

  // ── SB-039: Checkout uses NEXTAUTH_URL, not Origin header ──
  console.log('\nSB-039: Checkout does not trust Origin header');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/billing/checkout/route.ts'),
      'utf-8',
    );
    assert(
      !src.includes("request.headers.get('origin')"),
      'Does not read Origin header for redirect URL',
    );
    assert(
      src.includes('NEXTAUTH_URL'),
      'Uses NEXTAUTH_URL as canonical origin',
    );
  }

  // ── SB-040: Approve route verifies ownership ──
  console.log('\nSB-040: Approve route verifies ownership');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/goals/[id]/approve/route.ts'),
      'utf-8',
    );
    assert(
      src.includes('goal.customerId !== session.user.email'),
      'Checks goal ownership against session email',
    );
    assert(
      src.includes("status: 403"),
      'Returns 403 for non-owner',
    );
  }

  // ── Summary ──
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Steven Beta Installment 4: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
