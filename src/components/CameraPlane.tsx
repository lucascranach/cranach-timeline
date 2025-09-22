import { useThree, useFrame } from "@react-three/fiber"
import { useEffect, useRef, useMemo } from "react"
import { useControls } from "leva"
import * as THREE from "three"

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
  offset: offsetProp,
  size: sizeProp,
  color: colorProp,
  opacity: opacityProp,
  depthTest: depthTestProp,
}: CameraPlaneProps) => {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)

  // Leva controls (namespaced to avoid collisions)
  const controlValues = useControls("CameraPlane", {
    offset: {
      value: (offsetProp ?? [0, 0, -10]) as [number, number, number],
      label: "Offset",
      step: 0.1,
    },
    width: {
      value: sizeProp?.[0] ?? 10,
      min: 0.1,
      max: 1000,
      step: 0.1,
    },
    height: {
      value: sizeProp?.[1] ?? 49.1,
      min: 0.1,
      max: 100,
      step: 0.1,
    },
    color: (typeof colorProp === "string" ? colorProp : "#ffffff") ?? "#ffffff",
    opacity: {
      value: opacityProp ?? 0.1,
      min: 0,
      max: 1,
      step: 0.01,
    },
    depthTest: {
      value: depthTestProp ?? false,
      label: "Depth Test",
    },
  }) as unknown as {
    offset: [number, number, number]
    width: number
    height: number
    color: string
    opacity: number
    depthTest: boolean
  }

  const { offset, width, height, color, opacity, depthTest } = controlValues
  const size: [number, number] = useMemo(() => [width, height], [width, height])

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
