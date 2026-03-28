'use client';

import React, { useState, useRef, useEffect, useCallback, useRef as useRef2, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: 'user' | 'elira';
  content: string;
  timestamp: number;
}

interface PhaseState {
  name: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

interface BuildFloor {
  id: string;
  floorNumber: number;
  name: string;
  description: string;
  successCondition: string;
}

interface SwarmResult {
  id: string;
  question: string;
  decision: string;
  confidence: number;
  argumentsFor: string[];
  argumentsAgainst: string[];
  buildPlan: {
    floors: BuildFloor[];
    buildingSummary: string;
    floorCount: number;
  } | null;
  cost: number;
  duration: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'elira',
  content: "Hi! I'm Elira. What do you want to build today? Describe your automation — I'll coordinate the team to make it happen.",
  timestamp: Date.now(),
};

const SESSION_KEY = 'askelira_chat_history';

const AGENT_LABELS: Record<string, string> = {
  alba: 'Alba',
  david: 'David',
  vex: 'Vex',
  elira: 'Elira',
};

const AGENT_EMOJI: Record<string, string> = {
  alba: '🔍',
  david: '🛠️',
  vex: '🔎',
  elira: '🦞',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadHistory(): Message[] {
  if (typeof window === 'undefined') return [WELCOME_MESSAGE];
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [WELCOME_MESSAGE];
    const parsed = JSON.parse(raw) as Message[];
    return parsed.length > 0 ? parsed : [WELCOME_MESSAGE];
  } catch {
    return [WELCOME_MESSAGE];
  }
}

function saveHistory(messages: Message[]) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
  } catch {
    // sessionStorage unavailable
  }
}

function clearHistory() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // sessionStorage unavailable
  }
}

function phaseIcon(status: PhaseState['status']): string {
  switch (status) {
    case 'done': return '✓';
    case 'running': return '…';
    case 'error': return '✗';
    default: return '○';
  }
}

function phaseColor(status: PhaseState['status'], base: string): string {
  switch (status) {
    case 'done': return '#4ade80';
    case 'running': return '#facc15';
    case 'error': return '#f87171';
    default: return base;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PhaseBar({ phases }: { phases: PhaseState[] }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.625rem 1rem',
        background: 'rgba(15, 17, 23, 0.8)',
        borderTop: '1px solid var(--border)',
        overflowX: 'auto',
        flexShrink: 0,
      }}
    >
      {phases.map((phase) => {
        const isActive = phase.status === 'running';
        const isDone = phase.status === 'done';
        const isError = phase.status === 'error';
        const emoji = AGENT_EMOJI[phase.name] ?? '•';
        const label = AGENT_LABELS[phase.name] ?? phase.label;

        return (
          <div
            key={phase.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              border: `1px solid ${isActive ? '#facc15' : isDone ? '#4ade80' : isError ? '#f87171' : 'var(--border)'}`,
              background: isActive
                ? 'rgba(250, 204, 21, 0.08)'
                : isDone
                  ? 'rgba(74, 222, 128, 0.08)'
                  : isError
                    ? 'rgba(248, 113, 113, 0.08)'
                    : 'transparent',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: phaseColor(phase.status, '#6b7280'),
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease',
              minWidth: 'fit-content',
            }}
          >
            <span style={{ fontSize: '0.625rem' }}>{emoji}</span>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 600,
                color: isActive ? '#facc15' : isDone ? '#4ade80' : isError ? '#f87171' : '#6b7280',
              }}
            >
              {phaseIcon(phase.status)}
            </span>
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        padding: '0 1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            marginRight: '0.5rem',
            flexShrink: 0,
            marginTop: '0.25rem',
          }}
        >
          🦞
        </div>
      )}

      <div
        style={{
          maxWidth: '75%',
          padding: '0.75rem 1rem',
          borderRadius: isUser
            ? '1rem 1rem 0.25rem 1rem'
            : '1rem 1rem 1rem 0.25rem',
          background: isUser
            ? 'var(--accent)'
            : 'var(--panel)',
          color: isUser ? '#fff' : '#e5e7eb',
          fontSize: '0.9375rem',
          lineHeight: 1.55,
          border: isUser ? 'none' : '1px solid var(--border)',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

function ResultBuilding({ result }: { result: SwarmResult }) {
  const confidenceColor =
    result.confidence >= 70
      ? '#4ade80'
      : result.confidence >= 40
        ? '#facc15'
        : '#f87171';

  return (
    <div
      style={{
        padding: '1rem 1.25rem',
        margin: '0.5rem 1rem',
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      {/* Decision badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            fontFamily: 'monospace',
            background:
              result.decision === 'yes'
                ? 'rgba(74, 222, 128, 0.15)'
                : result.decision === 'no'
                  ? 'rgba(248, 113, 113, 0.15)'
                  : 'rgba(250, 204, 21, 0.15)',
            color:
              result.decision === 'yes'
                ? '#4ade80'
                : result.decision === 'no'
                  ? '#f87171'
                  : '#facc15',
            border: `1px solid ${
              result.decision === 'yes'
                ? 'rgba(74, 222, 128, 0.3)'
                : result.decision === 'no'
                  ? 'rgba(248, 113, 113, 0.3)'
                  : 'rgba(250, 204, 21, 0.3)'
            }`,
          }}
        >
          {result.decision.toUpperCase()}
        </span>

        <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
          Confidence{' '}
          <span style={{ fontWeight: 700, color: confidenceColor }}>
            {result.confidence}%
          </span>
        </span>

        {result.cost > 0 && (
          <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
            Cost{' '}
            <span style={{ fontWeight: 600, color: '#a78bfa' }}>
              ${result.cost.toFixed(4)}
            </span>
          </span>
        )}
      </div>

      {/* Building plan floors */}
      {result.buildPlan && result.buildPlan.floors && result.buildPlan.floors.length > 0 && (
        <div>
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.5rem',
              fontFamily: 'monospace',
            }}
          >
            Building — {result.buildPlan.floorCount} floors
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {result.buildPlan.floors.map((floor) => (
              <div
                key={floor.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.5rem 0.625rem',
                  background: 'rgba(99, 102, 241, 0.06)',
                  borderRadius: '0.375rem',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    background: 'rgba(99, 102, 241, 0.12)',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.25rem',
                    flexShrink: 0,
                  }}
                >
                  F{floor.floorNumber}
                </span>
                <div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#e5e7eb' }}>
                    {floor.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>
                    {floor.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {result.buildPlan.buildingSummary && (
            <p
              style={{
                marginTop: '0.75rem',
                fontSize: '0.8125rem',
                color: '#9ca3af',
                fontStyle: 'italic',
              }}
            >
              {result.buildPlan.buildingSummary}
            </p>
          )}

          <Link
            href={`/buildings/${result.id}`}
            style={{
              display: 'inline-block',
              marginTop: '0.875rem',
              padding: '0.5rem 1rem',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: '0.5rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e: any) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e: any) => (e.currentTarget.style.opacity = '1')}
          >
            Open Building →
          </Link>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

function ChatPageInner() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phases, setPhases] = useState<PhaseState[]>([
    { name: 'alba', label: 'Alba', status: 'pending' },
    { name: 'david', label: 'David', status: 'pending' },
    { name: 'vex', label: 'Vex', status: 'pending' },
    { name: 'elira', label: 'Elira', status: 'pending' },
  ]);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [result, setResult] = useState<SwarmResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dotCycleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thinkingDotRef = useRef<number>(0);
  const router = useRouter();

  // Load history on mount
  useEffect(() => {
    const history = loadHistory();
    setMessages(history);
  }, []);

  // Auto-submit if goal param is in URL
  const searchParams = useSearchParams();
  const autoSubmitted = useRef2(false);
  useEffect(() => {
    const goal = searchParams.get('goal');
    if (goal && !autoSubmitted.current) {
      autoSubmitted.current = true;
      // Clear the URL param without reload
      window.history.replaceState({}, '', '/chat');
      // Set the input and submit directly via startSwarm (not handleSubmit which expects FormEvent)
      setInput(goal);
      startSwarm(goal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, showResult]);

  // Persist history
  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  // Reset phases
  const resetPhases = useCallback(() => {
    // Clear dot cycle inline to avoid TDZ issue
    if (dotCycleRef.current) {
      clearInterval(dotCycleRef.current);
      dotCycleRef.current = null;
    }
    setPhases([
      { name: 'alba', label: 'Alba', status: 'pending' },
      { name: 'david', label: 'David', status: 'pending' },
      { name: 'vex', label: 'Vex', status: 'pending' },
      { name: 'elira', label: 'Elira', status: 'pending' },
    ]);
  }, []);

  // Close SSE connection
  const closeConnection = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
    if (dotCycleRef.current) {
      clearInterval(dotCycleRef.current);
      dotCycleRef.current = null;
    }
  }, []);

  // Dot cycle for thinking animation — must be before resetPhases
  const DOT_STATES = ['.', '..', '...'];
  const stopDotCycle = useCallback(() => {
    if (dotCycleRef.current) {
      clearInterval(dotCycleRef.current);
      dotCycleRef.current = null;
    }
  }, []);

  const startDotCycle = useCallback((agentName: string) => {
    if (dotCycleRef.current) clearInterval(dotCycleRef.current);
    thinkingDotRef.current = 0;
    dotCycleRef.current = setInterval(() => {
      thinkingDotRef.current = (thinkingDotRef.current + 1) % 3;
      setStreamingContent(`${agentName} is thinking${DOT_STATES[thinkingDotRef.current]}`);
    }, 600);
  }, []);

  // Handle incoming SSE message
  const handleSSEPhase = useCallback(
    (phase: PhaseState) => {
      setPhases((prev) =>
        prev.map((p) =>
          p.name === phase.name
            ? { ...p, status: phase.status }
            : p,
        ),
      );

      // When a phase starts running, start the dot cycle
      if (phase.status === 'running') {
        const label = AGENT_LABELS[phase.name] ?? phase.label;
        startDotCycle(label);
      }
      // When a phase finishes, stop the dot cycle
      if (phase.status === 'done' || phase.status === 'error') {
        stopDotCycle();
      }
    },
    [startDotCycle, stopDotCycle],
  );

  const handleSSEError = useCallback(
    (errMsg: string) => {
      stopDotCycle();
      setError(errMsg);
      setIsRunning(false);
      setStreamingContent('');

      // Add error message to chat
      const errorMsg: Message = {
        id: `error_${Date.now()}`,
        role: 'elira',
        content: `Something went wrong: ${errMsg}. Please try again.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    },
    [stopDotCycle],
  );

  const handleSSEComplete = useCallback(
    (res: SwarmResult) => {
      stopDotCycle();
      setStreamingContent('');
      setIsRunning(false);
      setShowResult(true);
      setResult(res);

      // Add final Elira message
      const finalMsg: Message = {
        id: `final_${Date.now()}`,
        role: 'elira',
        content:
          res.buildPlan && res.buildPlan.floors.length > 0
            ? `The building is ready! I've laid out ${res.buildPlan.floorCount} floors for your automation. Scroll down to see the blueprint.`
            : res.argumentsFor.length > 0
              ? `Done! Here's what the team found — scroll down to see the full results.`
              : `Done! Your request has been processed.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, finalMsg]);

      // Persist result for downstream pages
      try {
        sessionStorage.setItem('lastResult', JSON.stringify(res));
      } catch {
        // ignore
      }

      closeConnection();
    },
    [closeConnection, stopDotCycle],
  );

  // Start the swarm
  const startSwarm = useCallback(
    async (goal: string) => {
      if (!goal.trim() || isRunning) return;

      setError(null);
      setShowResult(false);
      setResult(null);
      resetPhases();

      // Add user message
      const userMsg: Message = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: goal.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Add initial Elira thinking message
      const thinkingId = `thinking_${Date.now()}`;
      setStreamingContent('Starting the team.');
      stopDotCycle(); // clear any running dot cycle

      setIsRunning(true);
      setInput('');

      // POST to /api/chat — returns planning result, Steven builds in background
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal: goal.trim(), stream: false }),
          credentials: 'include',
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const data = await res.json();

        // Planning complete — Steven is now building in background
        setStreamingContent('Steven is building your automation...');
        setIsRunning(false);

        // Add Elira's planning message
        const planMsg: Message = {
          id: `plan_${Date.now()}`,
          role: 'elira',
          content: `Great! Steven is now building your automation. I've designed ${data.floorCount} floors for you. Steven will work through each floor — researching, building, auditing, and reviewing. This takes a few minutes. I'll let you know when it's done.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, planMsg]);

        // Store customerId for guest mode (used by building page)
        if (data.customerId) {
          localStorage.setItem('askelira_customer_id', data.customerId);
        }

        // Show the result
        setShowResult(true);
        setResult({
          id: data.goalId,
          question: goal.trim(),
          decision: 'Building in progress',
          confidence: 100,
          argumentsFor: [],
          argumentsAgainst: [],
          buildPlan: {
            floors: data.floors.map((f: any) => ({
              id: f.id,
              floorNumber: f.floorNumber,
              name: f.name,
              description: f.description,
              successCondition: f.successCondition,
            })),
            buildingSummary: data.buildingSummary,
            floorCount: data.floorCount,
          },
          cost: 0,
          duration: 0,
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        handleSSEError(err instanceof Error ? err.message : 'Request failed');
      }
    },
    [handleSSEError, stopDotCycle],
  );

  // Handle form submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      startSwarm(input);
    },
    [input, startSwarm],
  );

  // Handle new chat
  const handleNewChat = useCallback(() => {
    closeConnection();
    clearHistory();
    setMessages([WELCOME_MESSAGE]);
    setInput('');
    setError(null);
    setIsRunning(false);
    setShowResult(false);
    setResult(null);
    resetPhases();
    setStreamingContent('');
    inputRef.current?.focus();
  }, [closeConnection, resetPhases]);

  // Auto-resize textarea
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
    },
    [],
  );

  // Submit on Enter (without Shift)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isRunning && input.trim()) {
          startSwarm(input);
        }
      }
    },
    [input, isRunning, startSwarm],
  );

  const anyRunning = phases.some((p) => p.status === 'running');

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        overflow: 'hidden',
      }}
    >
      {/* Keyframe for fade-in */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* ── Header ── */}
      <header
        style={{
          padding: '0.875rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexShrink: 0,
          background: 'var(--panel)',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: '#9ca3af',
            textDecoration: 'none',
            fontSize: '0.875rem',
            padding: '0.375rem 0.5rem',
            borderRadius: '0.375rem',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e: any) =>
            (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')
          }
          onMouseLeave={(e: any) =>
            (e.currentTarget.style.background = 'transparent')
          }
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </Link>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
            <span>🦞</span>
            <span>AskElira Chat</span>
          </h1>
        </div>

        <button
          onClick={handleNewChat}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: '#9ca3af',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            padding: '0.375rem 0.5rem',
            borderRadius: '0.375rem',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e: any) =>
            (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')
          }
          onMouseLeave={(e: any) =>
            (e.currentTarget.style.background = 'transparent')
          }
          title="New chat"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New
        </button>
      </header>

      {/* ── Phase progress bar ── */}
      {isRunning && <PhaseBar phases={phases} />}

      {/* ── Error banner ── */}
      {error && (
        <div
          style={{
            padding: '0.625rem 1.25rem',
            background: 'rgba(248, 113, 113, 0.1)',
            borderBottom: '1px solid rgba(248, 113, 113, 0.25)',
            color: '#f87171',
            fontSize: '0.8125rem',
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      {/* ── Messages ── */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.25rem 0',
        }}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming / thinking indicator */}
        {streamingContent && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              padding: '0 1rem',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                marginRight: '0.5rem',
                flexShrink: 0,
                marginTop: '0.25rem',
              }}
            >
              🦞
            </div>
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '1rem 1rem 1rem 0.25rem',
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                color: '#9ca3af',
                fontSize: '0.9375rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#facc15',
                  animation: 'steven-pulse 1.2s ease-in-out infinite',
                }}
              />
              {streamingContent}
            </div>
          </div>
        )}

        {/* Result card */}
        {showResult && result && (
          <div>
            <ResultBuilding result={result} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* ── Input bar ── */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '0.75rem 1rem',
          display: 'flex',
          gap: '0.625rem',
          alignItems: 'flex-end',
          background: 'var(--panel)',
          flexShrink: 0,
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want to build…"
          disabled={isRunning}
          rows={1}
          style={{
            flex: 1,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '0.625rem 0.875rem',
            color: '#e5e7eb',
            fontSize: '0.9375rem',
            lineHeight: 1.5,
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            maxHeight: '160px',
            overflowY: 'auto',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = 'var(--accent)')
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = 'var(--border)')
          }
        />

        <button
          onClick={() => startSwarm(input)}
          disabled={isRunning || !input.trim()}
          style={{
            width: 42,
            height: 42,
            borderRadius: '0.75rem',
            border: 'none',
            background:
              isRunning || !input.trim()
                ? 'rgba(99, 102, 241, 0.3)'
                : 'var(--accent)',
            color: '#fff',
            cursor: isRunning || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s, transform 0.1s',
            fontSize: '1rem',
          }}
          onMouseDown={(e) => {
            if (!isRunning && input.trim())
              (e.currentTarget as HTMLButtonElement).style.transform =
                'scale(0.95)';
          }}
          onMouseUp={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')
          }
          title="Send"
        >
          {isRunning ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: 'spin 0.8s linear infinite' }}
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </footer>

      {/* Spin animation for loading spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes steven-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}
