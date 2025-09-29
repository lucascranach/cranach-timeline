import { useRef, useEffect } from "react"
import * as THREE from "three"
import { GroupOutlineProps } from "../../types/events"
import { OUTLINE_THICKNESS } from "../../utils/eventsUtils"

const GroupOutline = ({ width, height, position, color, thickness = OUTLINE_THICKNESS }: GroupOutlineProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null)

  // Initialize material only once
  if (!materialRef.current) {
    materialRef.current = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      depthTest: false,
    })
  }

  // Clean up material on unmount
  useEffect(() => {
    const material = materialRef.current
    return () => {
      material?.dispose()
    }
  }, [])

  // Update color when prop changes
  useEffect(() => {
    materialRef.current?.color.set(color)
  }, [color])

  // Disable raycasting for outline elements
  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    group.traverse((obj) => {
      obj.raycast = () => null
    })
  }, [])

  const halfWidth = width / 2
  const halfHeight = height / 2

  return (
    <group ref={groupRef} position={position} renderOrder={1}>
      {/* Top edge */}
      <mesh position={[0, halfHeight, 0]} material={materialRef.current!}>
        <planeGeometry args={[width, thickness]} />
      </mesh>
      {/* Bottom edge */}
      <mesh position={[0, -halfHeight, 0]} material={materialRef.current!}>
        <planeGeometry args={[width, thickness]} />
      </mesh>
      {/* Left edge */}
      <mesh position={[-halfWidth, 0, 0]} material={materialRef.current!}>
        <planeGeometry args={[thickness, height]} />
      </mesh>
      {/* Right edge */}
      <mesh position={[halfWidth, 0, 0]} material={materialRef.current!}>
        <planeGeometry args={[thickness, height]} />
      </mesh>
    </group>
  )
}

export default GroupOutline
