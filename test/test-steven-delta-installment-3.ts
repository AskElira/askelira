/**
 * Steven Delta — Installment 3: Deployment and Environment Hardening
 * Tests for SD-021 through SD-030
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  FAIL: ${name}`);
    console.error(`        ${msg}`);
    failed++;
  }
}

console.log('\n=== Steven Delta Installment 3: Deployment & Environment Hardening ===\n');

// SD-021: Startup env validation
test('SD-021: instrumentation.ts validates env on startup', () => {
  const src = fs.readFileSync(path.join(ROOT, 'instrumentation.ts'), 'utf-8');
  assert.ok(src.includes('validateEnvironment'), 'Should call validateEnvironment');
  assert.ok(src.includes('NEXT_RUNTIME'), 'Should check Node.js runtime');
});

// SD-022: vercel.json config
test('SD-022: vercel.json has security headers', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf-8'));
  const headers = config.headers[0].headers;
  const headerKeys = headers.map((h: { key: string }) => h.key);
  assert.ok(headerKeys.includes('Strict-Transport-Security'), 'Should have HSTS');
  assert.ok(headerKeys.includes('Permissions-Policy'), 'Should have Permissions-Policy');
  assert.ok(headerKeys.includes('X-Frame-Options'), 'Should have X-Frame-Options');
});

test('SD-022: vercel.json has function timeouts', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf-8'));
  assert.ok(config.functions, 'Should have functions config');
});

test('SD-022: vercel.json has archive cron', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf-8'));
  const cronPaths = config.crons.map((c: { path: string }) => c.path);
  assert.ok(cronPaths.includes('/api/cron/archive-goals'), 'Should have archive goals cron');
});

// SD-023: Health check robustness
test('SD-023: health endpoint checks DB', () => {
  const src = fs.readFileSync(path.join(ROOT, 'app/api/health/route.ts'), 'utf-8');
  assert.ok(src.includes('database'), 'Should include database status');
  assert.ok(src.includes('503'), 'Should return 503 when degraded');
});

// SD-024: Graceful shutdown
test('SD-024: instrumentation has graceful shutdown', () => {
  const src = fs.readFileSync(path.join(ROOT, 'instrumentation.ts'), 'utf-8');
  assert.ok(src.includes('SIGTERM'), 'Should handle SIGTERM');
  assert.ok(src.includes('SIGINT'), 'Should handle SIGINT');
  assert.ok(src.includes('gracefully'), 'Should mention graceful shutdown');
});

// SD-025: NODE_ENV enforcement
test('SD-025: instrumentation checks NODE_ENV', () => {
  const src = fs.readFileSync(path.join(ROOT, 'instrumentation.ts'), 'utf-8');
  assert.ok(src.includes('NODE_ENV'), 'Should check NODE_ENV');
});

// SD-026: Secrets scanning
test('SD-026: scan-secrets.mjs exists', () => {
  const src = fs.readFileSync(path.join(ROOT, 'scripts/scan-secrets.mjs'), 'utf-8');
  assert.ok(src.includes('PATTERNS'), 'Should have detection patterns');
  assert.ok(src.includes('Stripe'), 'Should detect Stripe keys');
  assert.ok(src.includes('PRIVATE KEY'), 'Should detect private keys');
});

test('SD-026: security:scan script exists in package.json', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  assert.ok(pkg.scripts['security:scan'], 'Should have security:scan script');
});

// SD-027: Dependency audit
test('SD-027: security:audit script exists in package.json', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  assert.ok(pkg.scripts['security:audit'], 'Should have security:audit script');
  assert.ok(pkg.scripts['security:audit'].includes('npm audit'), 'Should run npm audit');
});

// SD-028: .env.example completeness
test('SD-028: .env.example has all key variables', () => {
  const example = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf-8');
  assert.ok(example.includes('ANTHROPIC_API_KEY'), 'Should have ANTHROPIC_API_KEY');
  assert.ok(example.includes('POSTGRES_URL'), 'Should have POSTGRES_URL');
  assert.ok(example.includes('TELEGRAM_BOT_TOKEN'), 'Should have TELEGRAM_BOT_TOKEN');
  assert.ok(example.includes('CRON_SECRET'), 'Should have CRON_SECRET');
  assert.ok(example.includes('STRIPE_SECRET_KEY'), 'Should have STRIPE_SECRET_KEY');
  assert.ok(example.includes('NODE_ENV'), 'Should have NODE_ENV');
});

// SD-029: Build artifact cleanup
test('SD-029: .gitignore has build artifacts', () => {
  const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf-8');
  assert.ok(gitignore.includes('.askelira-exec'), 'Should ignore execution outputs');
  assert.ok(gitignore.includes('tsbuildinfo'), 'Should ignore TS build info');
});

// SD-030: Production readiness checklist
test('SD-030: PRODUCTION_CHECKLIST.md exists', () => {
  const src = fs.readFileSync(path.join(ROOT, 'PRODUCTION_CHECKLIST.md'), 'utf-8');
  assert.ok(src.includes('Environment'), 'Should have Environment section');
  assert.ok(src.includes('Database'), 'Should have Database section');
  assert.ok(src.includes('Security'), 'Should have Security section');
  assert.ok(src.includes('Monitoring'), 'Should have Monitoring section');
  assert.ok(src.includes('Billing'), 'Should have Billing section');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed (${passed + failed} total)\n`);
process.exit(failed > 0 ? 1 : 0);
