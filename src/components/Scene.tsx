import { useRef, useEffect } from "react"
import * as THREE from "three/webgpu"
import * as TSL from "three/tsl"
import { Canvas, extend, useFrame, useThree, type ThreeToJSXElements } from "@react-three/fiber"
import { MapControls, OrbitControls, OrthographicCamera, PerspectiveCamera, useGLTF } from "@react-three/drei"

import Experience from "./Experience"

declare module "@react-three/fiber" {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

extend(THREE as any)

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

      <OrthographicCamera position={[0, 0, 20]} zoom={50} makeDefault />

      <MapControls
        enableRotate={false}
        enablePan={true}
        enableZoom={true}
        panSpeed={1}
        zoomSpeed={1}
        minZoom={10}
        maxZoom={200}
        screenSpacePanning={true}
      />

      {/* <OrbitControls /> */}
      <ambientLight intensity={1} />
      {/* <directionalLight position={[5, 5, 5]} intensity={2} castShadow /> */}
    </Canvas>
  )
}

export default Scene
