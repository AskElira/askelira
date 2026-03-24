/**
 * Steven Alpha -- Installment 3: Fix Verification Tests
 *
 * These tests verify each of the 10 bug fixes applied in installment 3.
 * Run: node test/steven-alpha-fixes-3.test.js
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${name}`);
    console.error(`        ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'app');
const LIB = path.join(ROOT, 'lib');

console.log('\nSteven Alpha -- Installment 3: Fix Verification\n');

// ============================================================
// Bug 1: plan route missing authentication
// ============================================================
console.log('Bug 1: plan route missing authentication');

test('plan route imports getServerSession and authOptions', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/goals/[id]/plan/route.ts'),
    'utf-8',
  );
  assert(src.includes("import { getServerSession }"), 'Missing getServerSession import');
  assert(src.includes("import { authOptions }"), 'Missing authOptions import');
});

test('plan route checks session before processing', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/goals/[id]/plan/route.ts'),
    'utf-8',
  );
  // The auth check must come before the goalId extraction
  const authIdx = src.indexOf("getServerSession(authOptions)");
  const goalIdx = src.indexOf("params.id");
  assert(authIdx > -1, 'Missing getServerSession call');
  assert(goalIdx > -1, 'Missing params.id access');
  assert(authIdx < goalIdx, 'Auth check must come before goalId extraction');
});

test('plan route returns 401 for unauthenticated requests', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/goals/[id]/plan/route.ts'),
    'utf-8',
  );
  assert(
    src.includes("{ error: 'Unauthorized' }") && src.includes('status: 401'),
    'Missing 401 Unauthorized response',
  );
});

// ============================================================
// Bug 2: heartbeat GET/POST routes missing authentication
// ============================================================
console.log('\nBug 2: heartbeat GET/POST routes missing authentication');

test('heartbeat route imports getServerSession and authOptions', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/heartbeat/[goalId]/route.ts'),
    'utf-8',
  );
  assert(src.includes("import { getServerSession }"), 'Missing getServerSession import');
  assert(src.includes("import { authOptions }"), 'Missing authOptions import');
});

test('heartbeat GET handler checks auth', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/heartbeat/[goalId]/route.ts'),
    'utf-8',
  );
  // Find the GET function body
  const getIdx = src.indexOf('export async function GET');
  const postIdx = src.indexOf('export async function POST');
  assert(getIdx > -1, 'Missing GET handler');
  assert(postIdx > -1, 'Missing POST handler');
  const getBody = src.slice(getIdx, postIdx);
  assert(
    getBody.includes('getServerSession(authOptions)'),
    'GET handler missing auth check',
  );
  assert(
    getBody.includes("status: 401"),
    'GET handler missing 401 response',
  );
});

test('heartbeat POST handler checks auth', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/heartbeat/[goalId]/route.ts'),
    'utf-8',
  );
  const postIdx = src.indexOf('export async function POST');
  assert(postIdx > -1, 'Missing POST handler');
  const postBody = src.slice(postIdx);
  assert(
    postBody.includes('getServerSession(authOptions)'),
    'POST handler missing auth check',
  );
  assert(
    postBody.includes("status: 401"),
    'POST handler missing 401 response',
  );
});

// ============================================================
// Bug 3: heartbeat stop route missing authentication
// ============================================================
console.log('\nBug 3: heartbeat stop route missing authentication');

test('heartbeat stop route imports getServerSession', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/heartbeat/[goalId]/stop/route.ts'),
    'utf-8',
  );
  assert(src.includes("import { getServerSession }"), 'Missing getServerSession import');
  assert(src.includes("import { authOptions }"), 'Missing authOptions import');
});

test('heartbeat stop route checks session before processing', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/heartbeat/[goalId]/stop/route.ts'),
    'utf-8',
  );
  const authIdx = src.indexOf('getServerSession(authOptions)');
  const goalIdx = src.indexOf('params.goalId');
  assert(authIdx > -1, 'Missing auth check');
  assert(goalIdx > -1, 'Missing goalId access');
  assert(authIdx < goalIdx, 'Auth check must come before goalId');
});

test('heartbeat stop route returns 401 for unauthenticated requests', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/heartbeat/[goalId]/stop/route.ts'),
    'utf-8',
  );
  assert(
    src.includes("{ error: 'Unauthorized' }") && src.includes('status: 401'),
    'Missing 401 response',
  );
});

// ============================================================
// Bug 4: billing portal route missing auth + unscoped query
// ============================================================
console.log('\nBug 4: billing portal route missing auth + unscoped query');

test('billing portal route imports getServerSession', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/billing/portal/route.ts'),
    'utf-8',
  );
  assert(src.includes("import { getServerSession }"), 'Missing getServerSession import');
  assert(src.includes("import { authOptions }"), 'Missing authOptions import');
});

test('billing portal route checks session before processing', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/billing/portal/route.ts'),
    'utf-8',
  );
  const authIdx = src.indexOf('getServerSession(authOptions)');
  assert(authIdx > -1, 'Missing auth check');
  assert(src.includes("status: 401"), 'Missing 401 response');
});

test('billing portal scopes subscription query to authenticated user', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/billing/portal/route.ts'),
    'utf-8',
  );
  // The query must join goals and filter by session email
  assert(
    src.includes('JOIN goals g ON g.id = s.goal_id'),
    'Query must join goals table to scope to user',
  );
  assert(
    src.includes('g.customer_id = ${session.user.email}'),
    'Query must filter by authenticated user email',
  );
});

// ============================================================
// Bug 5: simulate-activity missing auth + unbounded duration
// ============================================================
console.log('\nBug 5: simulate-activity missing auth + unbounded duration');

test('simulate-activity imports auth modules', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/building/simulate-activity/route.ts'),
    'utf-8',
  );
  assert(src.includes("import { getServerSession }"), 'Missing getServerSession import');
  assert(src.includes("import { authOptions }"), 'Missing authOptions import');
});

test('simulate-activity POST checks auth', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/building/simulate-activity/route.ts'),
    'utf-8',
  );
  const postIdx = src.indexOf('export async function POST');
  assert(postIdx > -1, 'Missing POST handler');
  const postBody = src.slice(postIdx, postIdx + 800);
  assert(
    postBody.includes('getServerSession(authOptions)'),
    'POST missing auth check',
  );
  assert(
    postBody.includes("status: 401"),
    'POST missing 401 response',
  );
});

test('simulate-activity caps duration to a maximum value', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/building/simulate-activity/route.ts'),
    'utf-8',
  );
  assert(
    src.includes('MAX_SIMULATION_DURATION'),
    'Must define MAX_SIMULATION_DURATION constant',
  );
  assert(
    src.includes('Math.min'),
    'Must use Math.min to cap duration',
  );
});

test('simulate-activity has rate limiting', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/building/simulate-activity/route.ts'),
    'utf-8',
  );
  assert(
    src.includes('checkRateLimit'),
    'Must have rate limiting',
  );
  assert(
    src.includes("status: 429"),
    'Must return 429 when rate limited',
  );
});

// ============================================================
// Bug 6: test-anthropic route missing auth + timeout
// ============================================================
console.log('\nBug 6: test-anthropic route missing auth + timeout');

test('test-anthropic imports auth modules', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/test-anthropic/route.ts'),
    'utf-8',
  );
  assert(src.includes("import { getServerSession }"), 'Missing getServerSession import');
  assert(src.includes("import { authOptions }"), 'Missing authOptions import');
});

test('test-anthropic checks session before API call', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/test-anthropic/route.ts'),
    'utf-8',
  );
  const authIdx = src.indexOf('getServerSession(authOptions)');
  const fetchIdx = src.indexOf("fetch('https://api.anthropic.com");
  assert(authIdx > -1, 'Missing auth check');
  assert(fetchIdx > -1, 'Missing Anthropic fetch');
  assert(authIdx < fetchIdx, 'Auth check must come before API call');
});

test('test-anthropic has fetch timeout via AbortController', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/test-anthropic/route.ts'),
    'utf-8',
  );
  assert(
    src.includes('AbortController'),
    'Must use AbortController for timeout',
  );
  assert(
    src.includes('controller.signal'),
    'Must pass signal to fetch',
  );
  assert(
    src.includes('clearTimeout'),
    'Must clear timeout after fetch completes',
  );
});

// ============================================================
// Bug 7: workspace POST accepts non-string agents input
// ============================================================
console.log('\nBug 7: workspace POST accepts non-string agents input');

test('workspace POST validates agents is a string', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/workspace/route.ts'),
    'utf-8',
  );
  assert(
    src.includes("typeof agents !== 'string'"),
    'Must check typeof agents is string',
  );
  assert(
    src.includes("agents must be a string"),
    'Must return error message for non-string',
  );
});

test('workspace POST limits agents content size', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/workspace/route.ts'),
    'utf-8',
  );
  assert(
    src.includes('agents.length >'),
    'Must check agents content size',
  );
  assert(
    src.includes('maximum size'),
    'Must mention maximum size in error',
  );
});

// ============================================================
// Bug 8: workspace file read route missing authentication
// ============================================================
console.log('\nBug 8: workspace file read route missing authentication');

test('workspace file read route imports auth modules', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/workspaces/[customerId]/[...path]/route.ts'),
    'utf-8',
  );
  assert(src.includes("import { getServerSession }"), 'Missing getServerSession import');
  assert(src.includes("import { authOptions }"), 'Missing authOptions import');
});

test('workspace file read route checks auth before reading', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/workspaces/[customerId]/[...path]/route.ts'),
    'utf-8',
  );
  // Find auth check and readWorkspaceFile CALL (not import) inside the function body
  const fnIdx = src.indexOf('export async function GET');
  assert(fnIdx > -1, 'Missing GET handler');
  const fnBody = src.slice(fnIdx);
  const authIdx = fnBody.indexOf('getServerSession(authOptions)');
  // Search for the actual invocation, not the import (which uses readWorkspaceFile in import)
  const readIdx = fnBody.indexOf('await readWorkspaceFile(');
  assert(authIdx > -1, 'Missing auth check');
  assert(readIdx > -1, 'Missing readWorkspaceFile call');
  assert(authIdx < readIdx, 'Auth check must come before file read');
});

test('workspace file read route returns 401 for unauthenticated', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/workspaces/[customerId]/[...path]/route.ts'),
    'utf-8',
  );
  assert(
    src.includes("'Unauthorized'") && src.includes('status: 401'),
    'Must return 401 for unauthenticated requests',
  );
});

// ============================================================
// Bug 9: workspace-manager write functions don't ensure directory exists
// ============================================================
console.log('\nBug 9: workspace-manager write functions don\'t ensure dir exists');

test('writeAgents ensures directory exists before writing', () => {
  const src = fs.readFileSync(
    path.join(LIB, 'workspace/workspace-manager.ts'),
    'utf-8',
  );
  // Find the writeAgents function
  const fnIdx = src.indexOf('export async function writeAgents');
  assert(fnIdx > -1, 'Missing writeAgents function');
  // Find next export function to bound the search
  const nextFn = src.indexOf('export async function readAll', fnIdx);
  const fnBody = src.slice(fnIdx, nextFn > -1 ? nextFn : fnIdx + 500);
  assert(
    fnBody.includes("fs.mkdir(dir, { recursive: true })"),
    'writeAgents must call fs.mkdir with recursive: true before writing',
  );
});

test('writeSoul ensures directory exists before writing', () => {
  const src = fs.readFileSync(
    path.join(LIB, 'workspace/workspace-manager.ts'),
    'utf-8',
  );
  const fnIdx = src.indexOf('export async function writeSoul');
  assert(fnIdx > -1, 'Missing writeSoul function');
  const fnBody = src.slice(fnIdx, fnIdx + 500);
  assert(
    fnBody.includes("fs.mkdir(dir, { recursive: true })"),
    'writeSoul must call fs.mkdir with recursive: true before writing',
  );
});

// ============================================================
// Bug 10: goals/new route missing auth + customerId spoofing
// ============================================================
console.log('\nBug 10: goals/new route missing auth + customerId spoofing');

test('goals/new route imports auth modules', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/goals/new/route.ts'),
    'utf-8',
  );
  assert(src.includes("import { getServerSession }"), 'Missing getServerSession import');
  assert(src.includes("import { authOptions }"), 'Missing authOptions import');
});

test('goals/new route checks session before processing', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/goals/new/route.ts'),
    'utf-8',
  );
  const authIdx = src.indexOf('getServerSession(authOptions)');
  assert(authIdx > -1, 'Missing auth check');
  assert(src.includes("status: 401"), 'Missing 401 response');
});

test('goals/new route uses session email as customerId', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/goals/new/route.ts'),
    'utf-8',
  );
  // Should use session.user.email not body.customerId
  assert(
    src.includes('const customerId = session.user.email'),
    'customerId must be set from session.user.email to prevent spoofing',
  );
});

test('goals/new route does not destructure customerId from body', () => {
  const src = fs.readFileSync(
    path.join(APP, 'api/goals/new/route.ts'),
    'utf-8',
  );
  // The old code had: const { goalText, customerId, customerContext } = body;
  // The fix should NOT extract customerId from body
  const bodyDestructure = src.match(/const\s*\{[^}]*\}\s*=\s*body/);
  if (bodyDestructure) {
    assert(
      !bodyDestructure[0].includes('customerId'),
      'Must NOT destructure customerId from body (prevents spoofing)',
    );
  }
});

// ============================================================
// Summary
// ============================================================
console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
console.log('='.repeat(60) + '\n');

process.exit(failed > 0 ? 1 : 0);
