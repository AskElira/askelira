/**
 * AskElira 2.1 -- Smoke Test
 *
 * Quick verification that the environment, database, and key subsystems
 * are working. Designed to be cheap: only 1 Brave Search call.
 * Does NOT call designBuilding or runFloor (those cost real API tokens).
 *
 * Usage: npx tsx scripts/smoke-test.ts   (or: npm run smoke)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '..', '.env') });

let passed = 0;
let failed = 0;

function pass(name: string) {
  console.log(`  PASS: ${name}`);
  passed++;
}

function fail(name: string, reason: string) {
  console.error(`  FAIL: ${name} -- ${reason}`);
  failed++;
}

async function main() {
  console.log('\n=== AskElira 2.1 Smoke Test ===\n');

  // -------------------------------------------------------
  // 1. ENV CHECK
  // -------------------------------------------------------
  console.log('[1] Environment Variables');

  const requiredVars = ['ANTHROPIC_API_KEY', 'POSTGRES_URL', 'BRAVE_SEARCH_API_KEY'];
  for (const v of requiredVars) {
    if (process.env[v]) {
      pass(`${v} is set`);
    } else {
      fail(`${v} is set`, 'not found in environment');
    }
  }

  // -------------------------------------------------------
  // 2. DB CHECK -- SELECT 1 from each table
  // -------------------------------------------------------
  console.log('\n[2] Database Tables');

  const tables = [
    'goals',
    'floors',
    'agent_logs',
    'heartbeat_logs',
    'automation_patterns',
    'subscriptions',
    'building_templates',
    'floor_snapshots',
  ];

  let dbAvailable = false;
  try {
    const { createPool } = await import('@vercel/postgres');
    const pool = createPool({ connectionString: process.env.POSTGRES_URL });

    for (const table of tables) {
      try {
        await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
        pass(`${table} exists`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        fail(`${table} exists`, msg);
      }
    }

    dbAvailable = true;
    await pool.end();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    fail('Database connection', msg);
  }

  // -------------------------------------------------------
  // 3. ALBA CHECK -- Brave Search (1 call)
  // -------------------------------------------------------
  console.log('\n[3] Alba (Brave Search)');

  try {
    const { braveSearch } = await import('../lib/tools/brave-search');
    const results = await braveSearch('Node.js web scraping 2026', 2);

    if (results && results.length > 0) {
      pass(`Brave Search returned ${results.length} result(s)`);
    } else {
      fail('Brave Search returned results', 'empty response');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    fail('Brave Search', msg);
  }

  // -------------------------------------------------------
  // 4. HEARTBEAT CHECK -- registry test (no API calls)
  // -------------------------------------------------------
  console.log('\n[4] Heartbeat Registry');

  try {
    const { startHeartbeat, stopHeartbeat, getHeartbeatStatus } = await import(
      '../lib/heartbeat'
    );

    const testGoalId = '00000000-0000-0000-0000-000000000000';

    // Start should register without error
    startHeartbeat(testGoalId, 86400000); // 24h interval so it never actually fires
    const status = getHeartbeatStatus(testGoalId);

    if (status.active) {
      pass('startHeartbeat registered successfully');
    } else {
      fail('startHeartbeat registered', 'status.active is false');
    }

    // Stop should clean up
    stopHeartbeat(testGoalId);
    const afterStop = getHeartbeatStatus(testGoalId);

    if (!afterStop.active) {
      pass('stopHeartbeat cleaned up successfully');
    } else {
      fail('stopHeartbeat cleaned up', 'status.active is still true');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    fail('Heartbeat Registry', msg);
  }

  // -------------------------------------------------------
  // 5. PATTERN CHECK -- getTopPatterns query (may return 0)
  // -------------------------------------------------------
  console.log('\n[5] Pattern Manager');

  if (dbAvailable) {
    try {
      const { getTopPatterns } = await import('../lib/pattern-manager');
      const patterns = await getTopPatterns('lead-generation', 5);
      pass(`getTopPatterns returned ${patterns.length} pattern(s) (0 is OK)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      fail('getTopPatterns', msg);
    }
  } else {
    fail('getTopPatterns', 'skipped -- database not available');
  }

  // -------------------------------------------------------
  // 6. CLEANUP
  // -------------------------------------------------------
  console.log('\n[6] Cleanup');
  pass('No test data to clean (smoke test is read-only)');

  // -------------------------------------------------------
  // 7. SUMMARY
  // -------------------------------------------------------
  console.log('\n=== Summary ===');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${passed + failed}`);
  console.log();

  if (failed > 0) {
    console.error('Smoke test FAILED. Fix the issues above before deploying.\n');
    process.exit(1);
  } else {
    console.log('Smoke test PASSED. All systems operational.\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
