import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * CameraPlane
 * Renders a plane that is fixed relative to the camera (like a HUD element) using world-space syncing.
 * - Always faces camera (copy quaternion)
 * - Sticks to camera position with an optional offset
 * - depthTest disabled so it renders on top (optionally set depthWrite false)
 */
export interface CameraPlaneProps {
  /** World units offset from camera */
  offset?: [x: number, y: number, z: number]
  /** Size of plane in world units */
  size?: [w: number, h: number]
  /** Material color */
  color?: string | number
  /** Opacity of the plane */
  opacity?: number
  /** Whether to render behind (enable depthTest) */
  depthTest?: boolean
}

const CameraPlane = ({
  offset = [0, 0, -10],
  size = [10, 4],
  color = '#ffffff',
  opacity = 0.1,
  depthTest = false,
}: CameraPlaneProps) => {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(() => {
    if (!groupRef.current) return
    // Position plane relative to camera
    const [ox, oy, oz] = offset
    groupRef.current.position.set(camera.position.x + ox, camera.position.y + oy, camera.position.z + oz)
    // Match orientation so it's always facing the camera
    groupRef.current.quaternion.copy(camera.quaternion)
  })

  useEffect(() => {
    if (matRef.current) {
      matRef.current.needsUpdate = true
    }
  }, [color, opacity, depthTest])

  return (
    <group ref={groupRef} renderOrder={9999}>
      <mesh>
        <planeGeometry args={size} />
        <meshBasicMaterial
          ref={matRef}
          color={color as any}
            transparent
            opacity={opacity}
            depthTest={depthTest}
            depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export default CameraPlane
