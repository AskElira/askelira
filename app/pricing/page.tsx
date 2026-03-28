'use client';

export default function PricingPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0e27 100%)',
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '4rem 1.5rem',
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', marginBottom: '4rem' }}>
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
            letterSpacing: '-0.02em',
          }}
        >
          Simple, Transparent Pricing
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
          Start free. Scale as you grow. No hidden fees, no surprise bills.
        </p>
      </div>

      {/* Pricing Cards */}
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
        }}
      >
        {/* Free Tier */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '1rem',
            padding: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>
            Free
          </h2>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#a855f7', marginBottom: '1.5rem' }}>
            $0<span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 400 }}>/month</span>
          </div>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Perfect for trying AskElira and automating personal workflows.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              '3 active automations',
              '100 AI requests per day',
              'Email support',
              'Community access',
              'Core agent pipeline (Alba, David, Vex, Elira)',
            ].map((feature) => (
              <li
                key={feature}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#94a3b8',
                  marginBottom: '0.75rem',
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ color: '#22c55e', fontSize: '1.1rem' }}>✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <a
            href="/onboard"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '0.5rem',
              color: '#818cf8',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            Get Started Free →
          </a>
        </div>

        {/* Pro Tier */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '2px solid rgba(168, 85, 247, 0.5)',
            borderRadius: '1rem',
            padding: '2rem',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              color: 'white',
              padding: '0.25rem 1rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Most Popular
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>
            Pro
          </h2>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#a855f7', marginBottom: '1.5rem' }}>
            $29<span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 400 }}>/month</span>
          </div>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            For professionals who need more power and flexibility.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              'Unlimited active automations',
              '5,000 AI requests per day',
              'Priority email & chat support',
              'Advanced agent pipelines',
              'Custom webhooks',
              'Usage analytics',
              'SLA guarantee',
            ].map((feature) => (
              <li
                key={feature}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#94a3b8',
                  marginBottom: '0.75rem',
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ color: '#22c55e', fontSize: '1.1rem' }}>✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <a
            href="/upgrade"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            Upgrade to Pro →
          </a>
        </div>

        {/* Enterprise Tier */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '1rem',
            padding: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>
            Enterprise
          </h2>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#a855f7', marginBottom: '1.5rem' }}>
            Custom
          </div>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            For teams and organizations with advanced requirements.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              'Everything in Pro',
              'Unlimited AI requests',
              'Dedicated support manager',
              'Custom agent pipelines',
              'On-premise deployment option',
              'SLA with uptime guarantee',
              'SSO & advanced security',
              'Team collaboration features',
            ].map((feature) => (
              <li
                key={feature}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#94a3b8',
                  marginBottom: '0.75rem',
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ color: '#22c55e', fontSize: '1.1rem' }}>✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <a
            href="mailto:enterprise@askelira.com"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '0.5rem',
              color: '#818cf8',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            Contact Sales →
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={{ maxWidth: '700px', margin: '5rem auto 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>
          Frequently Asked Questions
        </h2>
        <div style={{ textAlign: 'left', marginTop: '2rem' }}>
          {[
            {
              q: 'What counts as an AI request?',
              a: 'Each message sent through the AskElira pipeline — including research, debates, and validation — counts as one AI request.',
            },
            {
              q: 'Can I change plans later?',
              a: 'Yes! You can upgrade or downgrade at any time. Changes take effect on your next billing cycle.',
            },
            {
              q: 'Is there a free trial for Pro?',
              a: 'Yes — start free and upgrade when you need more power. No credit card required to start.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major credit cards via Stripe. Enterprise customers can pay via invoice.',
            },
          ].map(({ q, a }) => (
            <div key={q} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                {q}
              </h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ maxWidth: '900px', margin: '4rem auto 0', textAlign: 'center', borderTop: '1px solid rgba(148,163,184,0.2)', paddingTop: '2rem' }}>
        <a href="/" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to AskElira
        </a>
      </div>
    </div>
  );
}
