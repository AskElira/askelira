// Run Phase 8 migration: automation_patterns table
// Usage: node scripts/migrate-patterns.mjs

import { createPool } from '@vercel/postgres';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

const statements = [
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
];

console.log(`Running ${statements.length} Phase 8 migration statements...\n`);

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

console.log('\nPhase 8 migration complete.');
await pool.end();
