// InsightFlow 3D hero — a slow, liquid flow of brand-coloured blobs that drift
// and react to the pointer/tilt. Loaded as its OWN lazy chunk (three + R3F are
// ~heavy) so it never blocks first paint: Entry shows the brand gradient
// instantly and swaps this canvas in once it arrives. Kept deliberately light
// — three translucent distorted icosahedra, no shadows, capped DPR.

import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'
import { useRef } from 'react'
import type { Group, Mesh } from 'three'

interface BlobProps {
  color: string
  position: [number, number, number]
  scale: number
  speed: number
  distort: number
}

function Blob({ color, position, scale, speed, distort }: BlobProps) {
  const ref = useRef<Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.rotation.x = t * 0.12 * speed
    ref.current.rotation.y = t * 0.16 * speed
  })
  return (
    <Float speed={1.3} rotationIntensity={0.5} floatIntensity={0.9}>
      <mesh ref={ref} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 8]} />
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          roughness={0.25}
          metalness={0.15}
          distort={distort}
          speed={2}
          transparent
          opacity={0.92}
        />
      </mesh>
    </Float>
  )
}

/** Parallax rig: eases the whole group toward the pointer for a "tilt" feel. */
function Rig() {
  const group = useRef<Group>(null)
  useFrame((state) => {
    if (!group.current) return
    const targetY = state.pointer.x * 0.4
    const targetX = -state.pointer.y * 0.3
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.05
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.05
  })
  return (
    <group ref={group}>
      <Blob color="#6366f1" position={[-0.7, 0.35, 0]} scale={1.35} speed={1} distort={0.45} />
      <Blob color="#a855f7" position={[0.9, -0.2, -0.6]} scale={1.0} speed={1.2} distort={0.5} />
      <Blob color="#22d3ee" position={[0.25, -0.9, 0.4]} scale={0.7} speed={0.8} distort={0.4} />
    </group>
  )
}

export default function EntryScene3D() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4.2], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 4]} intensity={2.2} color="#c4b5fd" />
      <pointLight position={[-4, -2, -2]} intensity={1.4} color="#22d3ee" />
      <Rig />
    </Canvas>
  )
}
