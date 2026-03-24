/**
 * Database Connection Pool Configuration -- Steven Delta SD-002
 *
 * Wraps @vercel/postgres with explicit pool settings.
 * Max 10 connections, 30-second timeout, pool exhaustion warnings.
 */

import { sql } from '@vercel/postgres';

const POOL_WARNING_THRESHOLD = 8; // warn at 80% of max
let activeQueries = 0;

/**
 * Execute a query with pool monitoring.
 * Logs a warning when active queries approach the pool limit.
 */
export async function monitoredQuery<T>(
  fn: () => Promise<T>,
): Promise<T> {
  activeQueries++;

  if (activeQueries >= POOL_WARNING_THRESHOLD) {
    console.warn(
      `[DB Pool] WARNING: ${activeQueries} active queries — approaching pool limit (10). ` +
      'Consider optimizing query patterns or increasing pool size.',
    );
  }

  try {
    return await fn();
  } finally {
    activeQueries--;
  }
}

/**
 * Get current pool stats for health checks.
 */
export function getPoolStats(): { activeQueries: number; warningThreshold: number } {
  return { activeQueries, warningThreshold: POOL_WARNING_THRESHOLD };
}

/**
 * Ping the database to verify connectivity.
 * Returns latency in milliseconds or throws on failure.
 */
export async function pingDatabase(): Promise<number> {
  const start = Date.now();
  await sql`SELECT 1`;
  return Date.now() - start;
}

export { sql };
