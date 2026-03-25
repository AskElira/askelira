'use client';

import { useEffect } from 'react';

/**
 * Client-side error boundary for app directory.
 * Catches errors in React components during rendering.
 *
 * Phase 5: Operations — Steven
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (captured by Vercel)
    console.error('[Error Boundary]', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      background: 'var(--surface)',
      color: '#e5e7eb',
    }}>
      <div style={{ maxWidth: '600px' }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(248, 113, 113, 0.12)',
          border: '2px solid var(--red)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          fontSize: '1.75rem',
        }}>
          !
        </div>
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.75rem', fontWeight: 700, color: '#fff' }}>
          Something went wrong
        </h2>
        <p style={{ color: '#9ca3af', margin: '0 0 2rem', fontSize: '0.9375rem', lineHeight: 1.6 }}>
          AskElira encountered an unexpected error. Your data is safe.
        </p>

        {error.digest && (
          <p style={{
            color: '#6b7280',
            fontSize: '0.8125rem',
            fontFamily: 'monospace',
            margin: '0 0 2rem',
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
              background: 'var(--accent)',
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
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Go home
          </a>
        </div>

        <p style={{
          marginTop: '3rem',
          fontSize: '0.8125rem',
          color: '#6b7280',
        }}>
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
