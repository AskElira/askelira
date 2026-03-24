// Run Phase 9 migration: subscriptions table + billing_status column on goals
// Usage: node scripts/migrate-subscriptions.mjs

import { createPool } from '@vercel/postgres';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

const statements = [
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
  `ALTER TABLE goals ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'unpaid'`,
];

console.log(`Running ${statements.length} Phase 9 migration statements...\n`);

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

console.log('\nPhase 9 migration complete.');
await pool.end();
