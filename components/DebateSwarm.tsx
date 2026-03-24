'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DebateSwarmProps {
  position: [number, number, number];
  active: boolean;
  particleCount?: number;
}

export default function DebateSwarm({
  position,
  active,
  particleCount = 16,
}: DebateSwarmProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const phaseRef = useRef(0);

  const { geometry, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.15 + Math.random() * 0.4;
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      if (i < particleCount / 2) {
        colors[i3] = 0.9; colors[i3 + 1] = 0.2; colors[i3 + 2] = 0.2;
      } else {
        colors[i3] = 0.2; colors[i3 + 1] = 0.3; colors[i3 + 2] = 0.9;
      }

      vel[i3] = (Math.random() - 0.5) * 2;
      vel[i3 + 1] = (Math.random() - 0.5) * 2;
      vel[i3 + 2] = (Math.random() - 0.5) * 2;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { geometry: geom, velocities: vel };
  }, [particleCount]);

  useFrame((_, delta) => {
    if (!active || !pointsRef.current) return;
    phaseRef.current += delta;

    const posAttr = pointsRef.current.geometry.attributes
      .position as THREE.BufferAttribute;
    const colAttr = pointsRef.current.geometry.attributes
      .color as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;
    const t = phaseRef.current;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const convergeFactor = Math.min(t / 8, 1);
      const orbitSpeed = 1 + i * 0.1;
      const orbitRadius = 0.4 * (1 - convergeFactor * 0.6);

      posArr[i3] =
        orbitRadius *
        Math.sin(t * orbitSpeed + velocities[i3]) *
        Math.cos(t * 0.5 + velocities[i3 + 1]);
      posArr[i3 + 1] =
        orbitRadius *
        Math.sin(t * orbitSpeed * 0.7 + velocities[i3 + 1]) *
        Math.sin(t * 0.3 + velocities[i3 + 2]);
      posArr[i3 + 2] =
        orbitRadius * Math.cos(t * orbitSpeed * 0.5 + velocities[i3 + 2]);

      const colorPhase = (Math.sin(t * 0.8 + i * 0.5) + 1) / 2;
      const mergeAmount = convergeFactor;

      colArr[i3] = THREE.MathUtils.lerp(0.9, 0.55, mergeAmount) * (1 - colorPhase * 0.3);
      colArr[i3 + 1] = THREE.MathUtils.lerp(0.2, 0.35, mergeAmount);
      colArr[i3 + 2] = THREE.MathUtils.lerp(0.2, 0.96, colorPhase * (1 - mergeAmount * 0.5));
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <group position={position}>
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
