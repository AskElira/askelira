import Link from 'next/link';

/**
 * Custom 404 page for app directory.
 * Shown when a route is not found.
 *
 * Phase 5: Operations — Steven
 */
export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: '600px' }}>
        <h1 style={{
          fontSize: '6rem',
          margin: '0',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          404
        </h1>
        <h2 style={{
          fontSize: '1.5rem',
          margin: '1rem 0',
          fontWeight: 700,
          color: '#fff',
        }}>
          Page not found
        </h2>
        <p style={{
          color: '#9ca3af',
          margin: '0 0 2rem',
          fontSize: '0.9375rem',
          lineHeight: 1.6,
        }}>
          The page you are looking for does not exist or has been moved.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link
            href="/"
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#fff',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Go home
          </Link>
          <Link
            href="/onboard"
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
            Get started
          </Link>
        </div>

        <p style={{
          marginTop: '3rem',
          fontSize: '0.8125rem',
          color: '#6b7280',
        }}>
          Lost? Start a new building or check your building history.
        </p>
      </div>
    </div>
  );
}
