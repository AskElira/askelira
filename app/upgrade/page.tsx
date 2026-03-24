'use client';

import { useRouter } from 'next/navigation';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    debates: '4 debates/month',
    features: ['1 debate per week', '10K agents', 'Basic support'],
    cta: 'Current Plan',
    disabled: true,
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$20',
    period: '/mo',
    debates: '20 debates/month',
    features: ['20 debates included', '10K agents', '$0.80 per additional debate', 'Priority support'],
    cta: 'Upgrade to Pro',
    disabled: false,
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$200',
    period: '/mo',
    debates: 'Unlimited debates',
    features: ['Unlimited debates', '100K+ agents', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
    cta: 'Contact Sales',
    disabled: false,
    highlight: false,
  },
];

export default function UpgradePage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          padding: '1.25rem 2rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            AskElira <span style={{ color: 'var(--accent)' }}>2.1</span>
          </h1>
        </div>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            color: '#e5e7eb',
            borderRadius: '0.5rem',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Back to Home
        </button>
      </header>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
            Choose Your Plan
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '1.125rem' }}>
            Scale your decision-making with AI swarm intelligence
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: 'var(--panel)',
                border: `1px solid ${plan.highlight ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '0.75rem',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {plan.highlight && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-0.75rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Most Popular
                </div>
              )}

              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
                {plan.name}
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>{plan.price}</span>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{plan.period}</span>
              </div>

              <p style={{ color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '1.5rem' }}>
                {plan.debates}
              </p>

              <ul style={{ listStyle: 'none', padding: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ color: '#d1d5db', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--green)', fontSize: '0.75rem' }}>&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={plan.disabled}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: plan.highlight ? 'none' : '1px solid var(--border)',
                  background: plan.highlight ? 'var(--accent)' : 'transparent',
                  color: plan.disabled ? '#6b7280' : '#fff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: plan.disabled ? 'default' : 'pointer',
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#6b7280', fontSize: '0.8125rem' }}>
          All plans include real-time web research, 4-agent debate system, and shareable results.
        </p>
      </main>
    </div>
  );
}
