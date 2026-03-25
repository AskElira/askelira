'use client';

import { useEffect } from 'react';

/**
 * Root-level error boundary.
 * Catches errors in the root layout or when error.tsx itself fails.
 * Must be a client component and must include <html> and <body> tags.
 *
 * Phase 5: Operations — Steven
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical error
    console.error('[Global Error Boundary]', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0f1117', color: '#e5e7eb' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}>
          <div style={{ maxWidth: '600px' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(248, 113, 113, 0.15)',
              border: '2px solid #f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '1.75rem',
              color: '#f87171',
            }}>
              !!
            </div>
            <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.75rem', fontWeight: 700, color: '#fff' }}>
              Critical Error
            </h2>
            <p style={{ color: '#9ca3af', margin: '0 0 2rem', fontSize: '0.9375rem', lineHeight: 1.6 }}>
              AskElira encountered a critical error. We have been notified and will investigate.
            </p>

            {error.digest && (
              <p style={{
                color: '#6b7280',
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
                margin: '0 0 2rem',
                wordBreak: 'break-all',
              }}>
                Error ID: {error.digest}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#fff',
                  background: '#6366f1',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  color: '#9ca3af',
                  background: 'transparent',
                  border: '1px solid #2a2d3a',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Reload page
              </a>
            </div>

            <p style={{
              marginTop: '3rem',
              fontSize: '0.8125rem',
              color: '#6b7280',
            }}>
              If you need immediate assistance, please contact support with the error ID above.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
