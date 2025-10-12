import { useRef, useEffect, useMemo } from "react"
import * as THREE from "three"
import { GroupOutlineProps } from "../../types/events"
import { OUTLINE_THICKNESS } from "../../utils/eventsUtils"

const GroupOutline = ({ width, height, position, color, thickness = OUTLINE_THICKNESS }: GroupOutlineProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null)
  const geometryRef = useRef<THREE.ShapeGeometry | null>(null)

  // Initialize material only once
  if (!materialRef.current) {
    // Derive a darker color from the provided color for a subtle dark background
    const darkColor = new THREE.Color(color as THREE.ColorRepresentation)
    darkColor.multiplyScalar(0.25)

    materialRef.current = new THREE.MeshBasicMaterial({
      color: darkColor,
      transparent: true,
      opacity: 0.3,
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
    if (!materialRef.current) return
    const darkColor = new THREE.Color(color as THREE.ColorRepresentation)
    darkColor.multiplyScalar(0.25)
    materialRef.current.color.set(darkColor)
  }, [color])

  // Disable raycasting for outline elements
  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    group.traverse((obj) => {
      obj.raycast = () => null
    })
  }, [])

  // Create a rounded-rectangle shape geometry (centered at 0,0)
  const shapeGeometry = useMemo(() => {
    const rMax = Math.min(width, height) / 2
    // Choose a pleasant corner radius relative to size
    const r = Math.min(rMax, Math.max(0, Math.min(width, height) * 10.25))
    const shape = new THREE.Shape()
    const x = -width / 2
    const y = -height / 2

    shape.moveTo(x + r, y)
    shape.lineTo(x + width - r, y)
    shape.quadraticCurveTo(x + width, y, x + width, y + r)
    shape.lineTo(x + width, y + height - r)
    shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    shape.lineTo(x + r, y + height)
    shape.quadraticCurveTo(x, y + height, x, y + height - r)
    shape.lineTo(x, y + r)
    shape.quadraticCurveTo(x, y, x + r, y)

    const geom = new THREE.ShapeGeometry(shape)
    geometryRef.current = geom
    return geom
  }, [width, height])

  // Dispose previous geometry on unmount or when deps change
  useEffect(() => {
    const geom = geometryRef.current
    return () => {
      geom?.dispose()
    }
  }, [shapeGeometry])

  return (
    <group ref={groupRef} position={position} renderOrder={0}>
      <mesh material={materialRef.current!}>
        <primitive object={shapeGeometry} attach="geometry" />
      </mesh>
    </group>
  )
}

export default GroupOutline
