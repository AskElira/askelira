// Run migration SQL against Vercel Postgres via Node.js
// Usage: node scripts/run-migration.mjs

import { createPool } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

// Run each statement individually
const statements = [
  // Table 1: goals
  `CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL,
    goal_text TEXT NOT NULL,
    customer_context JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'planning'
      CHECK (status IN ('planning','building','goal_met','blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  // Table 2: floors
  `CREATE TABLE IF NOT EXISTS floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    floor_number INT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    success_condition TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending','researching','building','auditing','live','broken','blocked')),
    research_output TEXT,
    build_output TEXT,
    vex_gate1_report TEXT,
    vex_gate2_report TEXT,
    iteration_count INT DEFAULT 0,
    building_context TEXT,
    handoff_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
  )`,
  // Table 3: agent_logs
  `CREATE TABLE IF NOT EXISTS agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID REFERENCES floors(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    iteration INT DEFAULT 1,
    action TEXT NOT NULL,
    input_summary TEXT,
    output_summary TEXT,
    tool_calls_made JSONB DEFAULT '[]',
    tokens_used INT DEFAULT 0,
    duration_ms INT DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW()
  )`,
  // Table 4: heartbeat_logs
  `CREATE TABLE IF NOT EXISTS heartbeat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    condition_met BOOLEAN NOT NULL DEFAULT FALSE,
    steven_observation TEXT,
    action_taken TEXT
      CHECK (action_taken IN ('healthy','rerun','escalate','billing_paused'))
  )`,
  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_floors_goal_id ON floors(goal_id)`,
  `CREATE INDEX IF NOT EXISTS idx_agent_logs_floor_id ON agent_logs(floor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_agent_logs_goal_id ON agent_logs(goal_id)`,
  `CREATE INDEX IF NOT EXISTS idx_heartbeat_logs_floor_id ON heartbeat_logs(floor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_heartbeat_logs_goal_id ON heartbeat_logs(goal_id)`,
  `CREATE INDEX IF NOT EXISTS idx_goals_customer_id ON goals(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status)`,
];

console.log(`Running ${statements.length} migration statements...\n`);

for (const stmt of statements) {
  const preview = stmt.replace(/\s+/g, ' ').trim().slice(0, 80);
  try {
    await pool.query(stmt);
    console.log(`OK: ${preview}...`);
  } catch (err) {
    console.error(`FAIL: ${preview}...`);
    console.error(`  ${err.message}`);
  }
}

console.log('\nMigration complete.');
await pool.end();
