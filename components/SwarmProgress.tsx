'use client';

import { useEffect, useState } from 'react';

interface PhaseState {
  name: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

const PHASE_DEFAULTS: PhaseState[] = [
  { name: 'alba', label: 'Research', status: 'pending' },
  { name: 'david', label: 'Debate', status: 'pending' },
  { name: 'vex', label: 'Audit', status: 'pending' },
  { name: 'elira', label: 'Synthesize', status: 'pending' },
];

interface SwarmProgressProps {
  /** URL of the SSE endpoint (e.g. /api/swarm?stream=1) */
  url: string | null;
  onComplete: (result: unknown) => void;
  onError: (error: string) => void;
}

export default function SwarmProgress({ url, onComplete, onError }: SwarmProgressProps) {
  const [phases, setPhases] = useState<PhaseState[]>(PHASE_DEFAULTS);

  useEffect(() => {
    if (!url) return;

    setPhases(PHASE_DEFAULTS);

    const source = new EventSource(url);

    source.onmessage = (event) => {
      try {
        const phase = JSON.parse(event.data) as PhaseState;
        setPhases((prev) =>
          prev.map((p) =>
            p.name === phase.name ? { ...p, status: phase.status } : p,
          ),
        );
      } catch {
        // ignore malformed data
      }
    };

    source.addEventListener('done', (event) => {
      try {
        const result = JSON.parse((event as MessageEvent).data);
        onComplete(result);
      } catch {
        onError('Failed to parse result');
      }
      source.close();
    });

    source.addEventListener('error', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        onError(data.error || 'Unknown error');
      } catch {
        onError('Connection lost');
      }
      source.close();
    });

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
    };
  }, [url, onComplete, onError]);

  function statusIcon(status: PhaseState['status']) {
    switch (status) {
      case 'done':
        return '✓';
      case 'running':
        return '●';
      case 'error':
        return '✗';
      default:
        return '○';
    }
  }

  function statusColor(status: PhaseState['status']) {
    switch (status) {
      case 'done':
        return 'var(--green)';
      case 'running':
        return 'var(--accent)';
      case 'error':
        return 'var(--red)';
      default:
        return '#4b5563';
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '1.5rem',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1.5rem 0',
      }}
    >
      {phases.map((phase, i) => (
        <div key={phase.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <span
              style={{
                fontSize: '1rem',
                color: statusColor(phase.status),
                fontWeight: phase.status === 'running' ? 700 : 400,
                animation: phase.status === 'running' ? 'swarm-pulse 1.5s ease-in-out infinite' : 'none',
              }}
            >
              {statusIcon(phase.status)}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                color: phase.status === 'pending' ? '#4b5563' : '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {phase.label}
            </span>
          </div>
          {i < phases.length - 1 && (
            <div
              style={{
                width: '2rem',
                height: '1px',
                background: phase.status === 'done' ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.3s ease',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
