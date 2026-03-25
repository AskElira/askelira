/**
 * Centralized API Error Handling
 * Phase 5: Operations — Steven
 *
 * Provides consistent error formatting, request ID tracking, and structured logging.
 */

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export type ApiErrorType =
  | 'validation_error'
  | 'authentication_error'
  | 'authorization_error'
  | 'not_found'
  | 'rate_limit_exceeded'
  | 'database_error'
  | 'external_service_error'
  | 'internal_error';

export interface ApiError {
  type: ApiErrorType;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

/**
 * Generate a unique request ID for error tracking.
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Create a standardized error response.
 */
export function createErrorResponse(
  type: ApiErrorType,
  message: string,
  statusCode: number,
  details?: Record<string, unknown>,
  requestId?: string,
): NextResponse<ApiError> {
  const errorResponse: ApiError = {
    type,
    message,
    ...(details && { details }),
    ...(requestId && { requestId }),
  };

  // Log error with context
  console.error('[API Error]', {
    type,
    message,
    statusCode,
    requestId,
    details,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Handle unknown errors and convert to API error response.
 */
export function handleUnknownError(
  err: unknown,
  endpoint: string,
  requestId?: string,
): NextResponse<ApiError> {
  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  const stack = err instanceof Error ? err.stack : undefined;

  console.error(`[API Error] ${endpoint}`, {
    message,
    stack,
    requestId,
    timestamp: new Date().toISOString(),
  });

  return createErrorResponse(
    'internal_error',
    process.env.NODE_ENV === 'production'
      ? 'Internal server error. Please try again later.'
      : message,
    500,
    process.env.NODE_ENV === 'development' ? { originalError: message, stack } : undefined,
    requestId,
  );
}

/**
 * Common error response helpers.
 */
export const ApiErrors = {
  validation: (message: string, details?: Record<string, unknown>, requestId?: string) =>
    createErrorResponse('validation_error', message, 400, details, requestId),

  unauthorized: (message = 'Authentication required', requestId?: string) =>
    createErrorResponse('authentication_error', message, 401, undefined, requestId),

  forbidden: (message = 'You do not have permission to access this resource', requestId?: string) =>
    createErrorResponse('authorization_error', message, 403, undefined, requestId),

  notFound: (resource = 'Resource', requestId?: string) =>
    createErrorResponse('not_found', `${resource} not found`, 404, undefined, requestId),

  rateLimit: (retryAfter = 60, requestId?: string) =>
    createErrorResponse(
      'rate_limit_exceeded',
      'Too many requests. Please try again later.',
      429,
      { retryAfter },
      requestId,
    ),

  database: (message = 'Database error', requestId?: string) =>
    createErrorResponse(
      'database_error',
      process.env.NODE_ENV === 'production'
        ? 'A database error occurred. Please try again.'
        : message,
      503,
      undefined,
      requestId,
    ),

  external: (service: string, requestId?: string) =>
    createErrorResponse(
      'external_service_error',
      `External service (${service}) is currently unavailable`,
      503,
      undefined,
      requestId,
    ),

  internal: (message?: string, requestId?: string) =>
    createErrorResponse(
      'internal_error',
      message || 'Internal server error',
      500,
      undefined,
      requestId,
    ),
};

/**
 * Graceful fallback helper for non-critical failures.
 * Returns a default value instead of throwing.
 */
export function gracefulFallback<T>(
  operation: string,
  fallbackValue: T,
  error?: unknown,
): T {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.warn(`[Graceful Fallback] ${operation} failed: ${message}. Using fallback.`);
  return fallbackValue;
}

/**
 * Wrapper for try-catch with automatic error handling.
 * Usage:
 *   return await withErrorHandling(requestId, 'POST /api/goals', async () => {
 *     // your code here
 *     return NextResponse.json({ success: true });
 *   });
 */
export async function withErrorHandling<T>(
  requestId: string,
  endpoint: string,
  handler: () => Promise<T>,
): Promise<T | NextResponse<ApiError>> {
  try {
    return await handler();
  } catch (err) {
    return handleUnknownError(err, endpoint, requestId);
  }
}
