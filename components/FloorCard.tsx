'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { FloorState } from '@/hooks/useBuilding';

// ---------------------------------------------------------------------------
// Status visual config
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<
  FloorState['status'],
  { border: string; bg: string; badgeBg: string; badgeColor: string; label: string }
> = {
  pending: {
    border: 'var(--border)',
    bg: 'var(--panel)',
    badgeBg: 'rgba(107, 114, 128, 0.2)',
    badgeColor: '#6b7280',
    label: 'Pending',
  },
  researching: {
    border: 'var(--green)',
    bg: 'rgba(74, 222, 128, 0.04)',
    badgeBg: 'rgba(74, 222, 128, 0.15)',
    badgeColor: '#4ade80',
    label: 'Alba Researching',
  },
  building: {
    border: '#2dd4bf',
    bg: 'rgba(45, 212, 191, 0.04)',
    badgeBg: 'rgba(45, 212, 191, 0.15)',
    badgeColor: '#2dd4bf',
    label: 'David Building',
  },
  auditing: {
    border: 'var(--red)',
    bg: 'rgba(248, 113, 113, 0.04)',
    badgeBg: 'rgba(248, 113, 113, 0.15)',
    badgeColor: '#f87171',
    label: 'Vex Auditing',
  },
  live: {
    border: 'var(--accent)',
    bg: 'rgba(99, 102, 241, 0.06)',
    badgeBg: 'rgba(250, 204, 21, 0.15)',
    badgeColor: '#facc15',
    label: 'Live',
  },
  broken: {
    border: 'var(--red)',
    bg: 'rgba(248, 113, 113, 0.08)',
    badgeBg: 'rgba(248, 113, 113, 0.2)',
    badgeColor: '#f87171',
    label: 'Rebuilding...',
  },
  blocked: {
    border: '#991b1b',
    bg: 'rgba(153, 27, 27, 0.1)',
    badgeBg: 'rgba(153, 27, 27, 0.3)',
    badgeColor: '#fca5a5',
    label: 'Blocked',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FloorCardProps {
  floor: FloorState;
  isActive: boolean;
}

export default function FloorCard({ floor, isActive }: FloorCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const prevStatus = useRef<FloorState['status']>(floor.status);
  const [showCondition, setShowCondition] = useState(false);
  const style = STATUS_STYLES[floor.status];

  // GSAP animation on status change
  useEffect(() => {
    if (prevStatus.current !== floor.status && cardRef.current) {
      const tl = gsap.timeline();
      tl.to(cardRef.current, {
        scale: 1.02,
        duration: 0.15,
        ease: 'power2.out',
      });
      tl.to(cardRef.current, {
        scale: 1,
        duration: 0.2,
        ease: 'elastic.out(1, 0.5)',
      });

      // Shake on broken/blocked
      if (floor.status === 'broken' || floor.status === 'blocked') {
        gsap.to(cardRef.current, {
          x: -3,
          duration: 0.05,
          repeat: 5,
          yoyo: true,
          ease: 'power1.inOut',
          onComplete: () => {
            if (cardRef.current) gsap.set(cardRef.current, { x: 0 });
          },
        });
      }
    }
    prevStatus.current = floor.status;
  }, [floor.status]);

  const isAnimated =
    floor.status === 'researching' ||
    floor.status === 'building' ||
    floor.status === 'auditing';

  return (
    <div
      ref={cardRef}
      className="floor-card"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '0.75rem',
        padding: '1.25rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.3s ease, background 0.3s ease',
        opacity: floor.status === 'pending' && !isActive ? 0.6 : 1,
      }}
    >
      {/* Subtle animated border glow for active states */}
      {isAnimated && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '0.75rem',
            border: `1px solid ${style.border}`,
            opacity: 0.5,
            animation: 'pulse-border 2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Live gold pulse dot */}
      {floor.status === 'live' && (
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#facc15',
            boxShadow: '0 0 6px rgba(250, 204, 21, 0.6)',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.5rem',
        }}
      >
        {/* Floor number */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '0.375rem',
            background: 'rgba(255, 255, 255, 0.06)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#9ca3af',
            flexShrink: 0,
          }}
        >
          {floor.floorNumber}
        </span>

        {/* Floor name */}
        <span
          style={{
            fontWeight: 600,
            color: '#fff',
            fontSize: '0.9375rem',
            flex: 1,
          }}
        >
          {floor.name}
        </span>

        {/* Status badge */}
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            padding: '0.25rem 0.625rem',
            borderRadius: '999px',
            background: style.badgeBg,
            color: style.badgeColor,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.025em',
          }}
        >
          {style.label}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '0.8125rem',
          color: '#9ca3af',
          lineHeight: 1.5,
          marginBottom: '0.5rem',
        }}
      >
        {floor.description}
      </p>

      {/* Iteration count (if > 1) */}
      {floor.iterationCount > 1 && (
        <span
          style={{
            display: 'inline-block',
            fontSize: '0.6875rem',
            color: '#6b7280',
            marginBottom: '0.375rem',
          }}
        >
          Iteration {floor.iterationCount}
        </span>
      )}

      {/* Success condition (collapsible) */}
      <div style={{ marginTop: '0.25rem' }}>
        <button
          onClick={() => setShowCondition(!showCondition)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            fontSize: '0.75rem',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              transition: 'transform 0.2s ease',
              transform: showCondition ? 'rotate(90deg)' : 'rotate(0deg)',
              fontSize: '0.625rem',
            }}
          >
            &#9654;
          </span>
          Success condition
        </button>
        {showCondition && (
          <p
            style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginTop: '0.375rem',
              paddingLeft: '0.875rem',
              lineHeight: 1.5,
              borderLeft: '2px solid var(--border)',
            }}
          >
            {floor.successCondition}
          </p>
        )}
      </div>

      {/* Handoff notes (if live) */}
      {floor.status === 'live' && floor.handoffNotes && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.625rem 0.75rem',
            background: 'rgba(99, 102, 241, 0.08)',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            color: '#a5b4fc',
            lineHeight: 1.5,
          }}
        >
          {floor.handoffNotes}
        </div>
      )}

      {/* Keyframe animations defined in globals.css */}
    </div>
  );
}
