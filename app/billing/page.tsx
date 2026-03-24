'use client';

import { useState, useEffect } from 'react';

// ============================================================
// Types
// ============================================================

interface BillingData {
  subscription: {
    id: string;
    goalId: string;
    status: string;
    planPaid: boolean;
    floorsActive: number;
    currentPeriodEnd: string | null;
    gracePeriodEnd: string | null;
  } | null;
  goal: {
    id: string;
    goalText: string;
    billingStatus: string;
  } | null;
}

// ============================================================
// Component
// ============================================================

export default function BillingPage() {
  const [billingData, setBillingData] = useState<BillingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, []);

  async function loadBillingData() {
    try {
      const res = await fetch('/api/billing/status');
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Failed to load billing data' }));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setBillingData(data.subscriptions ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load billing data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Failed' }));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      } else if (data.devMode) {
        setError('Billing portal not available in dev mode');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to open billing portal';
      setError(msg);
    } finally {
      setPortalLoading(false);
    }
  }

  // Not configured state
  const billingConfigured = billingData.length > 0 || !isLoading;

  const statusColors: Record<string, string> = {
    active: '#4ade80',
    past_due: '#facc15',
    canceled: '#f87171',
    paused: '#9ca3af',
    pending: '#6b7280',
    unpaid: '#6b7280',
  };

  function getStatusColor(status: string): string {
    return statusColors[status] ?? '#6b7280';
  }

  if (isLoading) {
    return (
      <div
        style={{
          maxWidth: '48rem',
          margin: '0 auto',
          padding: '3rem 1rem',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          Loading billing data...
        </p>
      </div>
    );
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && billingData.length === 0) {
    return (
      <div
        style={{
          maxWidth: '48rem',
          margin: '0 auto',
          padding: '3rem 1rem',
        }}
      >
        <h1
          style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '1rem',
          }}
        >
          Billing
        </h1>
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#9ca3af', fontSize: '0.9375rem' }}>
            Billing is not configured. Set STRIPE_SECRET_KEY and
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable billing.
          </p>
        </div>
      </div>
    );
  }

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
        <h1
          style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            color: '#fff',
          }}
        >
          Billing
        </h1>
        <button
          onClick={openPortal}
          disabled={portalLoading}
          style={{
            padding: '0.5rem 1.25rem',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: portalLoading ? 'not-allowed' : 'pointer',
            opacity: portalLoading ? 0.5 : 1,
            transition: 'opacity 0.15s ease',
          }}
        >
          {portalLoading ? 'Opening...' : 'Manage Billing'}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.625rem 1rem',
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            borderRadius: '0.5rem',
          }}
        >
          <span style={{ color: 'var(--red)', fontSize: '0.8125rem' }}>
            {error}
          </span>
        </div>
      )}

      {billingData.length === 0 && (
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#9ca3af', fontSize: '0.9375rem' }}>
            No active subscriptions.
          </p>
        </div>
      )}

      {billingData.map((item) => {
        const sub = item.subscription;
        const goal = item.goal;
        if (!sub || !goal) return null;

        const monthlyCost = sub.floorsActive * 49;
        const nextBillingDate = sub.currentPeriodEnd
          ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })
          : 'N/A';

        return (
          <div
            key={sub.id}
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '1.25rem 1.5rem',
              marginBottom: '0.75rem',
            }}
          >
            {/* Goal title + status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#fff',
                  flex: 1,
                  lineHeight: 1.3,
                }}
              >
                {goal.goalText.length > 80
                  ? goal.goalText.slice(0, 80) + '...'
                  : goal.goalText}
              </p>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '999px',
                  background: `${getStatusColor(sub.status)}20`,
                  color: getStatusColor(sub.status),
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em',
                  whiteSpace: 'nowrap',
                  marginLeft: '0.75rem',
                  flexShrink: 0,
                }}
              >
                {sub.status}
              </span>
            </div>

            {/* Stats grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
              }}
            >
              <div>
                <p style={{ fontSize: '0.6875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Monthly Cost
                </p>
                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff' }}>
                  ${monthlyCost}
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af' }}>
                    /mo
                  </span>
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.6875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Active Floors
                </p>
                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff' }}>
                  {sub.floorsActive}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.6875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Next Billing
                </p>
                <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#fff' }}>
                  {nextBillingDate}
                </p>
              </div>
            </div>

            {/* Grace period warning */}
            {sub.gracePeriodEnd && sub.status === 'past_due' && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(250, 204, 21, 0.08)',
                  border: '1px solid rgba(250, 204, 21, 0.3)',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  color: '#facc15',
                }}
              >
                Payment past due. Grace period ends{' '}
                {new Date(sub.gracePeriodEnd).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                . Update your payment method to avoid service interruption.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
