import { Instances, Instance, createInstances } from "@react-three/drei"
import AtlasManager from "./atlas/AtlasManager"
import InstancedAtlasThumbnails from "./atlas/InstancedAtlasThumbnails"

const [ThumbnailInstances, Thumbnail] = createInstances()

const Atlas = () => {
  const arr100 = Array.from({ length: 100 }, (_, i) => i)

  return (
    <>
      <ThumbnailInstances>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color="orange" />
        {arr100.map((i) => (
          <group position={[i, 0, 0]} key={i}>
            <Thumbnail key={i} position={[i, 0, 0]} />
          </group>
        ))}
      </ThumbnailInstances>
    </>
  )
}

const Experience = () => {
  return (
    <group>
      <Atlas />
      <axesHelper args={[100]} />
    </group>
  )
}

export default Experience
