'use client';

// ---------------------------------------------------------------------------
// BlueprintBuilding -- 3D building visualization for onboard blueprint step
// No Socket.io, no API calls. Pure presentational component driven by props.
// ---------------------------------------------------------------------------

import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlueprintBuildingProps {
  floorCount: number;
  revealedCount: number;
}

// ---------------------------------------------------------------------------
// Individual floor box
// ---------------------------------------------------------------------------

function FloorBox({
  index,
  total,
  revealed,
}: {
  index: number;
  total: number;
  revealed: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetScale = revealed ? 1 : 0;
  const currentScale = useRef(0);

  // Floor colors from bottom to top: darker to lighter
  const hue = 0.65 + (index / Math.max(total - 1, 1)) * 0.1; // blue to violet range
  const saturation = 0.5;
  const lightness = 0.25 + (index / Math.max(total - 1, 1)) * 0.2;
  const color = new THREE.Color().setHSL(hue, saturation, lightness);

  useFrame(() => {
    if (!meshRef.current) return;
    // Smooth spring-like animation toward target
    currentScale.current += (targetScale - currentScale.current) * 0.08;
    meshRef.current.scale.set(1, currentScale.current, 1);

    // Only show if scale > 0.01
    meshRef.current.visible = currentScale.current > 0.01;
  });

  const y = index * 0.55 - ((total - 1) * 0.55) / 2;

  return (
    <mesh ref={meshRef} position={[0, y, 0]} scale={[1, 0, 1]}>
      <boxGeometry args={[1.8, 0.4, 1.2]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.85}
        roughness={0.4}
        metalness={0.3}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Orbiting gold sphere (Elira indicator)
// ---------------------------------------------------------------------------

function EliraOrb({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const angle = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current || !active) return;
    angle.current += delta * 1.5;
    meshRef.current.position.set(
      Math.cos(angle.current) * 1.6,
      Math.sin(angle.current * 0.7) * 0.8,
      Math.sin(angle.current) * 1.6,
    );
  });

  if (!active) return null;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        color="#facc15"
        emissive="#facc15"
        emissiveIntensity={0.8}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

function BuildingScene({ floorCount, revealedCount }: BlueprintBuildingProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 4]} intensity={0.6} />
      <pointLight position={[0, 2, 3]} intensity={0.3} color="#6366f1" />

      {Array.from({ length: floorCount }, (_, i) => (
        <FloorBox
          key={i}
          index={i}
          total={floorCount}
          revealed={i < revealedCount}
        />
      ))}

      <EliraOrb active={revealedCount > 0} />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI * 0.65}
        minPolarAngle={Math.PI * 0.35}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Exported component (to be wrapped in dynamic() import with ssr: false)
// ---------------------------------------------------------------------------

export default function BlueprintBuilding({
  floorCount,
  revealedCount,
}: BlueprintBuildingProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '280px',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        background:
          'radial-gradient(ellipse at center, #0f1729 0%, #0A0E27 100%)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
      }}
    >
      <Canvas
        camera={{ position: [0, 1, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <BuildingScene
            floorCount={floorCount}
            revealedCount={revealedCount}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
