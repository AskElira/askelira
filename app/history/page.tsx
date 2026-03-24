'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Debate {
  id: string;
  question: string;
  decision: string;
  confidence: number;
  cost: number;
  duration_ms: number;
  created_at: string;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    fetch(`/api/debates?email=${encodeURIComponent(session.user.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDebates(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, status]);

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
          New Debate
        </button>
      </header>

      <main style={{ maxWidth: '768px', margin: '0 auto', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '2rem' }}>
          Debate History
        </h2>

        {loading && <p style={{ color: '#9ca3af' }}>Loading...</p>}

        {!loading && !session && (
          <p style={{ color: '#9ca3af' }}>
            Sign in to view your debate history.
          </p>
        )}

        {!loading && session && debates.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>No debates yet.</p>
            <a
              href="/"
              style={{
                color: 'var(--accent)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Start your first debate &rarr;
            </a>
          </div>
        )}

        {!loading && debates.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {debates.map((d) => (
              <a
                key={d.id}
                href={`/results/${d.id}`}
                style={{
                  display: 'block',
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <p style={{ fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
                  {d.question}
                </p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                  <span style={{ textTransform: 'capitalize' }}>{d.decision}</span>
                  <span>{d.confidence}% confidence</span>
                  <span>{new Date(d.created_at).toLocaleDateString()}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
