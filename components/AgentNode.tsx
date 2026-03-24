'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface AgentNodeProps {
  name: string;
  label: string;
  position: [number, number, number];
  color: string;
  icon: string;
  active: boolean;
  status: 'pending' | 'running' | 'done' | 'error';
}

export default function AgentNode({
  name,
  label,
  position,
  color,
  icon,
  active,
  status,
}: AgentNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const phaseRef = useRef(0);

  useFrame((_, delta) => {
    phaseRef.current += delta;

    if (meshRef.current) {
      // Pulse scale when active
      if (active) {
        const pulse = 1 + Math.sin(phaseRef.current * 3) * 0.15;
        meshRef.current.scale.setScalar(pulse);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }

    if (pulseRef.current) {
      if (active) {
        const ringScale = 1 + ((phaseRef.current * 0.5) % 1) * 0.8;
        const ringOpacity = 1 - ((phaseRef.current * 0.5) % 1);
        pulseRef.current.scale.setScalar(ringScale);
        (pulseRef.current.material as THREE.MeshBasicMaterial).opacity =
          ringOpacity * 0.3;
      } else {
        (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }

    // Gentle floating motion
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(phaseRef.current * 0.8 + position[0]) * 0.05;
    }
  });

  const nodeColor = new THREE.Color(color);
  const dimColor = new THREE.Color(color).multiplyScalar(0.3);
  const currentColor = status === 'pending' ? dimColor : nodeColor;

  return (
    <group ref={groupRef} position={position}>
      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial
          color={currentColor}
          emissive={currentColor}
          emissiveIntensity={active ? 0.8 : status === 'done' ? 0.4 : 0.1}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Pulse ring */}
      <mesh ref={pulseRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.28, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Point light when active */}
      {active && <pointLight color={color} intensity={1.5} distance={3} />}

      {/* Status icon */}
      <Html
        position={[0, 0.35, 0]}
        center
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          style={{
            fontSize: '16px',
            filter: active ? 'brightness(1.5)' : 'brightness(0.6)',
            transition: 'filter 0.3s',
          }}
        >
          {icon}
        </div>
      </Html>

      {/* Label */}
      <Html
        position={[0, -0.35, 0]}
        center
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          style={{
            fontSize: '10px',
            color: active ? color : '#6b7280',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
            transition: 'color 0.3s',
          }}
        >
          {name}
        </div>
      </Html>

      {/* Tooltip on hover */}
      {hovered && (
        <Html position={[0, 0.55, 0]} center>
          <div
            style={{
              background: 'rgba(10, 14, 39, 0.95)',
              border: `1px solid ${color}`,
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              color: '#e5e7eb',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
            }}
          >
            {label} — {status}
          </div>
        </Html>
      )}

      {/* Done checkmark */}
      {status === 'done' && (
        <Html
          position={[0.2, 0.2, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div style={{ fontSize: '10px', color: '#4ade80' }}>✓</div>
        </Html>
      )}
    </group>
  );
}
