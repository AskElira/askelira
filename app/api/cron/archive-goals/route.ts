/**
 * Goal Archiving Cron -- Steven Delta SD-004
 *
 * POST /api/cron/archive-goals
 * Archives goals older than 90 days that are in terminal states.
 * Protected by CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';

const ARCHIVE_AFTER_DAYS = 90;

export async function POST(req: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const provided = req.headers.get('x-cron-secret');
    if (provided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const { sql } = await import('@vercel/postgres');

    const { rowCount } = await sql`
      UPDATE goals
      SET archived_at = NOW()
      WHERE archived_at IS NULL
        AND deleted_at IS NULL
        AND status IN ('goal_met', 'blocked')
        AND updated_at < NOW() - INTERVAL '${ARCHIVE_AFTER_DAYS} days'
    `;

    const archived = rowCount ?? 0;
    console.log(`[Cron] Archived ${archived} goals older than ${ARCHIVE_AFTER_DAYS} days`);

    return NextResponse.json({ archived, cutoffDays: ARCHIVE_AFTER_DAYS });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Archive failed';
    console.error('[Cron /archive-goals]', message);
    return NextResponse.json({ error: 'Archive failed' }, { status: 500 });
  }
}
