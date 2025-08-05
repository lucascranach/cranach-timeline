import * as THREE from "three/webgpu"
import * as TSL from "three/tsl"
import { abs, Fn, If, positionLocal, rotateUV, time, vec2 } from "three/tsl"

import { Canvas, extend, useFrame, useThree, type ThreeToJSXElements } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei"
import { useRef, useEffect } from "react"
import Experience from "./Experience"

declare module "@react-three/fiber" {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

extend(THREE as any)

const Scene = () => {
  const meadowRef = useRef<THREE.Mesh>(null)

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
      <PerspectiveCamera makeDefault position={[0, 2, 0]} fov={50} />
      <OrbitControls />
      <ambientLight intensity={1} />
      {/* <directionalLight position={[5, 5, 5]} intensity={2} castShadow /> */}
    </Canvas>
  )
}

export default Scene
