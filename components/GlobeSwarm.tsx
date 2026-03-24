'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Globe3D from './Globe3D';
import AgentNode from './AgentNode';
import DebateSwarm from './DebateSwarm';
import CommunicationLines from './CommunicationLines';
import CodeGeneration from './CodeGeneration';
import ProgressRing from './ProgressRing';

// --- Types ---

interface PhaseState {
  name: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

interface GlobeSwarmProps {
  url: string | null;
  onComplete: (result: unknown) => void;
  onError: (error: string) => void;
}

// --- Agent definitions ---

const AGENTS = [
  {
    name: 'Alba',
    phaseName: 'alba',
    label: 'Research',
    color: '#3B82F6',
    icon: '\uD83D\uDD0D',
    position: [-2.5, 1.5, 0] as [number, number, number],
  },
  {
    name: 'David',
    phaseName: 'david',
    label: 'Debate',
    color: '#8B5CF6',
    icon: '\uD83E\uDDE0',
    position: [2.5, 1.5, 0] as [number, number, number],
  },
  {
    name: 'Vex',
    phaseName: 'vex',
    label: 'Audit',
    color: '#10B981',
    icon: '\u2705',
    position: [-2.5, -1.5, 0] as [number, number, number],
  },
  {
    name: 'Elira',
    phaseName: 'elira',
    label: 'Synthesize',
    color: '#F59E0B',
    icon: '\uD83D\uDCCA',
    position: [2.5, -1.5, 0] as [number, number, number],
  },
];

const PHASE_DEFAULTS: PhaseState[] = [
  { name: 'alba', label: 'Research', status: 'pending' },
  { name: 'david', label: 'Debate', status: 'pending' },
  { name: 'vex', label: 'Audit', status: 'pending' },
  { name: 'elira', label: 'Synthesize', status: 'pending' },
];

// --- Helper: compute overall progress 0-1 ---

function computeProgress(phases: PhaseState[]): number {
  let total = 0;
  for (const p of phases) {
    if (p.status === 'done') total += 1;
    else if (p.status === 'running') total += 0.5;
  }
  return total / phases.length;
}

// --- Scene: all 3D content ---

function SwarmScene({ phases }: { phases: PhaseState[] }) {
  const progress = computeProgress(phases);
  const activeAgent = phases.find((p) => p.status === 'running')?.name || null;
  const codeGenActive = phases.every(
    (p) => p.status === 'done' || p.status === 'error',
  );

  // Build communication lines between active/done agents and the globe center
  const commLines = AGENTS.map((agent) => {
    const phase = phases.find((p) => p.name === agent.phaseName);
    return {
      from: agent.position,
      to: [0, 0, 0] as [number, number, number],
      color: agent.color,
      active:
        phase?.status === 'running' || phase?.status === 'done' || false,
    };
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <pointLight position={[0, 0, 3]} intensity={0.4} color="#6366f1" />

      {/* Globe */}
      <Globe3D />

      {/* Agent nodes */}
      {AGENTS.map((agent) => {
        const phase = phases.find((p) => p.name === agent.phaseName);
        return (
          <AgentNode
            key={agent.name}
            name={agent.name}
            label={agent.label}
            position={agent.position}
            color={agent.color}
            icon={agent.icon}
            active={phase?.status === 'running' || false}
            status={phase?.status || 'pending'}
          />
        );
      })}

      {/* Debate swarm particles around David */}
      <DebateSwarm
        position={AGENTS[1].position}
        active={activeAgent === 'david'}
      />

      {/* Communication lines */}
      <CommunicationLines lines={commLines} />

      {/* Code generation effect */}
      <CodeGeneration active={codeGenActive} progress={progress} />

      {/* Progress ring around globe */}
      <ProgressRing progress={progress} active={progress > 0} />

      {/* Camera controls - limited interaction */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI * 0.65}
        minPolarAngle={Math.PI * 0.35}
      />
    </>
  );
}

// --- Success burst effect overlay ---

function SuccessBurst({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 10,
        animation: 'globeSuccessBurst 1.5s ease-out forwards',
      }}
    >
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(16,185,129,0.6) 0%, rgba(16,185,129,0) 70%)',
          animation: 'globeSuccessExpand 1s ease-out forwards',
        }}
      />
      <div
        style={{
          position: 'absolute',
          fontSize: '28px',
          color: '#10B981',
          fontWeight: 700,
          fontFamily: 'monospace',
          textShadow: '0 0 20px rgba(16,185,129,0.8)',
        }}
      >
        &#x2713;
      </div>
    </div>
  );
}

// --- Phase status bar below canvas ---

function PhaseStatusBar({ phases }: { phases: PhaseState[] }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '1.5rem',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0.75rem 0',
      }}
    >
      {phases.map((phase, i) => {
        const agent = AGENTS.find((a) => a.phaseName === phase.name);
        const color = agent?.color || '#6b7280';
        const icon =
          phase.status === 'done'
            ? '\u2713'
            : phase.status === 'running'
              ? '\u25CF'
              : phase.status === 'error'
                ? '\u2717'
                : '\u25CB';

        return (
          <div
            key={phase.name}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span
                style={{
                  fontSize: '1rem',
                  color:
                    phase.status === 'pending' ? '#4b5563' : color,
                  fontWeight: phase.status === 'running' ? 700 : 400,
                  animation:
                    phase.status === 'running'
                      ? 'swarm-pulse 1.5s ease-in-out infinite'
                      : 'none',
                }}
              >
                {icon}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  color:
                    phase.status === 'pending' ? '#4b5563' : '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: 'monospace',
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
                  background:
                    phase.status === 'done' ? color : 'var(--border, #2a2d3a)',
                  transition: 'background 0.3s ease',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Main GlobeSwarm component ---

export default function GlobeSwarm({
  url,
  onComplete,
  onError,
}: GlobeSwarmProps) {
  const [phases, setPhases] = useState<PhaseState[]>(PHASE_DEFAULTS);
  const [showSuccess, setShowSuccess] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  const handleComplete = useCallback(
    (result: unknown) => {
      setShowSuccess(true);
      setTimeout(() => {
        onComplete(result);
      }, 1200);
    },
    [onComplete],
  );

  useEffect(() => {
    if (!url) return;

    setPhases(PHASE_DEFAULTS);
    setShowSuccess(false);

    const source = new EventSource(url);
    sourceRef.current = source;

    source.onmessage = (event) => {
      try {
        const phase = JSON.parse(event.data) as PhaseState;
        setPhases((prev) =>
          prev.map((p) =>
            p.name === phase.name ? { ...p, status: phase.status } : p,
          ),
        );
      } catch {
        // ignore malformed
      }
    };

    source.addEventListener('done', (event) => {
      try {
        const result = JSON.parse((event as MessageEvent).data);
        // Mark all phases as done
        setPhases((prev) =>
          prev.map((p) => ({ ...p, status: 'done' as const })),
        );
        handleComplete(result);
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
  }, [url, handleComplete, onError]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      {/* 3D Canvas */}
      <div
        style={{
          width: '100%',
          height: '340px',
          borderRadius: '12px',
          overflow: 'hidden',
          background:
            'radial-gradient(ellipse at center, #0f1729 0%, #0A0E27 100%)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 6.5], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: 'transparent' }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <SwarmScene phases={phases} />
          </Suspense>
        </Canvas>

        {/* Success burst overlay */}
        <SuccessBurst show={showSuccess} />
      </div>

      {/* Phase status bar */}
      <PhaseStatusBar phases={phases} />

      {/* Injected CSS animations */}
      <style>{`
        @keyframes globeSuccessBurst {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes globeSuccessExpand {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
