import { useRef, useEffect } from "react"
import * as THREE from "three/webgpu"
import * as TSL from "three/tsl"
import { Canvas, extend, useFrame, useThree, type ThreeToJSXElements } from "@react-three/fiber"
import { Center, MapControls, OrbitControls, OrthographicCamera, PerspectiveCamera, useGLTF } from "@react-three/drei"
import { Text } from "@react-three/drei"

import Experience from "./Experience"
import CameraPlane from "./CameraPlane"
import { Leva } from "leva"

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
  // Enable fullscreen toggle via 'f' or 'F'
  useEffect(() => {
    const toggleFullscreen = () => {
      const canvas = document.getElementById("webgpu-canvas") || document.documentElement
      const doc: any = document
      const isFs = doc.fullscreenElement || doc.webkitFullscreenElement
      if (!isFs) {
        const request = (canvas as any).requestFullscreen || (canvas as any).webkitRequestFullscreen
        request?.call(canvas)
      } else {
        const exit = doc.exitFullscreen || doc.webkitExitFullscreen
        exit?.call(doc)
      }
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        // avoid triggering while typing in inputs/textareas
        const target = e.target as HTMLElement
        const tag = target?.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return
        toggleFullscreen()
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])
  return (
    <Canvas
      flat
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer({
          ...(props as unknown as ConstructorParameters<typeof THREE.WebGPURenderer>[0]),
          antialias: true,
          forceWebGL: true,
        })
        await renderer.init()
        renderer.setClearColor(new THREE.Color("#18181a"), 1)
        return renderer
      }}
      id="webgpu-canvas"
      style={{ width: "100vw", height: "100vh" }}
      shadows
    >
      <Experience />
      {/* HUD-style plane fixed to camera, positioned below timeline for UI / backdrop */}
      <CameraPlane
        /*
         * CameraPlane acts like a HUD element fixed to the camera.
         * Atlas root group is positioned at y≈-30, with timeline / labels spread a few units further.
         * We push this plane further down (y offset -55) so it appears clearly below the timeline band as a footer slab.
         * Increase size width if you scroll beyond 220 world units horizontally.
         * Z offset: negative (towards camera) so it stays in front when depthTest=false.
         */
        offset={[0, -55, -60]}
        size={[220, 49.1]}
        color={"#0f0f10"}
        opacity={0.6}
        depthTest={true}
      />
      {/* <Leva hidden /> */}

      {/* {arr100.map((i) => (
        <mesh key={i} position={[i, i, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="red" />
        </mesh>
      ))} */}

      <OrthographicCamera position={[0, 0, 50]} zoom={8} near={0.1} far={10000} makeDefault />

      <TimelineControls />

      {/* <OrbitControls /> */}
      <ambientLight intensity={1} />
      {/* <directionalLight position={[5, 5, 5]} intensity={2} castShadow /> */}
    </Canvas>
  )
}

export default Scene
