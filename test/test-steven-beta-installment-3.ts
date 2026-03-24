/**
 * Steven Beta -- Installment 3: Regression Tests
 * Run: npx tsx test/test-steven-beta-installment-3.ts
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
  // ── SB-021: Workspace API requires auth ──
  console.log('\nSB-021: Workspace API requires auth');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/workspace/route.ts'),
      'utf-8',
    );
    assert(src.includes('getServerSession'), 'GET has getServerSession import');
    assert(src.includes("status: 401"), 'Returns 401 on missing auth');
    // Verify both GET and POST have auth
    const getIdx = src.indexOf('async function GET');
    const postIdx = src.indexOf('async function POST');
    const getBody = src.substring(getIdx, postIdx);
    const postBody = src.substring(postIdx);
    assert(
      getBody.includes('getServerSession'),
      'GET handler checks session',
    );
    assert(
      postBody.includes('getServerSession'),
      'POST handler checks session',
    );
  }

  // ── SB-022: Debates API no longer accepts email parameter bypass ──
  console.log('\nSB-022: Debates API email parameter bypass removed');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/debates/route.ts'),
      'utf-8',
    );
    assert(
      !src.includes('emailParam'),
      'No emailParam variable (bypass removed)',
    );
    assert(
      src.includes('session.user.email'),
      'Uses session email directly',
    );
    assert(
      src.includes("status: 401"),
      'Returns 401 for unauthenticated',
    );
  }

  // ── SB-023: Customer workspace listing requires auth ──
  console.log('\nSB-023: Customer workspace listing requires auth');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/workspaces/[customerId]/route.ts'),
      'utf-8',
    );
    assert(src.includes('getServerSession'), 'Has getServerSession import');
    assert(src.includes("status: 401"), 'Returns 401 on missing auth');
  }

  // ── SB-024: ShareButton has clipboard error handling ──
  console.log('\nSB-024: ShareButton clipboard error handling');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../components/ShareButton.tsx'),
      'utf-8',
    );
    assert(src.includes('try'), 'Has try block');
    assert(src.includes('catch'), 'Has catch block for clipboard errors');
    assert(
      src.includes('async'),
      'copyLink is async (awaits clipboard)',
    );
  }

  // ── SB-025: Logs API validates API key against adminKey ──
  console.log('\nSB-025: Logs API validates API key');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/goals/[id]/logs/route.ts'),
      'utf-8',
    );
    assert(
      src.includes('apiKey !== adminKey'),
      'Validates apiKey matches adminKey',
    );
    assert(
      src.includes('Invalid API key'),
      'Returns error for invalid key',
    );
  }

  // ── SB-026: Logs API no longer silently bypasses auth ──
  console.log('\nSB-026: Logs API no longer silently bypasses auth on import failure');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/goals/[id]/logs/route.ts'),
      'utf-8',
    );
    assert(
      !src.includes('allow through for dev'),
      'No "allow through for dev" comment (silent bypass removed)',
    );
    // Auth import is no longer wrapped in try-catch
    const authBlock = src.substring(
      src.indexOf('} else {'),
      src.indexOf('const { searchParams }'),
    );
    assert(
      !authBlock.includes('catch {'),
      'Session auth path has no catch-swallow block',
    );
  }

  // ── SB-027: Swarm results require auth ──
  console.log('\nSB-027: Swarm results require auth');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/swarm/[id]/route.ts'),
      'utf-8',
    );
    assert(src.includes('getServerSession'), 'Has getServerSession import');
    assert(src.includes("status: 401"), 'Returns 401 on missing auth');
  }

  // ── SB-028: Intelligence patterns require auth ──
  console.log('\nSB-028: Intelligence patterns require auth');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/intelligence/patterns/route.ts'),
      'utf-8',
    );
    assert(src.includes('getServerSession'), 'Has getServerSession import');
    assert(src.includes("status: 401"), 'Returns 401 on missing auth');
  }

  // ── SB-029: Intelligence stats require auth ──
  console.log('\nSB-029: Intelligence stats require auth');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/intelligence/stats/route.ts'),
      'utf-8',
    );
    assert(src.includes('getServerSession'), 'Has getServerSession import');
    assert(src.includes("status: 401"), 'Returns 401 on missing auth');
  }

  // ── SB-030: Template detail rejects private templates and hides sourceGoalId ──
  console.log('\nSB-030: Template detail hides private templates');
  {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/templates/[id]/route.ts'),
      'utf-8',
    );
    assert(
      src.includes('!template.isPublic'),
      'Checks isPublic flag',
    );
    assert(
      !src.includes('sourceGoalId'),
      'sourceGoalId removed from response',
    );
  }

  // ── Summary ──
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Steven Beta Installment 3: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
