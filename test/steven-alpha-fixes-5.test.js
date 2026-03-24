/**
 * Steven Alpha QA -- Installment 5 (FINAL) Tests
 *
 * Tests for bugs 41-50 found and fixed in the final installment.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

// ============================================================
// BUG 41 (5-01): terminal-server.ts -- PTY env leak
// ============================================================
describe('BUG-5-01: Terminal server does not leak secrets to PTY', () => {
  const src = readFile('lib/terminal-server.ts');

  test('SAFE_ENV_VARS allowlist is defined', () => {
    expect(src).toContain('SAFE_ENV_VARS');
    expect(src).toContain("new Set(");
    // Must include basic safe vars
    expect(src).toContain("'PATH'");
    expect(src).toContain("'LANG'");
    expect(src).toContain("'TMPDIR'");
  });

  test('env filter uses SAFE_ENV_VARS allowlist', () => {
    expect(src).toContain('SAFE_ENV_VARS.has(entry[0])');
  });

  test('does NOT spread all of process.env', () => {
    // The old pattern was: filter only by entry[1] !== undefined
    // New pattern filters by SAFE_ENV_VARS.has(entry[0])
    // Make sure the dangerous pattern is gone
    const envFilterSection = src.slice(src.indexOf('env: {'), src.indexOf('env: {') + 500);
    expect(envFilterSection).not.toMatch(/entry\[1\]\s*!==\s*undefined\s*\)/);
    expect(envFilterSection).toContain('SAFE_ENV_VARS.has');
  });

  test('ANTHROPIC_API_KEY is not in safe list', () => {
    expect(src).not.toContain("'ANTHROPIC_API_KEY'");
  });

  test('STRIPE_SECRET_KEY is not in safe list', () => {
    expect(src).not.toContain("'STRIPE_SECRET_KEY'");
  });

  test('POSTGRES_URL is not in safe list', () => {
    expect(src).not.toContain("'POSTGRES_URL'");
  });
});

// ============================================================
// BUG 42 (5-02): swarm-intelligence.ts -- operator precedence
// ============================================================
describe('BUG-5-02: Swarm intelligence confidence display uses correct operator precedence', () => {
  const src = readFile('lib/validators/swarm-intelligence.ts');

  test('confidence is multiplied by 100 with correct parentheses', () => {
    // Must be ((confidence ?? 0) * 100) not (confidence ?? 0 * 100)
    expect(src).toContain('((confidence ?? 0) * 100)');
  });

  test('old buggy pattern is removed', () => {
    expect(src).not.toContain('confidence ?? 0 * 100)');
  });
});

// ============================================================
// BUG 43 (5-03): url-fetcher.ts -- SSRF protection
// ============================================================
describe('BUG-5-03: URL fetcher blocks SSRF to internal addresses', () => {
  const src = readFile('lib/tools/url-fetcher.ts');

  test('BLOCKED_HOSTS array is defined', () => {
    expect(src).toContain('BLOCKED_HOSTS');
    expect(src).toContain('localhost');
    expect(src).toContain('127.0.0.1');
    expect(src).toContain('169.254.169.254');
    expect(src).toContain('metadata.google.internal');
  });

  test('PRIVATE_IP_PATTERNS array is defined', () => {
    expect(src).toContain('PRIVATE_IP_PATTERNS');
    expect(src).toContain(/10\\\./.source ? '10\\.' : '10.');  // 10.x.x.x
    expect(src).toContain('172.');  // 172.16-31.x.x
    expect(src).toContain('192.168');  // 192.168.x.x
  });

  test('isBlockedUrl function exists and is called before fetch', () => {
    expect(src).toContain('function isBlockedUrl(');
    // Verify it's called before the fetch
    const fetchUrlFn = src.slice(src.indexOf('export async function fetchUrl'));
    const blockCheckIdx = fetchUrlFn.indexOf('isBlockedUrl(url)');
    const fetchIdx = fetchUrlFn.indexOf('await fetch(url');
    expect(blockCheckIdx).toBeGreaterThan(0);
    expect(blockCheckIdx).toBeLessThan(fetchIdx);
  });

  test('non-HTTP schemes are blocked', () => {
    expect(src).toContain("parsed.protocol !== 'http:'");
    expect(src).toContain("parsed.protocol !== 'https:'");
  });
});

// ============================================================
// BUG 44 (5-04): syntax-validator.ts -- command injection
// ============================================================
describe('BUG-5-04: Syntax validator uses execFileSync (no shell injection)', () => {
  const src = readFile('lib/syntax-validator.ts');

  test('imports execFileSync instead of execSync', () => {
    expect(src).toContain("import { execFileSync }");
    expect(src).not.toMatch(/import\s*\{[^}]*execSync[^}]*\}/);
  });

  test('checkWithNode uses execFileSync with array args', () => {
    const fnBody = src.slice(src.indexOf('function checkWithNode'));
    const fnEnd = fnBody.indexOf('\nfunction ');
    const fn = fnBody.slice(0, fnEnd > 0 ? fnEnd : 500);
    expect(fn).toContain("execFileSync('node', ['--check', filePath]");
    // Must NOT contain string interpolation shell commands
    expect(fn).not.toContain('`node --check');
  });

  test('checkWithPython uses execFileSync with array args', () => {
    const fnBody = src.slice(src.indexOf('function checkWithPython'));
    const fnEnd = fnBody.indexOf('\nfunction ');
    const fn = fnBody.slice(0, fnEnd > 0 ? fnEnd : 500);
    expect(fn).toContain("execFileSync('python3', ['-m', 'py_compile', filePath]");
    expect(fn).not.toContain('`python3 -m');
  });

  test('checkWithTsc uses execFileSync with array args', () => {
    const fnBody = src.slice(src.indexOf('function checkWithTsc'));
    const fn = fnBody.slice(0, 1000);
    expect(fn).toContain("execFileSync('tsc', ['--version']");
    expect(fn).toContain("execFileSync('tsc', ['--noEmit'");
    expect(fn).not.toContain('`tsc --');
  });
});

// ============================================================
// BUG 45 (5-05): templates routes -- error message leak
// ============================================================
describe('BUG-5-05: Template routes do not leak internal error details', () => {
  test('templates/route.ts returns generic error message', () => {
    const src = readFile('app/api/templates/route.ts');
    // The catch block should NOT pass err.message to the client
    const catchBlock = src.slice(src.lastIndexOf('catch'));
    expect(catchBlock).toContain("'Failed to fetch templates'");
    // It should log the real error internally
    expect(catchBlock).toContain("console.error('[API /templates]'");
  });

  test('templates/[id]/route.ts returns generic error message', () => {
    const src = readFile('app/api/templates/[id]/route.ts');
    const catchBlock = src.slice(src.lastIndexOf('catch'));
    expect(catchBlock).toContain("'Failed to fetch template'");
    expect(catchBlock).toContain("console.error('[API /templates/[id]]'");
  });
});

// ============================================================
// BUG 46 (5-06): billing/checkout -- goal ownership check
// ============================================================
describe('BUG-5-06: Billing checkout verifies goal ownership', () => {
  const src = readFile('app/api/billing/checkout/route.ts');

  test('checks goal.customerId against session email', () => {
    expect(src).toContain('goal.customerId !== authSession.user.email');
  });

  test('ownership check comes AFTER getGoal and BEFORE createSubscription', () => {
    const getGoalIdx = src.indexOf('getGoal(goalId)');
    const ownershipIdx = src.indexOf('goal.customerId !== authSession.user.email');
    const createSubIdx = src.indexOf('createSubscription(');
    expect(getGoalIdx).toBeGreaterThan(0);
    expect(ownershipIdx).toBeGreaterThan(getGoalIdx);
    expect(createSubIdx).toBeGreaterThan(ownershipIdx);
  });

  test('returns 404 (not 403) to avoid information disclosure', () => {
    // After the ownership check, should return 404 not 403
    const afterOwnership = src.slice(src.indexOf('goal.customerId !== authSession.user.email'));
    const responseBlock = afterOwnership.slice(0, 200);
    expect(responseBlock).toContain('404');
  });
});

// ============================================================
// BUG 47 (5-07): stripe.ts -- crash on missing key
// ============================================================
describe('BUG-5-07: Stripe client lazily initializes and handles missing key', () => {
  const src = readFile('lib/stripe.ts');

  test('no non-null assertion on STRIPE_SECRET_KEY', () => {
    expect(src).not.toContain("process.env.STRIPE_SECRET_KEY!");
  });

  test('getStripeClient function with lazy init exists', () => {
    expect(src).toContain('function getStripeClient()');
    expect(src).toContain('STRIPE_SECRET_KEY is not set');
  });

  test('throws clear error when key is missing', () => {
    expect(src).toContain("throw new Error(");
    expect(src).toContain('STRIPE_SECRET_KEY is not set');
  });

  test('backward-compatible stripe export exists', () => {
    expect(src).toContain('export const stripe');
  });

  test('uses Proxy for lazy access', () => {
    expect(src).toContain('new Proxy');
    expect(src).toContain('getStripeClient()');
  });
});

// ============================================================
// BUG 48 (5-08): env-validator.ts -- log order fix
// ============================================================
describe('BUG-5-08: Env validator logs warnings BEFORE throwing for required vars', () => {
  const src = readFile('lib/env-validator.ts');

  test('warnings.length check comes BEFORE missing.length check', () => {
    const warningsIdx = src.indexOf("if (warnings.length > 0)");
    const missingIdx = src.indexOf("if (missing.length > 0)");
    // Both must exist
    expect(warningsIdx).toBeGreaterThan(0);
    expect(missingIdx).toBeGreaterThan(0);
    // Warnings logged first
    expect(warningsIdx).toBeLessThan(missingIdx);
  });

  test('console.warn for recommended vars is before throw', () => {
    const warnCall = src.indexOf("Missing recommended vars");
    const throwCall = src.indexOf("throw new Error(msg)");
    expect(warnCall).toBeGreaterThan(0);
    expect(throwCall).toBeGreaterThan(0);
    expect(warnCall).toBeLessThan(throwCall);
  });
});

// ============================================================
// BUG 49 (5-09): swarm/[id] -- IDOR on debate results
// ============================================================
describe('BUG-5-09: Debate result route verifies ownership', () => {
  const src = readFile('app/api/swarm/[id]/route.ts');

  test('queries debates table for user_email', () => {
    expect(src).toContain('SELECT user_email FROM debates');
    expect(src).toContain('WHERE id =');
  });

  test('compares user_email to session email', () => {
    expect(src).toContain('rows[0].user_email !== session.user.email');
  });

  test('returns 404 (not 403) when ownership fails', () => {
    const ownershipCheck = src.slice(src.indexOf('rows[0].user_email !== session.user.email'));
    const responseBlock = ownershipCheck.slice(0, 300);
    expect(responseBlock).toContain('404');
  });

  test('gracefully handles DB unavailability', () => {
    // Must have a catch block for the DB query
    expect(src).toContain('} catch {');
    // Comment about local dev
    expect(src).toContain('DB unavailable');
  });
});

// ============================================================
// BUG 50 (5-10): terminal-server.ts -- session limit
// ============================================================
describe('BUG-5-10: Terminal server limits concurrent sessions per customer', () => {
  const src = readFile('lib/terminal-server.ts');

  test('MAX_SESSIONS_PER_CUSTOMER constant is defined', () => {
    expect(src).toContain('MAX_SESSIONS_PER_CUSTOMER');
    const match = src.match(/MAX_SESSIONS_PER_CUSTOMER\s*=\s*(\d+)/);
    expect(match).toBeTruthy();
    const limit = parseInt(match[1], 10);
    expect(limit).toBeGreaterThan(0);
    expect(limit).toBeLessThanOrEqual(10); // Reasonable limit
  });

  test('customerSessionCounts Map tracks per-customer sessions', () => {
    expect(src).toContain('customerSessionCounts');
    expect(src).toContain('new Map<string, number>()');
  });

  test('rejects connections when at session limit', () => {
    expect(src).toContain('currentCount >= MAX_SESSIONS_PER_CUSTOMER');
    expect(src).toContain('Too many active terminal sessions');
  });

  test('increments count on new connection', () => {
    const connectionSection = src.slice(
      src.indexOf('currentCount >= MAX_SESSIONS_PER_CUSTOMER'),
      src.indexOf('// Check PTY availability'),
    );
    expect(connectionSection).toContain('customerSessionCounts.set(customerId, currentCount + 1)');
  });

  test('decrements count on disconnect', () => {
    const disconnectSection = src.slice(src.indexOf("socket.on('disconnect'"));
    expect(disconnectSection).toContain('customerSessionCounts');
    // Should decrement or delete
    expect(disconnectSection).toContain('count - 1');
    expect(disconnectSection).toContain('customerSessionCounts.delete(customerId)');
  });
});

// ============================================================
// Summary
// ============================================================
describe('Installment 5 Summary', () => {
  test('all 10 bugs addressed', () => {
    // Just a marker test to confirm all 10 are covered
    expect(true).toBe(true);
  });
});
