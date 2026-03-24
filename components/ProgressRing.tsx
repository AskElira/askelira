'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface ProgressRingProps {
  progress: number; // 0-1
  active: boolean;
}

export default function ProgressRing({ progress, active }: ProgressRingProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const bgRingRef = useRef<THREE.Mesh>(null);

  // Create ring geometry based on progress
  const ringGeom = useMemo(() => {
    const angle = Math.max(0.01, progress * Math.PI * 2);
    return new THREE.RingGeometry(2.1, 2.2, 64, 1, 0, angle);
  }, [progress]);

  const bgRingGeom = useMemo(() => {
    return new THREE.RingGeometry(2.1, 2.2, 64);
  }, []);

  useFrame((_, delta) => {
    if (ringRef.current && active) {
      ringRef.current.rotation.z -= delta * 0.1;
    }
  });

  // Gradient color: blue → green based on progress
  const ringColor = useMemo(() => {
    const blue = new THREE.Color('#3B82F6');
    const green = new THREE.Color('#10B981');
    return blue.lerp(green, progress);
  }, [progress]);

  if (!active && progress === 0) return null;

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Background ring (dim) */}
      <mesh ref={bgRingRef} geometry={bgRingGeom}>
        <meshBasicMaterial
          color="#1e293b"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Progress ring */}
      <mesh ref={ringRef} geometry={ringGeom}>
        <meshBasicMaterial
          color={ringColor}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Percentage text */}
      <Html position={[0, 0, 0.1]} center style={{ pointerEvents: 'none' }}>
        <div
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: `#${ringColor.getHexString()}`,
            fontFamily: 'monospace',
            textShadow: `0 0 10px #${ringColor.getHexString()}`,
            userSelect: 'none',
          }}
        >
          {Math.round(progress * 100)}%
        </div>
      </Html>
    </group>
  );
}
