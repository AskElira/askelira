'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Globe3D() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * ((2 * Math.PI) / 30); // 1 cycle per 30s
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= delta * 0.05;
    }
  });

  return (
    <group>
      {/* Main globe sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial
          color="#1E40AF"
          emissive="#1E40AF"
          emissiveIntensity={0.15}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>

      {/* Continent-like patches using a second sphere with wireframe */}
      <mesh ref={glowRef} scale={1.505}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color="#059669"
          emissive="#059669"
          emissiveIntensity={0.1}
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Atmosphere glow - inner */}
      <mesh scale={1.08}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial
          color="#3B82F6"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Atmosphere glow - outer */}
      <mesh scale={1.2}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial
          color="#6366f1"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Grid lines on globe surface */}
      <mesh rotation={[0, 0, 0]} scale={1.502}>
        <sphereGeometry args={[1.5, 24, 12]} />
        <meshBasicMaterial
          color="#60A5FA"
          wireframe
          transparent
          opacity={0.06}
        />
      </mesh>
    </group>
  );
}
