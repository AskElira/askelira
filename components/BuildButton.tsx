'use client';

import { useState } from 'react';

interface BuildButtonProps {
  question: string;
  decision: string;
  confidence: number;
  argumentsFor: string[];
  research: string | null;
  disabled?: boolean;
  onBuildStart?: () => void;
  onBuildComplete?: (files: Array<{ path: string; content: string }>) => void;
  onBuildError?: (error: string) => void;
}

export default function BuildButton({
  question,
  decision,
  confidence,
  argumentsFor,
  research,
  disabled,
  onBuildStart,
  onBuildComplete,
  onBuildError,
}: BuildButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleBuild() {
    setLoading(true);
    onBuildStart?.();

    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          decision,
          confidence,
          argumentsFor,
          research,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Build failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'complete') {
              onBuildComplete?.(data.files);
            }
          }
          if (line.startsWith('event: error')) {
            // Next line has the error data
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Build failed';
      onBuildError?.(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleBuild}
      disabled={disabled || loading}
      style={{
        background: loading
          ? 'var(--border)'
          : 'linear-gradient(135deg, var(--accent), #7c3aed)',
        color: '#fff',
        border: 'none',
        borderRadius: '0.5rem',
        padding: '0.625rem 1.25rem',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontWeight: 600,
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      {loading ? (
        <>
          <span
            style={{
              width: '14px',
              height: '14px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          Building...
        </>
      ) : (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 2.5A1.5 1.5 0 014.5 1h3.379a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0112.5 5.622V13.5A1.5 1.5 0 0111 15H4.5A1.5 1.5 0 013 13.5v-11zM6 9.5a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5zm.5 1.5a.5.5 0 000 1h2a.5.5 0 000-1h-2z"
              fill="currentColor"
            />
          </svg>
          Build This
        </>
      )}
    </button>
  );
}
