'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GoalSummary {
  id: string;
  customerId: string;
  goalText: string;
  status: string;
  buildingSummary: string | null;
  floorCount: number;
  liveFloors: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  planning: { bg: 'rgba(107, 114, 128, 0.2)', color: '#9ca3af', label: 'Planning' },
  building: { bg: 'rgba(45, 212, 191, 0.15)', color: '#2dd4bf', label: 'Building' },
  goal_met: { bg: 'rgba(250, 204, 21, 0.15)', color: '#facc15', label: 'Complete' },
  blocked: { bg: 'rgba(248, 113, 113, 0.2)', color: '#f87171', label: 'Blocked' },
};

function getStatus(status: string) {
  return STATUS_STYLES[status] ?? STATUS_STYLES.planning;
}

// ---------------------------------------------------------------------------
// Date formatter
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BuildingsListPage() {
  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetch('/api/goals')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch buildings');
        return res.json();
      })
      .then((data) => {
        setGoals(data.goals ?? []);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load buildings';
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return (
    <div
      style={{
        maxWidth: '48rem',
        margin: '0 auto',
        padding: '2rem 1rem 4rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}
      >
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#fff' }}>
          My Buildings
        </h1>
        <Link
          href="/onboard"
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--accent)',
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            border: '1px solid var(--accent)',
            borderRadius: '0.375rem',
            transition: 'background 0.15s ease',
          }}
        >
          New Building
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                height: '6rem',
                animation: 'skeleton-pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            background: 'rgba(248, 113, 113, 0.06)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: 'var(--red)', marginBottom: '0.75rem' }}>{error}</p>
          <button
            onClick={fetchGoals}
            style={{
              background: 'transparent',
              border: '1px solid var(--red)',
              color: 'var(--red)',
              borderRadius: '0.375rem',
              padding: '0.5rem 1.25rem',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && goals.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 1rem',
          }}
        >
          <p
            style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              marginBottom: '1rem',
            }}
          >
            No buildings yet
          </p>
          <Link
            href="/onboard"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--accent)',
              textDecoration: 'none',
            }}
          >
            Create your first building &rarr;
          </Link>
        </div>
      )}

      {/* Goal cards */}
      {!isLoading && !error && goals.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {goals.map((goal) => {
            const s = getStatus(goal.status);

            return (
              <Link
                key={goal.id}
                href={`/buildings/${goal.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: '#fff',
                        fontSize: '0.9375rem',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {goal.goalText}
                    </span>

                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.625rem',
                        borderRadius: '999px',
                        background: s.bg,
                        color: s.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                  >
                    {/* Floor progress */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      <div
                        style={{
                          width: 80,
                          height: 4,
                          background: 'var(--border)',
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${goal.floorCount > 0 ? (goal.liveFloors / goal.floorCount) * 100 : 0}%`,
                            background: 'var(--accent)',
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#6b7280' }}>
                        {goal.liveFloors}/{goal.floorCount}
                      </span>
                    </div>

                    {/* Created date */}
                    <span style={{ fontSize: '0.6875rem', color: '#4b5563' }}>
                      {formatDate(goal.createdAt)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
