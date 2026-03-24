'use client';

import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StevenStatusProps {
  heartbeatActive: boolean;
  lastHeartbeatAt: Date | null;
  liveFloors: number;
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLastCheck(date: Date | null): string {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StevenStatus({
  heartbeatActive,
  lastHeartbeatAt,
  liveFloors,
  suggestions,
}: StevenStatusProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '0.875rem 1.25rem',
      }}
    >
      {/* Main status row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        {/* Steven pulse dot */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: heartbeatActive ? '#facc15' : '#4b5563',
            boxShadow: heartbeatActive
              ? '0 0 8px rgba(250, 204, 21, 0.5)'
              : 'none',
            animation: heartbeatActive ? 'steven-pulse 2s ease-in-out infinite' : 'none',
            flexShrink: 0,
          }}
        />

        {/* Steven label */}
        <span
          style={{
            fontWeight: 600,
            color: heartbeatActive ? '#facc15' : '#6b7280',
            fontSize: '0.8125rem',
          }}
        >
          Steven
        </span>

        {/* Status text */}
        <span
          style={{
            fontSize: '0.8125rem',
            color: '#9ca3af',
          }}
        >
          {heartbeatActive ? 'Watching' : 'Idle'}
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Live floors count */}
        {liveFloors > 0 && (
          <span
            style={{
              fontSize: '0.6875rem',
              color: '#6b7280',
              whiteSpace: 'nowrap',
            }}
          >
            {liveFloors} live floor{liveFloors !== 1 ? 's' : ''}
          </span>
        )}

        {/* Last check */}
        <span
          style={{
            fontSize: '0.6875rem',
            color: '#4b5563',
            whiteSpace: 'nowrap',
          }}
        >
          Last check: {formatLastCheck(lastHeartbeatAt)}
        </span>
      </div>

      {/* Suggestions panel (collapsible) */}
      {suggestions.length > 0 && (
        <div style={{ marginTop: '0.625rem' }}>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#facc15',
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
                transform: showSuggestions ? 'rotate(90deg)' : 'rotate(0deg)',
                fontSize: '0.625rem',
              }}
            >
              &#9654;
            </span>
            {suggestions.length} automation suggestion{suggestions.length !== 1 ? 's' : ''}
          </button>

          {showSuggestions && (
            <div
              style={{
                marginTop: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
              }}
            >
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '0.75rem',
                    color: '#d1d5db',
                    paddingLeft: '0.875rem',
                    borderLeft: '2px solid rgba(250, 204, 21, 0.3)',
                    lineHeight: 1.5,
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
