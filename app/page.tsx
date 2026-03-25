'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import SwarmInput from '@/components/SwarmInput';
const WorkspaceEditor = dynamic(() => import('@/components/WorkspaceEditor').catch(() => ({
  default: () => <div style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>Workspace editor loading...</div>
})), { ssr: false });

const GlobeSwarm = dynamic(() => import('@/components/GlobeSwarm').catch(() => ({
  default: () => (
    <div style={{ height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--panel)', borderRadius: '0.5rem' }}>
      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
        3D visualization unavailable - swarm still running
      </span>
    </div>
  )
})), {
  ssr: false,
  loading: () => (
    <div style={{ height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#6b7280', fontSize: '0.875rem', fontFamily: 'monospace' }}>
        Loading visualization...
      </span>
    </div>
  ),
});
import UserMenu from '@/components/UserMenu';
import RateLimitBanner from '@/components/RateLimitBanner';
import FAQ from '@/components/FAQ';

export default function Home() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLDivElement>(null);

  // Cmd+K to focus input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = inputRef.current?.querySelector('input');
        input?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleSubmit(question: string) {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ question, stream: '1' });
    setStreamUrl(`/api/swarm?${params}`);

    // Increase timeout for autoresearch (can take 40s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

    fetch('/api/swarm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, stream: false }),
      signal: controller.signal,
    })
      .then((res) => {
        clearTimeout(timeoutId);
        if (res.status === 429) throw new Error('Rate limit exceeded. Upgrade your plan for more debates.');
        if (!res.ok) throw new Error('Failed to run swarm. Check your connection and try again.');
        return res.json();
      })
      .then((data) => {
        sessionStorage.setItem('lastResult', JSON.stringify(data));
        router.push('/results');
      })
      .catch((err) => {
        setError(err.message || 'Failed to run swarm. Check your connection and try again.');
        setLoading(false);
        setStreamUrl(null);
      });
  }

  function handleRetry() {
    setError(null);
  }

  const handleStreamComplete = useCallback(
    (result: unknown) => {
      sessionStorage.setItem('lastResult', JSON.stringify(result));
      router.push('/results');
    },
    [router],
  );

  const handleStreamError = useCallback((msg: string) => {
    setError(msg);
    setLoading(false);
    setStreamUrl(null);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <RateLimitBanner />

      {/* Header */}
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
          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Visual swarm intelligence
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {session && (
            <a
              href="/history"
              style={{
                color: '#9ca3af',
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              History
            </a>
          )}
          <UserMenu />
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 1rem',
            minHeight: 'calc(100vh - 300px)',
          }}
        >
          <div style={{ maxWidth: '640px', width: '100%', textAlign: 'center' }}>
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1.2,
                marginBottom: '1rem',
              }}
            >
              What decision are you tired of making?
            </h2>
            <p
              style={{
                fontSize: 'clamp(0.9375rem, 2.5vw, 1.125rem)',
                color: '#9ca3af',
                marginBottom: '2.5rem',
              }}
            >
              10,000 agents will research, debate, audit, and synthesize an answer
              — in seconds.
            </p>

            <div ref={inputRef}>
              <SwarmInput onSubmit={handleSubmit} loading={loading} />
            </div>

            {/* 3D Globe Swarm Visualization */}
            {loading && (
              <GlobeSwarm
                url={streamUrl}
                onComplete={handleStreamComplete}
                onError={handleStreamError}
              />
            )}

            {/* Error message with retry */}
            {error && (
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <p style={{ color: 'var(--red)', fontSize: '0.875rem' }}>
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--red)',
                    color: 'var(--red)',
                    borderRadius: '0.375rem',
                    padding: '0.25rem 0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                  }}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Feature pills */}
            {!loading && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  marginTop: '2rem',
                  flexWrap: 'wrap',
                }}
              >
                {['Alba: Research', 'David: Debate', 'Vex: Audit', 'Elira: Synthesize'].map(
                  (phase) => (
                    <span
                      key={phase}
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        background: 'var(--panel)',
                        border: '1px solid var(--border)',
                        borderRadius: '999px',
                        padding: '0.375rem 0.875rem',
                      }}
                    >
                      {phase}
                    </span>
                  ),
                )}
              </div>
            )}

            {/* Cmd+K hint */}
            {!loading && (
              <p style={{ marginTop: '1rem', fontSize: '0.6875rem', color: '#4b5563' }}>
                Press <kbd style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '0.25rem', padding: '0.125rem 0.375rem', fontSize: '0.625rem' }}>⌘K</kbd> to focus
              </p>
            )}
          </div>
        </div>

        {/* How it Works */}
        {!loading && (
          <section style={{ padding: '2rem 1rem 3rem', maxWidth: '960px', margin: '0 auto' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '1.5rem',
                textAlign: 'center',
              }}
            >
              How it Works
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {[
                { icon: '\uD83D\uDD0D', title: 'Alba Researches', desc: 'Searches the web for relevant context' },
                { icon: '\uD83E\uDDE0', title: 'David Debates', desc: '10K agents argue both sides' },
                { icon: '\u2705', title: 'Vex Validates', desc: 'Audits the debate quality' },
                { icon: '\uD83D\uDCCA', title: 'Elira Synthesizes', desc: 'Delivers the final decision' },
              ].map((step) => (
                <div
                  key={step.title}
                  style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{step.icon}</div>
                  <h3 style={{ fontWeight: 600, color: '#fff', marginBottom: '0.375rem', fontSize: '0.9375rem' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        {!loading && (
          <div style={{ padding: '0 1rem 4rem', maxWidth: '960px', margin: '0 auto' }}>
            <FAQ />
          </div>
        )}

        {/* Workspace Editor */}
        {!loading && (
          <div style={{ padding: '0 1rem 4rem', maxWidth: '960px', margin: '0 auto' }}>
            <WorkspaceEditor />
          </div>
        )}
      </main>
    </div>
  );
}
