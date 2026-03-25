/**
 * Structured Server-Side Logger
 * Phase 5: Operations — Steven
 *
 * Provides consistent, structured logging for API routes and server code.
 * Integrates with Vercel's log capture system.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: unknown;
}

class Logger {
  private minLevel: LogLevel;

  constructor(minLevel: LogLevel = 'info') {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      level,
      message,
      ...context,
    };
    return JSON.stringify(baseLog);
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    console.log(this.formatMessage('debug', message, context));
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog('error')) return;
    const errorContext = {
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };
    console.error(this.formatMessage('error', message, errorContext));
  }

  /**
   * Log an HTTP request with duration and status.
   */
  request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext,
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this[level](`${method} ${path}`, {
      ...context,
      statusCode,
      duration,
    });
  }

  /**
   * Log a database query with duration.
   */
  query(
    query: string,
    duration: number,
    context?: LogContext,
  ): void {
    this.debug('Database query', {
      ...context,
      query: query.substring(0, 200), // Truncate long queries
      duration,
    });
  }

  /**
   * Log an external API call.
   */
  external(
    service: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    context?: LogContext,
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this[level](`External API: ${service}`, {
      ...context,
      endpoint,
      statusCode,
      duration,
    });
  }
}

// Singleton instance
const logLevel = (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

export const logger = new Logger(logLevel);

/**
 * Helper to measure execution time of async operations.
 */
export async function withTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.debug(`${operation} completed`, { ...context, duration });
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    logger.error(`${operation} failed`, { ...context, duration }, err instanceof Error ? err : undefined);
    throw err;
  }
}

/**
 * Create a child logger with pre-filled context.
 * Useful for adding requestId to all logs in a request handler.
 */
export function createContextLogger(context: LogContext): Logger {
  const contextLogger = new Logger(logLevel);

  // Override methods to include context
  const originalDebug = contextLogger.debug.bind(contextLogger);
  const originalInfo = contextLogger.info.bind(contextLogger);
  const originalWarn = contextLogger.warn.bind(contextLogger);
  const originalError = contextLogger.error.bind(contextLogger);

  contextLogger.debug = (message: string, additionalContext?: LogContext) => {
    originalDebug(message, { ...context, ...additionalContext });
  };

  contextLogger.info = (message: string, additionalContext?: LogContext) => {
    originalInfo(message, { ...context, ...additionalContext });
  };

  contextLogger.warn = (message: string, additionalContext?: LogContext) => {
    originalWarn(message, { ...context, ...additionalContext });
  };

  contextLogger.error = (message: string, additionalContext?: LogContext, error?: Error) => {
    originalError(message, { ...context, ...additionalContext }, error);
  };

  return contextLogger;
}
