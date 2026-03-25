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
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: '600px' }}>
        <h1 style={{
          fontSize: '6rem',
          margin: '0',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          404
        </h1>
        <h2 style={{
          fontSize: '2rem',
          margin: '1rem 0',
          fontWeight: 600
        }}>
          Page not found
        </h2>
        <p style={{
          color: '#666',
          margin: '0 0 2rem',
          fontSize: '1.125rem'
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            href="/"
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 500,
              color: 'white',
              backgroundColor: '#000',
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
            Get started
          </Link>
        </div>

        <p style={{
          marginTop: '3rem',
          fontSize: '0.875rem',
          color: '#999'
        }}>
          Lost? Start a new swarm debate or check your building history.
        </p>
      </div>
    </div>
  );
}
