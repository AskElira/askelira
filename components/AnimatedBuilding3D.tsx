'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import type { FloorState, AgentActivity } from '@/hooks/useBuilding';

// ---------------------------------------------------------------------------
// Error Boundary -- catches Three.js / WebGL crashes
// ---------------------------------------------------------------------------

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class Building3DErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || 'Rendering error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100%',
            height: '400px',
            background: 'var(--panel)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '2rem' }}>&#9888;</span>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
            3D view could not render
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.75rem', maxWidth: '300px', textAlign: 'center' }}>
            {this.state.errorMessage}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            style={{
              padding: '0.375rem 0.75rem',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '0.375rem',
              color: 'var(--accent)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Agent3D {
  id: string;
  name: string;
  color: string;
  currentFloor: number;
  targetFloor: number;
  action: string;
  position: THREE.Vector3;
  active: boolean;
}

interface AnimatedBuilding3DProps {
  floors: FloorState[];
  activities: AgentActivity[];
  goalId: string;
}

// ---------------------------------------------------------------------------
// Agent colors
// ---------------------------------------------------------------------------

const AGENT_COLORS: Record<string, string> = {
  Alba: '#4ade80',
  David: '#2dd4bf',
  Vex: '#f87171',
  Elira: '#a78bfa',
  Steven: '#facc15',
  System: '#6b7280',
};

function getAgentColor(agent: string): string {
  return AGENT_COLORS[agent] ?? AGENT_COLORS.System;
}

// ---------------------------------------------------------------------------
// Floor colors by status
// ---------------------------------------------------------------------------

const FLOOR_COLORS: Record<FloorState['status'], string> = {
  pending: '#374151',
  researching: '#3b82f6',
  building: '#2dd4bf',
  auditing: '#f59e0b',
  live: '#22c55e',
  broken: '#ef4444',
  blocked: '#f87171',
};

// ---------------------------------------------------------------------------
// Animated Agent Component
// ---------------------------------------------------------------------------

interface AnimatedAgentProps {
  agent: Agent3D;
  floorHeight: number;
}

function AnimatedAgent({ agent, floorHeight }: AnimatedAgentProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (!meshRef.current) return;

    // Smooth transition to target floor
    const targetY = agent.targetFloor * floorHeight + floorHeight / 2;
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      targetY,
      0.05
    );

    // Gentle bobbing animation
    if (agent.active) {
      meshRef.current.position.y += Math.sin(Date.now() * 0.003) * 0.05;
    }

    // Rotation animation
    meshRef.current.rotation.y += agent.active ? 0.02 : 0.005;
  });

  return (
    <group position={agent.position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.2 : 1}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={agent.color}
          emissive={agent.color}
          emissiveIntensity={agent.active ? 0.5 : 0.2}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Pulsing ring for active agents */}
      {agent.active && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <ringGeometry args={[0.4, 0.5, 32]} />
          <meshBasicMaterial
            color={agent.color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Agent name label */}
      {hovered && (
        <Html distanceFactor={10}>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: agent.color,
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: `1px solid ${agent.color}`,
              pointerEvents: 'none',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div>{agent.name}</div>
            <div style={{ fontSize: '0.625rem', opacity: 0.8, marginTop: '0.125rem' }}>
              {agent.action}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Floor Component
// ---------------------------------------------------------------------------

interface Floor3DProps {
  floor: FloorState;
  index: number;
  floorHeight: number;
  isActive: boolean;
}

function Floor3D({ floor, index, floorHeight, isActive }: Floor3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (!meshRef.current) return;

    // Gentle glow for active floor
    if (isActive) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.002) * 0.1;
    }
  });

  const floorColor = FLOOR_COLORS[floor.status] ?? '#374151';
  const yPosition = index * floorHeight;

  return (
    <group position={[0, yPosition, 0]}>
      {/* Floor platform */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[6, 0.2, 6]} />
        <meshStandardMaterial
          color={floorColor}
          emissive={floorColor}
          emissiveIntensity={isActive ? 0.3 : 0.1}
          transparent
          opacity={hovered ? 0.9 : 0.7}
        />
      </mesh>

      {/* Floor walls (glass effect) */}
      <mesh position={[0, floorHeight / 2, 0]}>
        <boxGeometry args={[6, floorHeight - 0.2, 6]} />
        <meshPhysicalMaterial
          color="#1a1a2e"
          transparent
          opacity={0.15}
          roughness={0.1}
          metalness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floor number text */}
      <Text
        position={[-3.2, floorHeight / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.5}
        color={floorColor}
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        F{floor.floorNumber}
      </Text>

      {/* Floor name */}
      <Text
        position={[0, floorHeight / 2, 3.2]}
        rotation={[0, 0, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={5}
        textAlign="center"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {floor.name}
      </Text>

      {/* Status indicator light */}
      <mesh position={[3.2, floorHeight / 2, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color={floorColor} />
        <pointLight color={floorColor} intensity={2} distance={3} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Building Scene Component
// ---------------------------------------------------------------------------

interface BuildingSceneProps {
  floors: FloorState[];
  agents: Agent3D[];
  floorHeight: number;
}

function BuildingScene({ floors, agents, floorHeight }: BuildingSceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Find active floor index
  const activeFloorIndex = floors.findIndex(
    (f) => f.status === 'researching' || f.status === 'building' || f.status === 'auditing'
  );

  useEffect(() => {
    if (groupRef.current) {
      // Animate building entrance
      gsap.from(groupRef.current.position, {
        y: -20,
        duration: 1.5,
        ease: 'power3.out',
      });
    }
  }, []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4a90e2" />
      <spotLight
        position={[0, 20, 0]}
        angle={0.5}
        penumbra={1}
        intensity={0.5}
        castShadow
      />

      {/* Building group */}
      <group ref={groupRef}>
        {/* Floors */}
        {floors.map((floor, i) => (
          <Floor3D
            key={floor.id}
            floor={floor}
            index={i}
            floorHeight={floorHeight}
            isActive={i === activeFloorIndex}
          />
        ))}

        {/* Agents */}
        {agents.map((agent) => (
          <AnimatedAgent
            key={agent.id}
            agent={agent}
            floorHeight={floorHeight}
          />
        ))}

        {/* Central pillar */}
        {floors.length > 0 && (
        <mesh position={[0, (floors.length * floorHeight) / 2, 0]}>
          <cylinderGeometry args={[0.3, 0.3, Math.max(floors.length * floorHeight, 0.1), 8]} />
          <meshStandardMaterial
            color="#2a2d3a"
            metalness={0.8}
            roughness={0.2}
            emissive="#4a90e2"
            emissiveIntensity={0.1}
          />
        </mesh>
        )}

        {/* Ground platform */}
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <cylinderGeometry args={[8, 8, 0.5, 32]} />
          <meshStandardMaterial
            color="#1a1a2e"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
      </group>

      {/* Grid helper */}
      <gridHelper args={[20, 20, '#2a2d3a', '#1a1a2e']} position={[0, -0.75, 0]} />

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function AnimatedBuilding3DInner({
  floors,
  activities,
  goalId,
}: AnimatedBuilding3DProps) {
  const floorHeight = 3;
  const safeFloors = Array.isArray(floors) ? floors : [];

  // Convert activities to 3D agents
  const agents = useMemo<Agent3D[]>(() => {
    if (!activities || activities.length === 0) return [];
    const agentMap = new Map<string, Agent3D>();
    const recentActivities = activities.slice(0, 10);
    const count = recentActivities.length || 1; // avoid division by zero

    recentActivities.forEach((activity, index) => {
      if (!activity || !activity.agent || agentMap.has(activity.agent)) return;
      {
        const floorIndex = activity.iteration ? activity.iteration - 1 : 0;
        const angle = (index / count) * Math.PI * 2;
        const radius = 2.5;

        agentMap.set(activity.agent, {
          id: activity.agent,
          name: activity.agent,
          color: getAgentColor(activity.agent),
          currentFloor: floorIndex,
          targetFloor: floorIndex,
          action: activity.action,
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
          ),
          active: index === 0, // Most recent activity is active
        });
      }
    });

    return Array.from(agentMap.values());
  }, [activities]);

  return (
    <div
      style={{
        width: '100%',
        height: '600px',
        background: 'linear-gradient(to bottom, #0a0a0f, #1a1a2e)',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        position: 'relative',
      }}
    >
      {/* Controls hint */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: '#9ca3af',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#fff' }}>
          Building View
        </div>
        <div>🖱️ Drag to rotate • Scroll to zoom • Right-click to pan</div>
      </div>

      {/* Building stats */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: '#9ca3af',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
          Building Status
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div>
            <span style={{ color: '#22c55e' }}>●</span> Floors: {safeFloors.length}
          </div>
          <div>
            <span style={{ color: '#2dd4bf' }}>●</span> Agents: {agents.length}
          </div>
          <div>
            <span style={{ color: '#a78bfa' }}>●</span> Live:{' '}
            {safeFloors.filter((f) => f.status === 'live').length}
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{
          position: [15, 15, 15],
          fov: 50,
        }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <BuildingScene
          floors={safeFloors}
          agents={agents}
          floorHeight={floorHeight}
        />
      </Canvas>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported component wrapped in error boundary
// ---------------------------------------------------------------------------

export default function AnimatedBuilding3D(props: AnimatedBuilding3DProps) {
  return (
    <Building3DErrorBoundary>
      <AnimatedBuilding3DInner {...props} />
    </Building3DErrorBoundary>
  );
}
