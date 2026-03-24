'use client';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BuildingErrorProps {
  message: string;
  onRetry: () => void;
}

export default function BuildingError({ message, onRetry }: BuildingErrorProps) {
  return (
    <div
      style={{
        maxWidth: '48rem',
        margin: '0 auto',
        padding: '4rem 1rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          background: 'rgba(248, 113, 113, 0.06)',
          border: '1px solid rgba(248, 113, 113, 0.2)',
          borderRadius: '0.75rem',
          padding: '2rem',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {/* Error icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(248, 113, 113, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            color: 'var(--red)',
          }}
        >
          !
        </div>

        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--red)',
            lineHeight: 1.5,
            maxWidth: '24rem',
          }}
        >
          {message}
        </p>

        <button
          onClick={onRetry}
          style={{
            background: 'transparent',
            border: '1px solid var(--red)',
            color: 'var(--red)',
            borderRadius: '0.375rem',
            padding: '0.5rem 1.25rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
