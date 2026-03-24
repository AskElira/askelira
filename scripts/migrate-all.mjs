// AskElira 2.1 -- Unified Database Migration Runner
// Reads numbered SQL files from migrations/ and runs them in order.
// Every statement is idempotent (IF NOT EXISTS / IF NOT EXISTS).
// Usage: node scripts/migrate-all.mjs   (or: npm run db:migrate)

import { createPool } from '@vercel/postgres';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { readdirSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

if (!process.env.POSTGRES_URL) {
  console.error('FATAL: POSTGRES_URL not set. Add it to .env');
  process.exit(1);
}

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

// Read migration files from migrations/ folder, sorted by name
const migrationsDir = resolve(__dirname, '..', 'migrations');
let migrationFiles;
try {
  migrationFiles = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
} catch {
  console.error(`FATAL: Cannot read migrations directory: ${migrationsDir}`);
  process.exit(1);
}

if (migrationFiles.length === 0) {
  console.error('No .sql migration files found in migrations/');
  process.exit(1);
}

console.log(`AskElira 2.1 -- Running ${migrationFiles.length} migration files...\n`);

let totalOk = 0;
let totalFail = 0;

for (const file of migrationFiles) {
  const filePath = resolve(migrationsDir, file);
  const content = readFileSync(filePath, 'utf-8');

  // Split file into individual statements (separated by semicolons)
  const statements = content
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  console.log(`── ${file} (${statements.length} statement${statements.length === 1 ? '' : 's'})`);

  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, ' ').trim().slice(0, 80);
    try {
      await pool.query(stmt);
      console.log(`  OK:   ${preview}...`);
      totalOk++;
    } catch (err) {
      console.error(`  FAIL: ${preview}...`);
      console.error(`        ${err.message}`);
      totalFail++;
    }
  }
}

console.log(`\nMigration complete. ${totalOk} OK, ${totalFail} FAIL (across ${migrationFiles.length} files).`);
await pool.end();

if (totalFail > 0) {
  process.exit(1);
}
