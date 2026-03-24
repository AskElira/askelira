'use client';

import { useEffect, useRef, useState } from 'react';

interface BuildStep {
  id: number;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  output?: string;
}

interface BuildFile {
  path: string;
  content: string;
}

interface BuildProgressProps {
  question: string;
  decision: string;
  confidence: number;
  argumentsFor: string[];
  research: string | null;
  onClose: () => void;
}

export default function BuildProgress({
  question,
  decision,
  confidence,
  argumentsFor,
  research,
  onClose,
}: BuildProgressProps) {
  const [steps, setSteps] = useState<BuildStep[]>([
    { id: 1, label: 'Generating build prompt', status: 'pending' },
    { id: 2, label: 'Running Claude Code', status: 'pending' },
    { id: 3, label: 'Collecting output files', status: 'pending' },
    { id: 4, label: 'Packaging results', status: 'pending' },
  ]);
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [files, setFiles] = useState<BuildFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [progressLog]);

  useEffect(() => {
    const controller = new AbortController();

    async function runBuild() {
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
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          setError(err.error || `Build failed (${res.status})`);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setError('No response stream');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'step') {
                  setSteps((prev) =>
                    prev.map((s) =>
                      s.id === data.step.id ? { ...s, ...data.step } : s,
                    ),
                  );
                }

                if (data.type === 'progress') {
                  setProgressLog((prev) => [...prev, data.text]);
                }

                if (data.type === 'complete') {
                  setFiles(data.files || []);
                  setDone(true);
                }

                if (data.error) {
                  setError(data.error);
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message || 'Build failed');
        }
      }
    }

    runBuild();
    return () => controller.abort();
  }, [question, decision, confidence, argumentsFor, research]);

  function downloadFiles() {
    // Create a simple text bundle of all files
    const bundle = files
      .map((f) => `--- ${f.path} ---\n${f.content}`)
      .join('\n\n');

    const blob = new Blob([bundle], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'askelira-build.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return (
          <span style={{ color: 'var(--green)', fontSize: '1rem' }}>
            &#10003;
          </span>
        );
      case 'running':
        return (
          <span
            style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              border: '2px solid var(--accent)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        );
      case 'error':
        return (
          <span style={{ color: 'var(--red)', fontSize: '1rem' }}>
            &#10007;
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--border)',
            }}
          />
        );
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
            Build from Swarm Decision
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '1.25rem',
              lineHeight: 1,
            }}
          >
            &#10005;
          </button>
        </div>

        {/* Steps */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {steps.map((step) => (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                {statusIcon(step.status)}
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      color:
                        step.status === 'done'
                          ? '#d1d5db'
                          : step.status === 'running'
                            ? '#fff'
                            : '#6b7280',
                      fontWeight: step.status === 'running' ? 600 : 400,
                    }}
                  >
                    {step.label}
                  </span>
                  {step.output && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginLeft: '0.5rem',
                      }}
                    >
                      {step.output}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress log */}
        {progressLog.length > 0 && (
          <div
            ref={logRef}
            style={{
              padding: '1rem 1.25rem',
              maxHeight: '200px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: '#9ca3af',
              borderBottom: '1px solid var(--border)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {progressLog.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'rgba(239,68,68,0.1)',
              borderBottom: '1px solid var(--border)',
              color: 'var(--red)',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Done: show files */}
        {done && files.length > 0 && (
          <div style={{ padding: '1.25rem' }}>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--green)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem',
              }}
            >
              Generated Files ({files.length})
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                marginBottom: '1rem',
              }}
            >
              {files.map((f, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '0.8125rem',
                    color: '#d1d5db',
                    fontFamily: 'monospace',
                    padding: '0.375rem 0.5rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.25rem',
                  }}
                >
                  {f.path}
                </div>
              ))}
            </div>
            <button
              onClick={downloadFiles}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.625rem 1.25rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                width: '100%',
              }}
            >
              Download Build Output
            </button>
          </div>
        )}

        {/* Footer for non-done state */}
        {!done && !error && (
          <div
            style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={onClose}
              style={{
                background: 'var(--border)',
                color: '#d1d5db',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.8125rem',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
