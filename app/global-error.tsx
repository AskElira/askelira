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
      <body style={{ margin: 0, padding: 0 }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#fafafa',
        }}>
          <div style={{ maxWidth: '600px' }}>
            <h1 style={{ fontSize: '4rem', margin: '0 0 1rem' }}>🔥</h1>
            <h2 style={{ fontSize: '2rem', margin: '0 0 1rem', fontWeight: 600 }}>
              Critical Error
            </h2>
            <p style={{ color: '#666', margin: '0 0 2rem', fontSize: '1.125rem' }}>
              AskElira encountered a critical error. We've been notified and will investigate.
            </p>

            {error.digest && (
              <p style={{
                color: '#999',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                margin: '0 0 2rem',
                wordBreak: 'break-all',
              }}>
                Error ID: {error.digest}
              </p>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: 'white',
                  backgroundColor: '#000',
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
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: '#000',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
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
              fontSize: '0.875rem',
              color: '#999'
            }}>
              If you need immediate assistance, please contact support with the error ID above.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
