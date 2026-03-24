'use client';

// ---------------------------------------------------------------------------
// Skeleton shapes
// ---------------------------------------------------------------------------

function SkeletonBar({ width, height = '0.75rem' }: { width: string; height?: string }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: '0.25rem',
        background: 'var(--border)',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

function SkeletonFloorCard() {
  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '0.375rem',
            background: 'var(--border)',
            animation: 'skeleton-pulse 1.5s ease-in-out infinite',
          }}
        />
        <SkeletonBar width="40%" height="0.875rem" />
        <div style={{ flex: 1 }} />
        <SkeletonBar width="4.5rem" height="1.25rem" />
      </div>
      <SkeletonBar width="80%" />
      <SkeletonBar width="60%" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main skeleton
// ---------------------------------------------------------------------------

export default function BuildingLoadingSkeleton() {
  return (
    <div
      style={{
        maxWidth: '48rem',
        margin: '0 auto',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Goal header skeleton */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginBottom: '0.5rem',
        }}
      >
        <SkeletonBar width="70%" height="1.5rem" />
        <SkeletonBar width="100%" />
        <SkeletonBar width="90%" />
      </div>

      {/* Steven status skeleton */}
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '0.875rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--border)',
            animation: 'skeleton-pulse 1.5s ease-in-out infinite',
          }}
        />
        <SkeletonBar width="6rem" />
        <div style={{ flex: 1 }} />
        <SkeletonBar width="5rem" />
      </div>

      {/* Floor cards skeleton */}
      <SkeletonFloorCard />
      <SkeletonFloorCard />
      <SkeletonFloorCard />

      {/* Ticker skeleton */}
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <SkeletonBar width="30%" height="0.625rem" />
        <SkeletonBar width="80%" />
        <SkeletonBar width="65%" />
        <SkeletonBar width="75%" />
      </div>
    </div>
  );
}
