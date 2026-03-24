// AskElira 2.1 -- Schema Validation Script (Steven Delta SD-010)
// Verifies that all expected tables and columns exist in the database.
// Usage: node scripts/validate-schema.mjs
// Exit code 0 = valid, 1 = missing tables/columns

import { createPool } from '@vercel/postgres';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

if (!process.env.POSTGRES_URL) {
  console.error('FATAL: POSTGRES_URL not set');
  process.exit(1);
}

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

const EXPECTED_TABLES = [
  'goals',
  'floors',
  'agent_logs',
  'heartbeat_logs',
  'automation_patterns',
  'subscriptions',
  'building_templates',
  'floor_snapshots',
];

const EXPECTED_COLUMNS = {
  goals: ['id', 'customer_id', 'goal_text', 'status', 'building_summary', 'billing_status', 'created_at', 'updated_at'],
  floors: ['id', 'goal_id', 'floor_number', 'name', 'status', 'created_at'],
  agent_logs: ['id', 'floor_id', 'goal_id', 'agent_name', 'action', 'timestamp'],
  heartbeat_logs: ['id', 'floor_id', 'goal_id', 'condition_met', 'checked_at'],
  subscriptions: ['id', 'customer_id', 'goal_id', 'status', 'plan_paid'],
};

let failures = 0;

// Check tables exist
const { rows: tables } = await pool.query(
  `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
);
const tableNames = new Set(tables.map((r) => r.table_name));

for (const expected of EXPECTED_TABLES) {
  if (tableNames.has(expected)) {
    console.log(`OK:   Table '${expected}' exists`);
  } else {
    console.error(`FAIL: Table '${expected}' MISSING`);
    failures++;
  }
}

// Check key columns
for (const [table, columns] of Object.entries(EXPECTED_COLUMNS)) {
  if (!tableNames.has(table)) continue;

  const { rows: cols } = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'`,
    [table]
  );
  const colNames = new Set(cols.map((r) => r.column_name));

  for (const col of columns) {
    if (colNames.has(col)) {
      console.log(`OK:   ${table}.${col}`);
    } else {
      console.error(`FAIL: ${table}.${col} MISSING`);
      failures++;
    }
  }
}

await pool.end();

if (failures > 0) {
  console.error(`\nSchema validation FAILED: ${failures} issue(s). Run 'npm run db:migrate' to fix.`);
  process.exit(1);
} else {
  console.log('\nSchema validation PASSED.');
}
