'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'What is AskElira?',
    a: 'AskElira is an open-source agentic AI team that builds automations for you. Describe what you want built — like "email me the top 5 Hacker News stories every morning" — and our agents research, debate, validate, and build it.',
  },
  {
    q: 'How does the agent team work?',
    a: 'Our pipeline has 5 specialized agents: Alba researches your domain, David generates the automation code, Vex validates everything, and Elira synthesizes the final result. Steven coordinates the whole process floor by floor.',
  },
  {
    q: 'What kind of automations can I build?',
    a: 'Anything with a clear trigger and action: daily email reports, social media monitoring, calendar integrations, data collection, API workflows, and more. The more specific your goal, the better the results.',
  },
  {
    q: 'How long does a build take?',
    a: 'Simple automations (1-2 floors) take 5-10 minutes. Complex ones may take 20+ minutes as the agents debate and validate the approach.',
  },
  {
    q: 'What does it cost?',
    a: 'We have a free tier with 3 active automations and 100 AI requests per day. Pro is $29/month for unlimited automations and 5,000 requests. See our pricing page for details.',
  },
  {
    q: 'Is AskElira open source?',
    a: 'Yes! The core agentic team is open source. Anyone can run it, study it, or deploy it for their own use at no cost.',
  },
  {
    q: 'Can I trust the results?',
    a: 'Every automation goes through our triple-lock validation: in-sample testing, out-of-sample testing, and Monte Carlo simulation. Vex challenges every assumption before Elira approves.',
  },
  {
    q: 'What if the automation breaks?',
    a: 'Our agents validate success conditions for each floor. If a floor fails, Steven re-runs it with fixes. You also get notified of any failures.',
  },
  {
    q: 'How do I get started?',
    a: 'Just describe what you want built on the homepage. Click "Run Swarm" and watch the agents debate and build your automation in real-time.',
  },
  {
    q: 'Can I modify the agents?',
    a: 'Absolutely. The agent prompts and pipeline logic are in the open source repo. Customize the agents for your specific use case.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 0',
          background: 'none',
          border: 'none',
          color: '#e2e8f0',
          fontSize: '1.05rem',
          fontWeight: 600,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        {q}
        <span
          style={{
            fontSize: '1.5rem',
            color: '#6366f1',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div
          style={{
            paddingBottom: '1.25rem',
            color: '#94a3b8',
            lineHeight: 1.7,
            fontSize: '0.95rem',
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
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
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem',
            }}
          >
            Frequently Asked Questions
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
            Everything you need to know about AskElira.
          </p>
        </div>

        {/* FAQ List */}
        <div>{faqs.map(({ q, a }) => (
          <FAQItem key={q} q={q} a={a} />
        ))}</div>

        {/* CTA */}
        <div
          style={{
            marginTop: '4rem',
            textAlign: 'center',
            padding: '2rem',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '1rem',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
            Still have questions?
          </p>
          <a
            href="mailto:support@askelira.com"
            style={{
              color: '#818cf8',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Contact Support →
          </a>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <a href="/" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to AskElira
          </a>
        </div>
      </div>
    </div>
  );
}
