'use client';

export default function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          height: '2rem',
          background: 'var(--border)',
          borderRadius: '0.375rem',
          width: '75%',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />
      <div
        style={{
          height: '1rem',
          background: 'var(--border)',
          borderRadius: '0.375rem',
          width: '50%',
          animation: 'pulse 2s ease-in-out infinite',
          animationDelay: '0.2s',
        }}
      />
      <div
        style={{
          height: '1rem',
          background: 'var(--border)',
          borderRadius: '0.375rem',
          width: '60%',
          animation: 'pulse 2s ease-in-out infinite',
          animationDelay: '0.4s',
        }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
