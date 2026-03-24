/**
 * Next.js 14 Instrumentation Hook
 *
 * Called once when the server starts. Used to validate environment
 * and recover heartbeats for goals that were actively being monitored
 * before a restart.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // SD-025: NODE_ENV enforcement
    if (!process.env.NODE_ENV) {
      console.warn('[Instrumentation] NODE_ENV is not set — defaulting to development');
    }

    // Phase 10: Validate environment before anything else
    try {
      const { validateEnvironment } = await import('./lib/env-validator');
      validateEnvironment();
    } catch (err) {
      console.error('[Instrumentation] Environment validation failed:', err);
      // In production this throws and prevents startup.
      // In dev it only warns, so we continue.
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
    }

    // SD-024: Graceful shutdown handler
    const shutdown = (signal: string) => {
      console.log(`[Instrumentation] Received ${signal} — shutting down gracefully`);
      // Allow 10 seconds for in-flight requests to complete
      setTimeout(() => {
        console.log('[Instrumentation] Graceful shutdown timeout — exiting');
        process.exit(0);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    console.log(`[Instrumentation] AskElira 2.1 started (NODE_ENV=${process.env.NODE_ENV ?? 'undefined'})`);
  }
}
