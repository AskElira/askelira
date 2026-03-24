'use client';

import { useEffect, useRef } from 'react';

interface SwarmAnimationProps {
  size?: number;
  particleCount?: number;
  active?: boolean;
}

export default function SwarmAnimation({
  size = 120,
  particleCount = 24,
  active = true,
}: SwarmAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const particles: HTMLDivElement[] = [];
    const center = size / 2;

    for (let i = 0; i < particleCount; i++) {
      const dot = document.createElement('div');
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 20 + Math.random() * (center - 30);
      const dotSize = 3 + Math.random() * 3;
      const duration = 2 + Math.random() * 3;
      const delay = Math.random() * -duration;

      dot.style.cssText = `
        position: absolute;
        width: ${dotSize}px;
        height: ${dotSize}px;
        border-radius: 50%;
        background: var(--accent);
        opacity: 0.6;
        left: ${center + Math.cos(angle) * radius}px;
        top: ${center + Math.sin(angle) * radius}px;
        animation: swarm-orbit ${duration}s ease-in-out ${delay}s infinite;
      `;
      container.appendChild(dot);
      particles.push(dot);
    }

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, [active, size, particleCount]);

  return (
    <>
      <style>{`
        @keyframes swarm-orbit {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          25% { transform: translate(${8 + Math.random() * 8}px, ${-6 - Math.random() * 6}px); opacity: 0.8; }
          50% { transform: translate(${-4 - Math.random() * 8}px, ${10 + Math.random() * 6}px); opacity: 0.6; }
          75% { transform: translate(${6 + Math.random() * 6}px, ${4 + Math.random() * 4}px); opacity: 0.9; }
        }
        @keyframes swarm-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: size,
          height: size,
          margin: '0 auto',
        }}
      >
        {/* Central glow */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '0 0 20px var(--accent-glow)',
            animation: active ? 'swarm-pulse 2s ease-in-out infinite' : 'none',
          }}
        />
      </div>
    </>
  );
}
