import { useRef, useEffect } from "react"
import * as THREE from "three/webgpu"
import * as TSL from "three/tsl"
import { Canvas, extend, useFrame, useThree, type ThreeToJSXElements } from "@react-three/fiber"
import { Center, MapControls, OrbitControls, OrthographicCamera, PerspectiveCamera, useGLTF } from "@react-three/drei"
import { Text } from "@react-three/drei"

import Experience from "./Experience"

declare module "@react-three/fiber" {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

extend(THREE as any)

// Custom controls component to handle horizontal-only scrolling (mouse wheel) and panning (drag)
const TimelineControls = () => {
  const { camera, gl } = useThree()
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const initialY = camera.position.y
    const initialTargetY = controls.target.y

    // Adjustable scroll speed (world units per wheel delta unit)
    const SCROLL_SPEED = 0.04

    const handleWheel = (event: WheelEvent) => {
      // Allow cmd/ctrl + scroll for browser shortcuts, otherwise hijack
      if (event.metaKey || event.ctrlKey) return
      event.preventDefault()
      event.stopPropagation()

      // Use deltaY for horizontal move (invert if desired). Shift+scroll can naturally be horizontal in some OS; unify here.
      const raw = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      const deltaX = raw * SCROLL_SPEED

      camera.position.x += deltaX
      controls.target.x += deltaX

      // Lock Y axes
      camera.position.y = initialY
      controls.target.y = initialTargetY

      controls.update()
    }

    const canvas = gl.domElement
    canvas.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      canvas.removeEventListener("wheel", handleWheel as any)
    }
  }, [gl, camera])

  return (
    <MapControls
      ref={controlsRef}
      enableRotate={false}
      enablePan={true}
      enableZoom={false}
      enableDamping={false}
      panSpeed={1}
      screenSpacePanning={false}
      minPolarAngle={Math.PI / 2}
      maxPolarAngle={Math.PI / 2}
      minAzimuthAngle={0}
      maxAzimuthAngle={0}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.PAN,
      }}
      listenToKeyEvents={false}
    />
  )
}

const Scene = () => {
  return (
    <Canvas
      flat
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer({
          ...(props as unknown as ConstructorParameters<typeof THREE.WebGPURenderer>[0]),
          antialias: true,
          forceWebGL: true,
          // colorBufferType: THREE.UnsignedByteType,
        })

        await renderer.init()
        return renderer
      }}
      id="webgpu-canvas"
      style={{ width: "100vw", height: "100vh" }}
      shadows
    >
      <Experience />

      {/* {arr100.map((i) => (
        <mesh key={i} position={[i, i, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="red" />
        </mesh>
      ))} */}

      <OrthographicCamera position={[0, 0, 50]} zoom={10} near={0.1} far={10000} makeDefault />

      <TimelineControls />

      {/* <OrbitControls /> */}
      <ambientLight intensity={1} />
      {/* <directionalLight position={[5, 5, 5]} intensity={2} castShadow /> */}
    </Canvas>
  )
}

export default Scene
