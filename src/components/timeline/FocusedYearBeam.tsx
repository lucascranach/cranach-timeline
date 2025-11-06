import { useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useSidebarGallery } from "@/hooks/useSidebarGalleryContext"

interface FocusedYearBeamProps {
  yearPositions: Record<string, number>
}

/**
 * FocusedYearBeam - Renders a vertical beam at the focused year position
 */
const FocusedYearBeam = ({ yearPositions }: FocusedYearBeamProps) => {
  const { camera } = useThree()
  const { focusedYearData } = useSidebarGallery()
  const beamRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!beamRef.current || !focusedYearData || !yearPositions) return

    const focusedYearString = String(focusedYearData.year)
    const xPosition = yearPositions[focusedYearString]

    if (xPosition !== undefined) {
      beamRef.current.position.x = xPosition
      // Keep beam centered vertically with the camera
      beamRef.current.position.y = camera.position.y
    }
  })

  if (!focusedYearData) return null

  return (
    <mesh ref={beamRef} position={[0, 0, -1]}>
      <planeGeometry args={[0.3, 100]} />
      <meshBasicMaterial color="#feb701" transparent opacity={0.15} depthTest={false} depthWrite={false} />
    </mesh>
  )
}

export default FocusedYearBeam
