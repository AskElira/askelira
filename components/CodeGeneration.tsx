'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface CodeGenerationProps {
  active: boolean;
  progress: number; // 0-1
}

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789{}[]();=></.#@$%&*';

function MatrixColumn({ x, z, speed, delay }: { x: number; z: number; speed: number; delay: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);

  const chars = useMemo(() => {
    const count = 6 + Math.floor(Math.random() * 6);
    return Array.from({ length: count }, () =>
      CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
    );
  }, []);

  useFrame((_, delta) => {
    phaseRef.current += delta;
    if (groupRef.current) {
      // Falling motion
      const t = Math.max(0, phaseRef.current - delay);
      const yOffset = (t * speed) % 4;
      groupRef.current.position.y = 2 - yOffset;
      // Fade based on position
      groupRef.current.visible = phaseRef.current > delay;
    }
  });

  return (
    <group ref={groupRef} position={[x, 2, z]}>
      {chars.map((char, i) => (
        <Html
          key={i}
          position={[0, -i * 0.18, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <span
            style={{
              fontFamily: '"Courier New", monospace',
              fontSize: '9px',
              color: i === 0 ? '#ffffff' : '#10B981',
              opacity: Math.max(0.2, 1 - i * 0.12),
              textShadow: '0 0 4px #10B981',
            }}
          >
            {char}
          </span>
        </Html>
      ))}
    </group>
  );
}

function CodeBlock({ position, scale, delay }: { position: [number, number, number]; scale: number; delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);

  useFrame((_, delta) => {
    phaseRef.current += delta;
    if (meshRef.current) {
      const t = Math.max(0, phaseRef.current - delay);
      const appear = Math.min(t * 2, 1);
      meshRef.current.scale.setScalar(scale * appear);
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.12, 0.12, 0.12]} />
      <meshStandardMaterial
        color="#10B981"
        emissive="#10B981"
        emissiveIntensity={0.5}
        transparent
        opacity={0.7}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

export default function CodeGeneration({ active, progress }: CodeGenerationProps) {
  const columns = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        x: (Math.random() - 0.5) * 4,
        z: (Math.random() - 0.5) * 2 - 1,
        speed: 0.5 + Math.random() * 0.8,
        delay: i * 0.3,
      })),
    [],
  );

  const blocks = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        position: [
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1,
          (Math.random() - 0.5) * 1.5,
        ] as [number, number, number],
        scale: 0.5 + Math.random() * 0.8,
        delay: i * 0.4 + 1,
      })),
    [],
  );

  if (!active) return null;

  const visibleBlocks = Math.floor(progress * blocks.length);

  return (
    <group position={[0, -0.5, 0]}>
      {/* Matrix-style columns */}
      {columns.map((col, i) => (
        <MatrixColumn key={`col-${i}`} {...col} />
      ))}

      {/* 3D code blocks assembling */}
      {blocks.slice(0, visibleBlocks).map((block, i) => (
        <CodeBlock key={`block-${i}`} {...block} />
      ))}
    </group>
  );
}
