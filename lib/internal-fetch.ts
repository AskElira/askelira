/**
 * Internal Fetch Utilities — AskElira 2.1
 *
 * Shared helpers for:
 * 1. safeWaitUntil  — works both on Vercel and outside Vercel
 * 2. getInternalBaseUrl — resolves the correct self-referencing URL
 * 3. fetchWithRetry — retries failed continuation fetches
 */

// ============================================================
// safeWaitUntil — portable waitUntil wrapper
// ============================================================
//
// On Vercel, `waitUntil` from @vercel/functions extends the function
// lifetime to let the background promise complete. Outside Vercel
// (local dev, proxied requests), it silently does nothing — the
// promise is created but never awaited or attached.
//
// This wrapper detects the environment and falls back to
// fire-and-forget execution with error logging when not on Vercel.

export function safeWaitUntil(promise: Promise<unknown>): void {
  if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) {
    // Running on Vercel — use the real waitUntil
    try {
      // Dynamic import to avoid bundling issues outside Vercel
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { waitUntil } = require('@vercel/functions') as {
        waitUntil: (p: Promise<unknown>) => void;
      };
      waitUntil(promise);
      return;
    } catch (err) {
      console.warn('[safeWaitUntil] Failed to load @vercel/functions, falling back to fire-and-forget:', err);
    }
  }

  // Outside Vercel (or @vercel/functions failed to load):
  // Execute the promise and log any errors.
  // The promise runs detached — we cannot extend the request lifecycle
  // outside Vercel, but at least the work will start.
  promise.catch((err) => {
    console.error('[safeWaitUntil] Background promise rejected:', err);
  });
}

// ============================================================
// getInternalBaseUrl — resolve self-referencing URL
// ============================================================
//
// Priority:
// 1. VERCEL_URL (auto-set by Vercel, but only if non-empty)
// 2. INTERNAL_URL (new explicit override env var)
// 3. NEXTAUTH_URL (may point to custom domain — last resort)
// 4. http://localhost:3000 (local dev fallback)
//
// VERCEL_URL="" in .env.prod is treated as empty (not set).
// The old code used `process.env.VERCEL_URL ? ...` which evaluates
// empty string as falsy in JS, BUT the issue is that VERCEL_URL is
// auto-set by Vercel at deploy time and overrides .env.prod — so
// checking truthiness alone is correct for the env var itself. The
// real fix is the priority chain with INTERNAL_URL as explicit override.

export function getInternalBaseUrl(): string {
  const vercelUrl = (process.env.VERCEL_URL || '').trim();
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  const internalUrl = (process.env.INTERNAL_URL || '').trim();
  if (internalUrl) {
    return internalUrl;
  }

  const nextAuthUrl = (process.env.NEXTAUTH_URL || '').trim();
  if (nextAuthUrl) {
    return nextAuthUrl;
  }

  return 'http://localhost:3000';
}

// ============================================================
// fetchWithRetry — retry wrapper for continuation fetches
// ============================================================
//
// Continuation fetches are critical — they chain the next step
// invocation. A single failure (cold start, DNS hiccup, timeout)
// silently kills the entire build chain. This wrapper retries once
// after a 1s delay.

export interface ContinuationFetchOptions {
  url: string;
  timeoutMs?: number;
  tag?: string;
}

export async function fetchWithRetry(
  options: ContinuationFetchOptions,
  maxAttempts: number = 2,
  delayMs: number = 1000,
): Promise<{ status: number; aborted: boolean } | null> {
  const { url, timeoutMs = 5000, tag = 'fetchWithRetry' } = options;
  const secret = process.env.CRON_SECRET || '';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': secret,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`[${tag}] Continuation response (attempt ${attempt}): ${res.status}`);
      return { status: res.status, aborted: false };
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';

      if (isAbort) {
        // AbortError means the request was sent but we timed out waiting
        // for the response. On Vercel this is expected — the request
        // already spawned a new function invocation.
        console.log(`[${tag}] Continuation request sent (attempt ${attempt}, aborted after timeout -- expected)`);
        return { status: 0, aborted: true };
      }

      console.error(`[${tag}] Continuation fetch failed (attempt ${attempt}/${maxAttempts}):`, err);

      if (attempt < maxAttempts) {
        console.log(`[${tag}] Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  console.error(`[${tag}] All ${maxAttempts} continuation attempts failed for: ${url}`);
  return null;
}
