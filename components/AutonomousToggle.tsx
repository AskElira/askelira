'use client';

import { useEffect, useState } from 'react';

interface AutonomousStatus {
  configured: boolean;
  enabled: boolean;
  config: {
    loopInterval: number;
    agentCount: number;
    maxIterations: number;
    allowedPaths: string[];
  } | null;
  lastRun: string | null;
  totalIterations: number;
}

export default function AutonomousToggle() {
  const [status, setStatus] = useState<AutonomousStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/autonomous/status')
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
        Loading status...
      </div>
    );
  }

  if (!status?.configured) {
    return (
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.8rem',
          color: '#6b7280',
        }}
      >
        Autonomous loop not configured
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: status.enabled ? 'var(--green)' : 'var(--red)',
            display: 'inline-block',
          }}
        />
        <span style={{ fontSize: '0.8rem', color: '#e5e7eb', fontWeight: 600 }}>
          Autonomous Loop: {status.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {status.config && (
          <>
            <span>Agents: {status.config.agentCount.toLocaleString()}</span>
            <span>Max iterations: {status.config.maxIterations}</span>
          </>
        )}
        <span>Total runs: {status.totalIterations}</span>
        {status.lastRun && (
          <span>Last run: {new Date(status.lastRun).toLocaleString()}</span>
        )}
      </div>
    </div>
  );
}
