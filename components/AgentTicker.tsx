'use client';

import type { AgentActivity } from '@/hooks/useBuilding';

// ---------------------------------------------------------------------------
// Agent colors
// ---------------------------------------------------------------------------

const AGENT_COLORS: Record<string, string> = {
  Alba: '#4ade80',
  David: '#2dd4bf',
  Vex: '#f87171',
  Elira: '#a78bfa',
  Steven: '#facc15',
  System: '#6b7280',
};

function getAgentColor(agent: string): string {
  return AGENT_COLORS[agent] ?? AGENT_COLORS.System;
}

// ---------------------------------------------------------------------------
// Action translations (human-readable)
// ---------------------------------------------------------------------------

const ACTION_LABELS: Record<string, string> = {
  researching: 'searching the web...',
  gate1_reviewing: 'auditing the plan...',
  building: 'building the floor...',
  gate2_reviewing: 'auditing the build...',
  floor_review: 'reviewing strategic fit...',
  heartbeat_check: 'checking floor health...',
  escalation: 'escalating to Elira...',
  escalation_verdict: 'deciding recovery path...',
  automation_suggestion: 'suggesting next automation...',
  floor_live: 'floor is now live',
  floor_blocked: 'floor is blocked',
  floor_broken: 'floor needs rebuild',
  goal_met: 'all floors complete!',
};

function translateAction(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

// ---------------------------------------------------------------------------
// Relative time
// ---------------------------------------------------------------------------

function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AgentTickerProps {
  activities: AgentActivity[];
  maxVisible?: number;
}

export default function AgentTicker({ activities, maxVisible = 8 }: AgentTickerProps) {
  const visible = activities.slice(0, maxVisible);

  if (visible.length === 0) {
    return (
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
        }}
      >
        <p style={{ fontSize: '0.8125rem', color: '#6b7280', textAlign: 'center' }}>
          No agent activity yet
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Agent Activity
      </div>

      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {visible.map((activity, i) => {
          const color = getAgentColor(activity.agent);

          return (
            <div
              key={`${activity.agent}-${activity.action}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 1rem',
                borderBottom: i < visible.length - 1 ? '1px solid rgba(42, 45, 58, 0.5)' : 'none',
                animation: 'ticker-slide-in 0.3s ease-out',
              }}
            >
              {/* Agent badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '4rem',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '0.1875rem 0.5rem',
                  borderRadius: '999px',
                  background: `${color}22`,
                  color: color,
                  whiteSpace: 'nowrap',
                }}
              >
                {activity.agent}
              </span>

              {/* Action text */}
              <span
                style={{
                  flex: 1,
                  fontSize: '0.8125rem',
                  color: '#d1d5db',
                }}
              >
                {translateAction(activity.action)}
              </span>

              {/* Floor number */}
              {activity.floorId && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                  }}
                >
                  F{activity.iteration ?? '?'}
                </span>
              )}

              {/* Relative timestamp */}
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: '#4b5563',
                  whiteSpace: 'nowrap',
                }}
              >
                {relativeTime(activity.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
