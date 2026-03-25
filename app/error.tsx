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
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: '600px' }}>
        <h1 style={{ fontSize: '4rem', margin: '0 0 1rem' }}>⚠️</h1>
        <h2 style={{ fontSize: '2rem', margin: '0 0 1rem', fontWeight: 600 }}>
          Something went wrong
        </h2>
        <p style={{ color: '#666', margin: '0 0 2rem', fontSize: '1.125rem' }}>
          AskElira encountered an unexpected error. Don't worry — your data is safe.
        </p>

        {error.digest && (
          <p style={{
            color: '#999',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            margin: '0 0 2rem',
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
              border: 'none',
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
          fontSize: '0.875rem',
          color: '#999'
        }}>
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
