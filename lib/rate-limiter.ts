/**
 * Rate Limiter -- Phase 10 of AskElira 2.1
 *
 * In-memory rate limiter with sliding window. No Redis required.
 * Auto-cleans expired entries every 5 minutes.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Auto-cleanup every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      // Remove timestamps older than 1 hour (max window we support)
      entry.timestamps = entry.timestamps.filter((t) => now - t < 3600000);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  // Unref so it doesn't keep Node.js alive
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Check rate limit for an identifier.
 *
 * @param identifier - unique key (e.g., IP address, goalId, floorId)
 * @param limit - max requests allowed in the window
 * @param windowMs - time window in milliseconds
 * @returns { allowed, remaining }
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  ensureCleanup();

  const now = Date.now();
  let entry = store.get(identifier);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
    };
  }

  // Record this request
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
  };
}

/**
 * Helper to get client IP from NextRequest headers.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  );
}
