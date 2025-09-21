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

      <OrthographicCamera position={[0, 0, 50]} zoom={20} near={0.1} far={10000} makeDefault />

      <MapControls
        enableRotate={false}
        enablePan={true}
        enableZoom={true}
        panSpeed={1}
        zoomSpeed={1}
        minZoom={5}
        maxZoom={500}
        screenSpacePanning={true}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
        minAzimuthAngle={0}
        maxAzimuthAngle={0}
      />

      {/* <OrbitControls /> */}
      <ambientLight intensity={1} />
      {/* <directionalLight position={[5, 5, 5]} intensity={2} castShadow /> */}
    </Canvas>
  )
}

export default Scene
