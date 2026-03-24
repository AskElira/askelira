/**
 * Database Query Logger -- Steven Delta SD-005
 *
 * Logs SQL queries in development mode for debugging.
 * No-op in production to avoid performance overhead.
 */

const isDev = process.env.NODE_ENV !== 'production';
const LOG_SLOW_THRESHOLD_MS = 500;

/**
 * Wrap a database operation with timing and logging.
 * Only logs in development mode. Always logs slow queries (>500ms).
 */
export async function withQueryLog<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - start;

    if (isDev) {
      console.log(`[DB] ${label} (${durationMs}ms)`);
    } else if (durationMs > LOG_SLOW_THRESHOLD_MS) {
      console.warn(`[DB SLOW] ${label} (${durationMs}ms)`);
    }

    return result;
  } catch (err) {
    const durationMs = Date.now() - start;
    console.error(`[DB ERROR] ${label} (${durationMs}ms):`, err instanceof Error ? err.message : err);
    throw err;
  }
}
