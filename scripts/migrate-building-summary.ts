/**
 * Migration: Add building_summary column to goals table.
 * Run: npx tsx scripts/migrate-building-summary.ts
 */
import { resolve } from 'path';
import { config } from 'dotenv';
config({ path: resolve(__dirname, '..', '.env') });

async function migrate() {
  const { sql } = await import('@vercel/postgres');

  console.log('[Migration] Adding building_summary column to goals...');

  await sql`
    ALTER TABLE goals ADD COLUMN IF NOT EXISTS building_summary TEXT
  `;

  console.log('[Migration] Done.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('[Migration] Failed:', err);
  process.exit(1);
});
