import { useRef, useEffect, useState } from "react"
import * as THREE from "three/webgpu"
import * as TSL from "three/tsl"
import { Canvas, extend, useFrame, useThree, type ThreeToJSXElements } from "@react-three/fiber"
import { Center, MapControls, OrbitControls, OrthographicCamera, PerspectiveCamera, useGLTF } from "@react-three/drei"
import { Text } from "@react-three/drei"

import Experience from "./Experience"

import { Leva } from "leva"

declare module "@react-three/fiber" {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

extend(THREE as any)

// Custom controls component to handle horizontal-only scrolling (mouse wheel) and panning (drag)
const TimelineControls = () => {
  const { camera, gl } = useThree()
  const controlsRef = useRef<any>(null)

  const wheelVelocityRef = useRef(0)
  const targetXRef = useRef<number | null>(null)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const initialY = camera.position.y
    const initialTargetY = controls.target.y

    // Adjustable scroll speed (world units per wheel delta unit)
    // Kept small because we apply inertia in the render loop.
    const SCROLL_SPEED = 0.0025

    // Timeline boundaries - years 1400 to 1950
    // Assuming REFERENCE_YEAR = 1507 at x = 0, and typical yearSpacing ~= 2
    // We'll use approximate bounds and clamp camera position
    const MIN_YEAR = 1400
    const MAX_YEAR = 1950
    const REFERENCE_YEAR = 1507
    const YEAR_SPACING = 2 // approximate, adjust if needed
    const MIN_X = (MIN_YEAR - REFERENCE_YEAR) * YEAR_SPACING
    const MAX_X = (MAX_YEAR - REFERENCE_YEAR) * YEAR_SPACING

    const handleWheel = (event: WheelEvent) => {
      // Allow cmd/ctrl + scroll for browser shortcuts, otherwise hijack
      if (event.metaKey || event.ctrlKey) return
      event.preventDefault()
      event.stopPropagation()

      // Use deltaY for horizontal move (invert if desired). Shift+scroll can naturally be horizontal in some OS; unify here.
      const raw = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY

      // Bootstrap target on first interaction
      if (targetXRef.current === null) targetXRef.current = camera.position.x

      // Add wheel energy; actual motion happens in the render loop
      wheelVelocityRef.current += raw * SCROLL_SPEED

      // Clamp velocity to avoid giant jumps on touchpads with momentum bursts
      const MAX_V = 1.75
      wheelVelocityRef.current = Math.max(-MAX_V, Math.min(MAX_V, wheelVelocityRef.current))

      // Lock Y axes immediately to prevent drift
      camera.position.y = initialY
      controls.target.y = initialTargetY
    }

    const canvas = gl.domElement
    canvas.addEventListener("wheel", handleWheel, { passive: false })

    // Smooth centering logic
    let animId: number | null = null
    const centerState = { active: false, targetX: 0 }

    const animateCenter = () => {
      if (!centerState.active) return
      const current = camera.position.x
      const target = centerState.targetX
      const delta = target - current
      if (Math.abs(delta) < 0.01) {
        camera.position.x = target
        controls.target.x = target
        centerState.active = false
        controls.update()
        return
      }
      const step = delta * 0.15 // damping factor
      camera.position.x += step
      controls.target.x += step
      controls.update()
      animId = requestAnimationFrame(animateCenter)
    }

    const handleCenterEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail as { x?: number }
      if (typeof detail?.x === "number") {
        centerState.targetX = detail.x
        centerState.active = true
        if (animId) cancelAnimationFrame(animId)
        animId = requestAnimationFrame(animateCenter)
      }
    }
    window.addEventListener("timeline-center", handleCenterEvent as any)

    return () => {
      canvas.removeEventListener("wheel", handleWheel as any)
      window.removeEventListener("timeline-center", handleCenterEvent as any)
      if (animId) cancelAnimationFrame(animId)
    }
  }, [gl, camera])

  // Smooth scroll + clamp (also covers panning with mouse drag)
  useFrame((_state, delta) => {
    const controls = controlsRef.current
    if (!controls) return

    const MIN_YEAR = 1400
    const MAX_YEAR = 1950
    const REFERENCE_YEAR = 1507
    const YEAR_SPACING = 2
    const MIN_X = (MIN_YEAR - REFERENCE_YEAR) * YEAR_SPACING
    const MAX_X = (MAX_YEAR - REFERENCE_YEAR) * YEAR_SPACING

    // Initialize target from current camera position if needed
    if (targetXRef.current === null) targetXRef.current = camera.position.x

    // Exponential decay for inertial scrolling
    const damping = Math.pow(0.0005, delta) // frame-rate independent
    wheelVelocityRef.current *= damping

    // Integrate into target X
    targetXRef.current += wheelVelocityRef.current

    // Clamp target X
    if (targetXRef.current < MIN_X) {
      targetXRef.current = MIN_X
      wheelVelocityRef.current = 0
    } else if (targetXRef.current > MAX_X) {
      targetXRef.current = MAX_X
      wheelVelocityRef.current = 0
    }

    // Smoothly follow target
    const currentX = camera.position.x
    const lerp = 1 - Math.pow(0.00001, delta) // frame-rate independent
    const nextX = currentX + (targetXRef.current - currentX) * lerp

    camera.position.x = nextX
    controls.target.x = nextX

    // Lock Y axes
    camera.position.y = camera.position.y
    controls.update()
  })

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

// Component to update canvas background color on theme change
const CanvasBackground = () => {
  const { gl } = useThree()

  useEffect(() => {
    const updateBackground = () => {
      const canvasBg = getComputedStyle(document.documentElement).getPropertyValue("--canvas-bg").trim()
      gl.setClearColor(new THREE.Color(canvasBg), 1)
    }

    updateBackground()

    const observer = new MutationObserver(updateBackground)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [gl])

  return null
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
      dpr={[1, 1.5]}
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer({
          ...(props as unknown as ConstructorParameters<typeof THREE.WebGPURenderer>[0]),
          antialias: false,
          forceWebGL: true,
        })
        await renderer.init()
        const canvasBg = getComputedStyle(document.documentElement).getPropertyValue("--canvas-bg").trim()
        renderer.setClearColor(new THREE.Color(canvasBg), 1)
        return renderer
      }}
      id="webgpu-canvas"
      style={{ width: "calc(100vw - 24rem)", height: "100vh" }}
    >
      <CanvasBackground />
      <Experience />
      {/* HUD-style plane fixed to camera, positioned below timeline for UI / backdrop */}

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
