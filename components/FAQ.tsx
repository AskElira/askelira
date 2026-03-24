'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'How long does a debate take?',
    a: '30-60 seconds for 10,000 agents to research, debate, audit, and synthesize a decision.',
  },
  {
    q: 'What does it cost?',
    a: 'Free: 1 debate/week. Pro ($20/mo): 20 debates + $0.80 per additional. Enterprise ($200/mo): Unlimited.',
  },
  {
    q: 'Can I trust the results?',
    a: 'Vex audits every debate for quality, bias, and logical consistency. Confidence scores reflect the strength of consensus among agents.',
  },
  {
    q: 'What kind of questions work best?',
    a: 'Binary or multi-option decisions: "Should we migrate to microservices?", "Hire candidate A or B?", "Launch this product now or wait?"',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section style={{ marginTop: '4rem' }}>
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#fff',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}
      >
        Frequently Asked Questions
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '640px', margin: '0 auto' }}>
        {faqs.map((faq, i) => (
          <div
            key={i}
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '0.9375rem',
                fontWeight: 500,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {faq.q}
              <span style={{ color: '#6b7280', fontSize: '0.75rem', flexShrink: 0, marginLeft: '1rem' }}>
                {openIndex === i ? '−' : '+'}
              </span>
            </button>
            {openIndex === i && (
              <div style={{ padding: '0 1.25rem 1rem', color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.6 }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
