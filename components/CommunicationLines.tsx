'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface LineConfig {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  active: boolean;
}

interface CommunicationLinesProps {
  lines: LineConfig[];
}

function CommunicationLine({ from, to, color, active }: LineConfig) {
  const particlesRef = useRef<THREE.Points>(null);
  const phaseRef = useRef(Math.random() * Math.PI * 2);

  const { curve, curvePoints } = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 0.5,
      (from[2] + to[2]) / 2 + 0.3,
    ];
    const c = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to),
    );
    const pts = c.getPoints(50);
    const flatPts = pts.map(
      (p) => [p.x, p.y, p.z] as [number, number, number],
    );
    return { curve: c, curvePoints: flatPts };
  }, [from, to]);

  const particleGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(8 * 3);
    geom.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    );
    return geom;
  }, []);

  useFrame((_, delta) => {
    if (!active) return;
    phaseRef.current += delta * 0.5; // 2s per segment

    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < 8; i++) {
        const t = (phaseRef.current + i * 0.125) % 1;
        const point = curve.getPoint(t);
        arr[i * 3] = point.x;
        arr[i * 3 + 1] = point.y;
        arr[i * 3 + 2] = point.z;
      }
      posAttr.needsUpdate = true;
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Bezier curve line using drei Line */}
      <Line
        points={curvePoints}
        color={color}
        transparent
        opacity={0.25}
        lineWidth={1}
      />

      {/* Flowing particles */}
      <points ref={particlesRef} geometry={particleGeom}>
        <pointsMaterial
          size={0.04}
          color={color}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

export default function CommunicationLines({ lines }: CommunicationLinesProps) {
  return (
    <group>
      {lines.map((line, i) => (
        <CommunicationLine key={i} {...line} />
      ))}
    </group>
  );
}
