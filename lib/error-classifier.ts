/**
 * Error Classifier — Feature 34 (Steven Gamma)
 *
 * Classifies errors into categories for better observability and routing.
 */

export type ErrorCategory = 'network' | 'timeout' | 'parse' | 'auth' | 'rate_limit' | 'unknown';

/**
 * Classify an error into a known category.
 */
export function classifyError(err: unknown): ErrorCategory {
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();

  // Timeout errors
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('aborterror') ||
    message.includes('aborted')
  ) {
    return 'timeout';
  }

  // Network errors
  if (
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('enotfound') ||
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('socket hang up') ||
    message.includes('dns') ||
    message.includes('websocket not connected')
  ) {
    return 'network';
  }

  // Auth errors
  if (
    message.includes('unauthorized') ||
    message.includes('authentication') ||
    message.includes('invalid api key') ||
    message.includes('forbidden') ||
    message.includes('401') ||
    message.includes('403')
  ) {
    return 'auth';
  }

  // Rate limit errors
  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('429') ||
    message.includes('overloaded')
  ) {
    return 'rate_limit';
  }

  // Parse errors
  if (
    message.includes('json') ||
    message.includes('parse') ||
    message.includes('unexpected token') ||
    message.includes('syntax error')
  ) {
    return 'parse';
  }

  return 'unknown';
}

/**
 * Get a human-readable label for an error category.
 */
export function errorCategoryLabel(category: ErrorCategory): string {
  const labels: Record<ErrorCategory, string> = {
    network: 'Network Error',
    timeout: 'Timeout',
    parse: 'Parse Error',
    auth: 'Authentication Error',
    rate_limit: 'Rate Limit',
    unknown: 'Unknown Error',
  };
  return labels[category];
}
