// AskElira 2.1 -- Unified Database Migration
// Runs ALL migrations in order. Every statement is idempotent (IF NOT EXISTS / IF NOT EXISTS).
// Usage: node scripts/migrate-all.mjs   (or: npm run db:migrate)

import { createPool } from '@vercel/postgres';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

if (!process.env.POSTGRES_URL) {
  console.error('FATAL: POSTGRES_URL not set. Add it to .env');
  process.exit(1);
}

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

const statements = [
  // ============================================================
  // 1. goals table (Phase 2)
  // ============================================================
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

  // ============================================================
  // 2. floors table (Phase 2)
  // ============================================================
  `CREATE TABLE IF NOT EXISTS floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    floor_number INT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    success_condition TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN (
        'pending','researching','building',
        'auditing','live','broken','blocked'
      )),
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

  // ============================================================
  // 3. agent_logs table (Phase 2)
  // ============================================================
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

  // ============================================================
  // 4. heartbeat_logs table (Phase 2)
  // ============================================================
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

  // ============================================================
  // 5. goals indexes (Phase 2)
  // ============================================================
  `CREATE INDEX IF NOT EXISTS idx_floors_goal_id ON floors(goal_id)`,
  `CREATE INDEX IF NOT EXISTS idx_agent_logs_floor_id ON agent_logs(floor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_agent_logs_goal_id ON agent_logs(goal_id)`,
  `CREATE INDEX IF NOT EXISTS idx_heartbeat_logs_floor_id ON heartbeat_logs(floor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_heartbeat_logs_goal_id ON heartbeat_logs(goal_id)`,
  `CREATE INDEX IF NOT EXISTS idx_goals_customer_id ON goals(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status)`,

  // ============================================================
  // 6. ALTER goals: building_summary (Phase 3)
  // ============================================================
  `ALTER TABLE goals ADD COLUMN IF NOT EXISTS building_summary TEXT`,

  // ============================================================
  // 7. automation_patterns table + indexes (Phase 8)
  // ============================================================
  `CREATE TABLE IF NOT EXISTS automation_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    pattern_description TEXT NOT NULL,
    source_url TEXT,
    implementation_notes TEXT,
    confidence FLOAT NOT NULL DEFAULT 0.5,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    use_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    source TEXT DEFAULT 'scraper'
      CHECK (source IN ('scraper','customer_build','manual')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_patterns_category ON automation_patterns(category)`,
  `CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON automation_patterns(confidence DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_patterns_category_confidence ON automation_patterns(category, confidence DESC)`,

  // ============================================================
  // 8. subscriptions table + indexes (Phase 9)
  // ============================================================
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL,
    goal_id UUID NOT NULL REFERENCES goals(id),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_payment_intent_id TEXT,
    plan_paid BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending','active','past_due','canceled','paused')),
    floors_active INT DEFAULT 0,
    current_period_end TIMESTAMPTZ,
    grace_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_subs_goal_id ON subscriptions(goal_id)`,
  `CREATE INDEX IF NOT EXISTS idx_subs_customer_id ON subscriptions(customer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_subs_stripe_sub ON subscriptions(stripe_subscription_id)`,

  // ============================================================
  // 9. ALTER goals: billing_status (Phase 9)
  // ============================================================
  `ALTER TABLE goals ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'unpaid'`,

  // ============================================================
  // 10. building_templates table + index (Phase 10)
  // ============================================================
  `CREATE TABLE IF NOT EXISTS building_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_text TEXT NOT NULL,
    building_summary TEXT NOT NULL DEFAULT '',
    category TEXT,
    floor_blueprints JSONB NOT NULL DEFAULT '[]',
    use_count INT DEFAULT 0,
    avg_completion_hours FLOAT,
    is_public BOOLEAN DEFAULT TRUE,
    source_goal_id UUID REFERENCES goals(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_templates_category ON building_templates(category)`,

  // ============================================================
  // 11. floor_snapshots table (Phase 10)
  // ============================================================
  `CREATE TABLE IF NOT EXISTS floor_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    reason TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL,
    research_output TEXT,
    build_output TEXT,
    vex_gate1_report TEXT,
    vex_gate2_report TEXT,
    iteration_count INT DEFAULT 0,
    building_context TEXT,
    handoff_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
];

// Run all statements
console.log(`AskElira 2.1 -- Running ${statements.length} migration statements...\n`);

let ok = 0;
let fail = 0;

for (const stmt of statements) {
  const preview = stmt.replace(/\s+/g, ' ').trim().slice(0, 90);
  try {
    await pool.query(stmt);
    console.log(`OK:   ${preview}...`);
    ok++;
  } catch (err) {
    console.error(`FAIL: ${preview}...`);
    console.error(`      ${err.message}`);
    fail++;
  }
}

console.log(`\nMigration complete. ${ok} OK, ${fail} FAIL (out of ${statements.length} total).`);
await pool.end();

if (fail > 0) {
  process.exit(1);
}
