'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BuildButton from '@/components/BuildButton';
import BuildProgress from '@/components/BuildProgress';

interface SwarmResult {
  question: string;
  decision: string;
  confidence: number;
  argumentsFor: string[];
  argumentsAgainst: string[];
  research: string | null;
  auditNotes: string[];
  actualCost: number;
  agentCount: number;
  duration: number;
  timestamp: string;
}

function confidenceColor(value: number) {
  if (value >= 70) return 'var(--green)';
  if (value >= 40) return 'var(--yellow)';
  return 'var(--red)';
}

function verdictLabel(decision: string) {
  if (decision === 'yes') return 'GO';
  if (decision === 'no') return 'NO-GO';
  return 'CONDITIONAL';
}

export default function ResultsPage() {
  const [result, setResult] = useState<SwarmResult | null>(null);
  const [showBuild, setShowBuild] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('lastResult');
    if (stored) {
      setResult(JSON.parse(stored));
    }
  }, []);

  if (!result) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <p style={{ color: '#9ca3af' }}>No results found.</p>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.625rem 1.25rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Start a debate
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
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
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <BuildButton
            question={result.question}
            decision={result.decision}
            confidence={result.confidence}
            argumentsFor={result.argumentsFor}
            research={result.research}
            onBuildStart={() => setShowBuild(true)}
          />
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
        </div>
      </header>

      {/* Results */}
      <main style={{ maxWidth: '768px', margin: '0 auto', padding: '2rem' }}>
        {/* Question */}
        <p
          style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
          }}
        >
          Question
        </p>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '2rem' }}>
          {result.question}
        </h2>

        {/* Decision + Confidence */}
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Decision</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                {result.decision.charAt(0).toUpperCase() + result.decision.slice(1)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Confidence</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: confidenceColor(result.confidence) }}>
                {result.confidence}%
              </p>
            </div>
          </div>

          {/* Confidence bar */}
          <div style={{ width: '100%', background: 'var(--border)', borderRadius: '999px', height: '0.5rem' }}>
            <div
              style={{
                width: `${result.confidence}%`,
                height: '0.5rem',
                borderRadius: '999px',
                background: confidenceColor(result.confidence),
                transition: 'width 0.7s ease',
              }}
            />
          </div>

          <p
            style={{
              marginTop: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: confidenceColor(result.confidence),
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {verdictLabel(result.decision)}
          </p>
        </div>

        {/* Arguments */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Arguments For
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {result.argumentsFor.length > 0 ? (
                result.argumentsFor.map((arg, i) => (
                  <li key={i} style={{ fontSize: '0.875rem', color: '#d1d5db', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', marginTop: '0.375rem' }} />
                    {arg}
                  </li>
                ))
              ) : (
                <li style={{ fontSize: '0.875rem', color: '#6b7280' }}>None</li>
              )}
            </ul>
          </div>

          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Arguments Against
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {result.argumentsAgainst.length > 0 ? (
                result.argumentsAgainst.map((arg, i) => (
                  <li key={i} style={{ fontSize: '0.875rem', color: '#d1d5db', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red)', marginTop: '0.375rem' }} />
                    {arg}
                  </li>
                ))
              ) : (
                <li style={{ fontSize: '0.875rem', color: '#6b7280' }}>None</li>
              )}
            </ul>
          </div>
        </div>

        {/* Audit + Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Audit Notes
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {result.auditNotes.length > 0 ? (
                result.auditNotes.map((note, i) => (
                  <li key={i} style={{ fontSize: '0.875rem', color: '#d1d5db' }}>{note}</li>
                ))
              ) : (
                <li style={{ fontSize: '0.875rem', color: '#6b7280' }}>All checks passed</li>
              )}
            </ul>
          </div>

          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Stats
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Cost</span>
                <span style={{ color: '#d1d5db', fontFamily: 'monospace' }}>${result.actualCost.toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Duration</span>
                <span style={{ color: '#d1d5db', fontFamily: 'monospace' }}>{result.duration}ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Agents</span>
                <span style={{ color: '#d1d5db', fontFamily: 'monospace' }}>{result.agentCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showBuild && (
        <BuildProgress
          question={result.question}
          decision={result.decision}
          confidence={result.confidence}
          argumentsFor={result.argumentsFor}
          research={result.research}
          onClose={() => setShowBuild(false)}
        />
      )}
    </div>
  );
}
