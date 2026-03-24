import { cacheGet } from './swarm-cache';
import type { SwarmResult } from './openclaw-orchestrator';

export async function getDebateResult(id: string): Promise<SwarmResult | null> {
  // Try cache first
  const cached = cacheGet(id);
  if (cached) return cached;

  // Try DB
  try {
    const { sql } = await import('@vercel/postgres');
    const { rows } = await sql`SELECT result_json FROM debates WHERE id = ${id}`;
    if (rows.length > 0 && rows[0].result_json) {
      return rows[0].result_json as SwarmResult;
    }
  } catch {
    // No DB — return null
  }

  return null;
}
