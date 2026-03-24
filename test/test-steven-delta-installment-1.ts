/**
 * Steven Delta — Installment 1: Database and Data Integrity
 * Tests for SD-001 through SD-010
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

console.log('\n=== Steven Delta Installment 1: Database & Data Integrity ===\n');

// SD-001: Migrations system
test('SD-001: migrations/ folder exists', () => {
  assert.ok(fs.existsSync(path.join(ROOT, 'migrations')), 'migrations/ directory should exist');
});

test('SD-001: numbered migration files exist', () => {
  const files = fs.readdirSync(path.join(ROOT, 'migrations')).filter(f => f.endsWith('.sql'));
  assert.ok(files.length >= 11, `Should have at least 11 migration files, found ${files.length}`);
  assert.ok(files[0].startsWith('001_'), 'First migration should start with 001_');
});

test('SD-001: migrate-all.mjs reads from migrations/', () => {
  const src = fs.readFileSync(path.join(ROOT, 'scripts/migrate-all.mjs'), 'utf-8');
  assert.ok(src.includes('migrations'), 'Should reference migrations directory');
  assert.ok(src.includes('readdirSync'), 'Should scan migration files');
  assert.ok(!src.includes('const statements = ['), 'Should NOT have hardcoded statements array');
});

// SD-002: Connection pooling
test('SD-002: db-pool.ts exists with pool monitoring', () => {
  const src = fs.readFileSync(path.join(ROOT, 'lib/db-pool.ts'), 'utf-8');
  assert.ok(src.includes('monitoredQuery'), 'Should export monitoredQuery');
  assert.ok(src.includes('POOL_WARNING_THRESHOLD'), 'Should have pool warning threshold');
  assert.ok(src.includes('pingDatabase'), 'Should export pingDatabase');
});

// SD-003: Soft delete
test('SD-003: soft delete migration exists', () => {
  const src = fs.readFileSync(path.join(ROOT, 'migrations/009_soft_delete.sql'), 'utf-8');
  assert.ok(src.includes('deleted_at'), 'Should add deleted_at column');
});

test('SD-003: getGoal filters deleted goals', () => {
  const src = fs.readFileSync(path.join(ROOT, 'lib/building-manager.ts'), 'utf-8');
  assert.ok(src.includes('AND deleted_at IS NULL'), 'getGoal should filter deleted goals');
});

test('SD-003: softDeleteGoal function exists', () => {
  const src = fs.readFileSync(path.join(ROOT, 'lib/building-manager.ts'), 'utf-8');
  assert.ok(src.includes('export async function softDeleteGoal'), 'Should export softDeleteGoal');
});

// SD-004: Archiving
test('SD-004: archive migration exists', () => {
  const src = fs.readFileSync(path.join(ROOT, 'migrations/010_archiving.sql'), 'utf-8');
  assert.ok(src.includes('archived_at'), 'Should add archived_at column');
});

test('SD-004: archive cron endpoint exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, 'app/api/cron/archive-goals/route.ts')),
    'Archive cron route should exist',
  );
  const src = fs.readFileSync(path.join(ROOT, 'app/api/cron/archive-goals/route.ts'), 'utf-8');
  assert.ok(src.includes('CRON_SECRET'), 'Should be protected by CRON_SECRET');
  assert.ok(src.includes('archived_at'), 'Should set archived_at');
});

// SD-005: Query logging
test('SD-005: db-logger.ts exists', () => {
  const src = fs.readFileSync(path.join(ROOT, 'lib/db-logger.ts'), 'utf-8');
  assert.ok(src.includes('withQueryLog'), 'Should export withQueryLog');
  assert.ok(src.includes('LOG_SLOW_THRESHOLD_MS'), 'Should have slow query threshold');
});

// SD-006: Data export
test('SD-006: /api/user/export route exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, 'app/api/user/export/route.ts')),
    'User export route should exist',
  );
  const src = fs.readFileSync(path.join(ROOT, 'app/api/user/export/route.ts'), 'utf-8');
  assert.ok(src.includes('getServerSession'), 'Should require auth');
  assert.ok(src.includes('Content-Disposition'), 'Should set download header');
});

// SD-007: DB health check
test('SD-007: health endpoint includes DB check', () => {
  const src = fs.readFileSync(path.join(ROOT, 'app/api/health/route.ts'), 'utf-8');
  assert.ok(src.includes('SELECT 1'), 'Should ping DB');
  assert.ok(src.includes('database'), 'Should report database status');
  assert.ok(src.includes('latencyMs'), 'Should report latency');
  assert.ok(src.includes('degraded'), 'Should report degraded when DB is down');
});

// SD-008: Additional indexes
test('SD-008: additional indexes migration exists', () => {
  const src = fs.readFileSync(path.join(ROOT, 'migrations/011_additional_indexes.sql'), 'utf-8');
  assert.ok(src.includes('idx_floors_status'), 'Should have floors status index');
  assert.ok(src.includes('idx_agent_logs_timestamp'), 'Should have agent logs timestamp index');
  assert.ok(src.includes('idx_goals_created_at'), 'Should have goals created_at index');
});

// SD-009: Backup reminder
test('SD-009: backup reminder in heartbeat', () => {
  const src = fs.readFileSync(path.join(ROOT, 'lib/heartbeat.ts'), 'utf-8');
  assert.ok(src.includes('BACKUP_REMINDER_INTERVAL_MS'), 'Should have backup reminder interval');
  assert.ok(src.includes('Backup Reminder'), 'Should send backup reminder notification');
});

// SD-010: Schema validation
test('SD-010: validate-schema.mjs exists', () => {
  const src = fs.readFileSync(path.join(ROOT, 'scripts/validate-schema.mjs'), 'utf-8');
  assert.ok(src.includes('EXPECTED_TABLES'), 'Should check expected tables');
  assert.ok(src.includes('EXPECTED_COLUMNS'), 'Should check expected columns');
  assert.ok(src.includes('information_schema'), 'Should query information_schema');
});

test('SD-010: db:validate script in package.json', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  assert.ok(pkg.scripts['db:validate'], 'Should have db:validate script');
});

// SD-003: goals list filters deleted
test('SD-003: goals API filters deleted rows', () => {
  const src = fs.readFileSync(path.join(ROOT, 'app/api/goals/route.ts'), 'utf-8');
  assert.ok(src.includes('deleted_at IS NULL'), 'Goals list should filter deleted goals');
});

console.log(`\n  Results: ${passed} passed, ${failed} failed (${passed + failed} total)\n`);
process.exit(failed > 0 ? 1 : 0);
