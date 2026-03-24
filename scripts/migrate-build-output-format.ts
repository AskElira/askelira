/**
 * Migration Script: Re-normalize existing buildOutput values in the database.
 *
 * Reads all floors with buildOutput, normalizes them to the new files[] format,
 * and writes the normalized version back. This ensures backward compat and
 * consistent format going forward.
 *
 * Run: npx tsx scripts/migrate-build-output-format.ts
 *
 * Flags:
 *   --dry-run   Print what would be changed without writing to DB
 */

import { normalizeDavidResult, serializeDavidResult } from '../lib/shared-types';

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('[Migration] DRY RUN mode — no database writes\n');
  }

  // Dynamic import to avoid loading DB module when not needed
  const { prisma } = await import('../lib/db');

  const floors = await prisma.floor.findMany({
    where: {
      buildOutput: { not: null },
    },
    select: {
      id: true,
      floorNumber: true,
      name: true,
      buildOutput: true,
    },
  });

  console.log(`[Migration] Found ${floors.length} floor(s) with buildOutput\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const floor of floors) {
    try {
      if (!floor.buildOutput) {
        skipped++;
        continue;
      }

      // Check if already in new format
      try {
        const parsed = JSON.parse(floor.buildOutput);
        if (Array.isArray(parsed.files) && parsed.files.length > 0 && typeof parsed.buildOutput === 'string') {
          // Already migrated
          console.log(`  [skip] Floor ${floor.floorNumber} "${floor.name}" — already in new format`);
          skipped++;
          continue;
        }
      } catch {
        // Not JSON at all — will be handled by normalizer
      }

      // Normalize
      let parsed: unknown;
      try {
        parsed = JSON.parse(floor.buildOutput);
      } catch {
        parsed = floor.buildOutput; // raw string
      }

      const normalized = normalizeDavidResult(parsed);
      const newValue = serializeDavidResult(normalized);

      if (dryRun) {
        console.log(`  [would migrate] Floor ${floor.floorNumber} "${floor.name}" — ${normalized.files.length} file(s)`);
      } else {
        await prisma.floor.update({
          where: { id: floor.id },
          data: { buildOutput: newValue },
        });
        console.log(`  [migrated] Floor ${floor.floorNumber} "${floor.name}" — ${normalized.files.length} file(s)`);
      }
      migrated++;
    } catch (err) {
      console.error(`  [error] Floor ${floor.floorNumber} "${floor.name}":`, err);
      errors++;
    }
  }

  console.log(`\n[Migration] Done: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[Migration] Fatal error:', err);
  process.exit(1);
});
