/**
 * Heartbeat Recovery — Phase 5 of AskElira 2.1
 *
 * On server startup, finds all goals with status 'building' that have live floors,
 * and restarts their heartbeat monitors.
 *
 * Never throws — logs errors and continues.
 */

import { startHeartbeat } from './heartbeat';
import { sql } from '@vercel/postgres';

export async function recoverHeartbeats(): Promise<void> {
  try {
    console.log('[HeartbeatRecovery] Scanning for active goals with live floors...');

    const { rows } = await sql`
      SELECT DISTINCT g.id AS goal_id
      FROM goals g
      INNER JOIN floors f ON f.goal_id = g.id
      WHERE g.status = 'building'
        AND f.status = 'live'
    `;

    if (rows.length === 0) {
      console.log('[HeartbeatRecovery] No active goals with live floors found.');
      return;
    }

    console.log(`[HeartbeatRecovery] Found ${rows.length} goal(s) to recover.`);

    for (const row of rows) {
      const goalId = row.goal_id as string;
      try {
        startHeartbeat(goalId, 5 * 60 * 1000); // 5 minute default
        console.log(`[HeartbeatRecovery] Restarted heartbeat for goal ${goalId}`);
      } catch (err) {
        console.error(`[HeartbeatRecovery] Failed to restart heartbeat for goal ${goalId}:`, err);
        // Continue to next goal — never throw
      }
    }

    console.log('[HeartbeatRecovery] Recovery complete.');
  } catch (err) {
    console.error('[HeartbeatRecovery] Recovery scan failed:', err);
    // Never throw — this runs at startup and must not crash the server
  }
}
