
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { useAtom } from 'jotai'
import { cranachElderEvents } from '../store/atoms'
import { useMemo } from 'react'

function TimelinePoints({ data }) {
  // Map dates to X positions (spread out evenly or by date)
  const points = useMemo(() => {
    if (!data || data.length === 0) return []
    // Spread by date
    const minDate = Math.min(...data.map(d => new Date(d.startDate).getTime()))
    const maxDate = Math.max(...data.map(d => new Date(d.startDate).getTime()))
    const range = maxDate - minDate || 1
    return data.map((d, i) => {
      const t = (new Date(d.startDate).getTime() - minDate) / range
      return {
        ...d,
        x: t * 20 - 10, // spread on X from -10 to 10
        y: 0,
        z: 0,
        year: new Date(d.startDate).getFullYear()
      }
    })
  }, [data])

  return (
    <group>
      {points.map((pt, i) => (
        <group key={i} position={[pt.x, pt.y, pt.z]}>
          <mesh>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#255982" />
          </mesh>
          {/* Year label above the point */}
          <Html center position={[0, 0.5, 0]}>
            <div style={{ color: '#222', fontSize: 14, textAlign: 'center', pointerEvents: 'none' }}>
              {pt.year}
            </div>
          </Html>
          {/* Tooltip on hover */}
          <Html center position={[0, -0.5, 0]}>
            <div style={{ color: '#555', fontSize: 12, textAlign: 'center', pointerEvents: 'none' }}>
              {pt.description}
            </div>
          </Html>
        </group>
      ))}
      {/* Timeline line */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 20, 16]} />
        <meshStandardMaterial color="#888" />
      </mesh>
    </group>
  )
}

export default function TimelineR3F() {
  const [data] = useAtom(cranachElderEvents)

  return (
    <div style={{ width: '100vw', height: '60vh', background: '#fff' }}>
      <Canvas camera={{ position: [0, 5, 20], fov: 50 }}>
        <ambientLight />
        <directionalLight position={[0, 10, 10]} intensity={0.5} />
        {data && <TimelinePoints data={data} />}
        <OrbitControls enablePan enableZoom enableRotate={false} />
      </Canvas>
    </div>
  )
}