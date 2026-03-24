import SwarmAnimation from '@/components/SwarmAnimation';

export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
      }}
    >
      <SwarmAnimation size={120} particleCount={24} active />
      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
        Loading...
      </p>
    </div>
  );
}
