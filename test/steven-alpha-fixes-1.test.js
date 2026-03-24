/**
 * Steven Alpha -- Installment 1: Fix Verification Tests
 *
 * These tests verify each of the 10 bug fixes applied in installment 1.
 * Run: node test/steven-alpha-fixes-1.test.js
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

const LIB = path.join(__dirname, '..', 'lib');
const APP = path.join(__dirname, '..', 'app');

console.log('Steven Alpha -- Installment 1: Fix Verification Tests\n');

// ============================================================
// FIX-1-01: Double recordFailure removed from gateway-client invokeAgent
// ============================================================
console.log('BUG-1-01: Double recordFailure in gateway-client invokeAgent');
test('invokeAgent catch block does not call recordFailure', () => {
  const src = fs.readFileSync(path.join(LIB, 'gateway-client.ts'), 'utf-8');
  // Find the catch block that follows the invokeAgent try
  const catchBlockMatch = src.match(/} catch \(err\) \{\s*\n\s*const duration = Date\.now\(\) - startTime;[\s\S]*?throw err;\s*\n\s*\}/);
  assert(catchBlockMatch, 'Could not find invokeAgent catch block');
  const catchBlock = catchBlockMatch[0];
  // Verify recordFailure is NOT called (only in comment)
  const lines = catchBlock.split('\n').filter(line => !line.trim().startsWith('//'));
  const hasRecordFailure = lines.some(line => line.includes('this.recordFailure()'));
  assert(!hasRecordFailure, 'invokeAgent catch block still calls this.recordFailure()');
});

// ============================================================
// FIX-1-02: Telegram notify() has timeout
// ============================================================
console.log('\nBUG-1-02: Telegram notify() fetch timeout');
test('notify.ts contains AbortController for timeout', () => {
  const src = fs.readFileSync(path.join(LIB, 'notify.ts'), 'utf-8');
  assert(src.includes('AbortController'), 'notify.ts missing AbortController');
  assert(src.includes('NOTIFY_TIMEOUT_MS'), 'notify.ts missing NOTIFY_TIMEOUT_MS constant');
  assert(src.includes('signal: controller.signal'), 'notify.ts fetch missing signal parameter');
});

test('notify.ts logs AbortError distinctly', () => {
  const src = fs.readFileSync(path.join(LIB, 'notify.ts'), 'utf-8');
  assert(src.includes("err.name === 'AbortError'"), 'notify.ts missing AbortError check');
  assert(src.includes('timed out'), 'notify.ts missing timeout error message');
});

// ============================================================
// FIX-1-03: openclaw-client has fetch timeout
// ============================================================
console.log('\nBUG-1-03: openclaw-client fetch timeout');
test('callClaudeWithSystem has AbortController', () => {
  const src = fs.readFileSync(path.join(LIB, 'openclaw-client.ts'), 'utf-8');
  assert(src.includes('DEFAULT_TIMEOUT_MS'), 'Missing DEFAULT_TIMEOUT_MS constant');
  // Check both functions have signal
  const signalCount = (src.match(/signal: controller\.signal/g) || []).length;
  assert(signalCount >= 2, `Expected at least 2 fetch signal params, found ${signalCount}`);
});

test('callClaudeWithTools has AbortController', () => {
  const src = fs.readFileSync(path.join(LIB, 'openclaw-client.ts'), 'utf-8');
  // Check both functions have clearTimeout in finally
  const clearCount = (src.match(/clearTimeout\(timeoutId\)/g) || []).length;
  assert(clearCount >= 2, `Expected at least 2 clearTimeout calls, found ${clearCount}`);
});

test('ANTHROPIC_TIMEOUT_MS is configurable via env', () => {
  const src = fs.readFileSync(path.join(LIB, 'openclaw-client.ts'), 'utf-8');
  assert(src.includes('ANTHROPIC_TIMEOUT_MS'), 'Missing env var reference for timeout config');
});

// ============================================================
// FIX-1-04: Singleton PrismaClient in personal-context
// ============================================================
console.log('\nBUG-1-04: Singleton PrismaClient in personal-context');
test('personal-context uses singleton PrismaClient', () => {
  const src = fs.readFileSync(path.join(LIB, 'personal-context.ts'), 'utf-8');
  assert(src.includes('_prismaInstance'), 'Missing _prismaInstance singleton variable');
  assert(src.includes('getPrismaClient'), 'Missing getPrismaClient function');
  // Should NOT have `new prismaModule.PrismaClient()` inside getUserHistory
  const getUserHistoryFn = src.slice(src.indexOf('export async function getUserHistory'));
  assert(!getUserHistoryFn.includes('new prismaModule.PrismaClient'), 'getUserHistory still creates new PrismaClient');
});

test('personal-context no longer calls prisma.$disconnect per call', () => {
  const src = fs.readFileSync(path.join(LIB, 'personal-context.ts'), 'utf-8');
  assert(!src.includes('prisma.$disconnect'), 'Still calls prisma.$disconnect (singleton should stay connected)');
});

// ============================================================
// FIX-1-05: Cached Anthropic client in autoresearch callLLM
// ============================================================
console.log('\nBUG-1-05: Cached Anthropic client in autoresearch');
test('autoresearch.ts caches Anthropic client', () => {
  const src = fs.readFileSync(path.join(LIB, 'autoresearch.ts'), 'utf-8');
  assert(src.includes('_anthropicClient'), 'Missing _anthropicClient cache variable');
  assert(src.includes('_anthropicClientKey'), 'Missing _anthropicClientKey for key comparison');
});

test('autoresearch.ts OpenAI path has fetch timeout', () => {
  const src = fs.readFileSync(path.join(LIB, 'autoresearch.ts'), 'utf-8');
  // Find the OpenAI fetch section
  const openaiSection = src.slice(src.indexOf('OpenAI (using'));
  assert(openaiSection.includes('AbortController'), 'OpenAI fetch path missing AbortController');
  assert(openaiSection.includes('signal: controller.signal'), 'OpenAI fetch path missing signal');
});

// ============================================================
// FIX-1-06: Reconnect flag race in gateway-client
// ============================================================
console.log('\nBUG-1-06: Reconnect flag race in gateway-client');
test('reconnecting flag is reset before connect() call in reconnect timer', () => {
  const src = fs.readFileSync(path.join(LIB, 'gateway-client.ts'), 'utf-8');
  // Find the setTimeout callback in scheduleReconnect
  const timerMatch = src.match(/this\.reconnectTimer = setTimeout\(async \(\) => \{([\s\S]*?)\}, delay\);/);
  assert(timerMatch, 'Could not find reconnect timer callback');
  const timerBody = timerMatch[1];
  // The flag reset should come BEFORE the try/connect
  const resetIdx = timerBody.indexOf('this.reconnecting = false');
  const tryIdx = timerBody.indexOf('try {');
  assert(resetIdx > -1, 'reconnecting flag is not reset in timer');
  assert(resetIdx < tryIdx, 'reconnecting flag is reset AFTER try block (should be before)');
});

// ============================================================
// FIX-1-07: Socket.io goalId validation on connect
// ============================================================
console.log('\nBUG-1-07: Socket.io goalId validation on connect');
test('server.js validates goalId with UUID regex before room join', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');
  // Check that the goalId block now validates UUID
  assert(src.includes('UUID_RE.test(goalId)'), 'server.js missing UUID validation on connect goalId');
  // Ensure the validation is in the initial connect handler, not just subscribe
  const connectBlock = src.slice(src.indexOf('const goalId = socket.handshake.query.goalId'));
  const firstJoin = connectBlock.indexOf('socket.join(roomName)');
  const uuidCheck = connectBlock.indexOf('UUID_RE.test(goalId)');
  assert(uuidCheck < firstJoin, 'UUID validation should come before socket.join');
});

// ============================================================
// FIX-1-08: Brave Search error logging
// ============================================================
console.log('\nBUG-1-08: Brave Search error response logging');
test('web-search.ts logs response body on non-ok Brave response', () => {
  const src = fs.readFileSync(path.join(LIB, 'web-search.ts'), 'utf-8');
  assert(src.includes('errBody'), 'web-search.ts missing errBody capture on Brave error');
  assert(src.includes('.slice(0, 300)'), 'web-search.ts should truncate error body to prevent log flooding');
});

test('web-search.ts logs when 200 OK has no web.results', () => {
  const src = fs.readFileSync(path.join(LIB, 'web-search.ts'), 'utf-8');
  assert(src.includes('data.query || data.mixed'), 'web-search.ts missing check for error-shaped 200 responses');
});

// ============================================================
// FIX-1-09: Rate limiting for unauthenticated swarm requests
// ============================================================
console.log('\nBUG-1-09: Rate limiting for unauthenticated swarm requests');
test('swarm route imports rate limiter', () => {
  const src = fs.readFileSync(path.join(APP, 'api', 'swarm', 'route.ts'), 'utf-8');
  assert(src.includes("from '@/lib/rate-limiter'"), 'swarm route.ts missing rate-limiter import');
  assert(src.includes('checkRateLimit'), 'swarm route.ts missing checkRateLimit usage');
  assert(src.includes('getClientIp'), 'swarm route.ts missing getClientIp usage');
});

test('unauthenticated swarm path has rate limit check', () => {
  const src = fs.readFileSync(path.join(APP, 'api', 'swarm', 'route.ts'), 'utf-8');
  assert(src.includes('swarm_anon'), 'Missing swarm_anon rate limit key');
  // Check it has a reasonable limit (3/hour)
  assert(src.includes('3, 3600000'), 'Rate limit should be 3 per hour for anonymous');
  // Check 429 response
  const anonSection = src.slice(src.indexOf('swarm_anon'));
  assert(anonSection.includes('429'), 'Missing 429 response for anonymous rate limit');
});

// ============================================================
// FIX-1-10: resetFloor clears validation report fields
// ============================================================
console.log('\nBUG-1-10: resetFloor clears validation report fields');
test('resetFloor SQL clears pattern_validation_report', () => {
  const src = fs.readFileSync(path.join(LIB, 'building-manager.ts'), 'utf-8');
  const resetFn = src.slice(src.indexOf('export async function resetFloor'));
  assert(resetFn.includes('pattern_validation_report = NULL'), 'resetFloor missing pattern_validation_report = NULL');
});

test('resetFloor SQL clears risk_analysis_report', () => {
  const src = fs.readFileSync(path.join(LIB, 'building-manager.ts'), 'utf-8');
  const resetFn = src.slice(src.indexOf('export async function resetFloor'));
  assert(resetFn.includes('risk_analysis_report = NULL'), 'resetFloor missing risk_analysis_report = NULL');
});

test('resetFloor SQL clears swarm_validation_report', () => {
  const src = fs.readFileSync(path.join(LIB, 'building-manager.ts'), 'utf-8');
  const resetFn = src.slice(src.indexOf('export async function resetFloor'));
  assert(resetFn.includes('swarm_validation_report = NULL'), 'resetFloor missing swarm_validation_report = NULL');
});

// ============================================================
// Summary
// ============================================================
console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'='.repeat(60)}`);

if (failed > 0) {
  process.exit(1);
}
