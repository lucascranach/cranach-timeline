import { createInstances } from "@react-three/drei"
import { useLoader } from "@react-three/fiber"
import * as THREE from "three"
import { AtlasShaderMaterialTSL } from "@/shader/tsl/AtlasShaderMaterialTSL"
import { useMemo, useEffect, useState } from "react"

const [ThumbnailInstances, Thumbnail] = createInstances()

const Atlas = () => {
  const arr100 = Array.from({ length: 100 }, (_, i) => i)
  const [atlasData, setAtlasData] = useState(null)
  const atlasTexture = useLoader(THREE.TextureLoader, "/texture-atlas.webp")

  // Load atlas data
  useEffect(() => {
    fetch("/texture-atlas.json")
      .then((response) => response.json())
      .then((data) => setAtlasData(data))
      .catch((err) => console.error("Failed to load atlas data:", err))
  }, [])

  // Create the custom TSL material
  const atlasMaterial = useMemo(() => {
    if (!atlasTexture || !atlasData) return null
    return AtlasShaderMaterialTSL(atlasTexture)
  }, [atlasTexture, atlasData])

  // Create geometry with UV offset attributes and aspect ratio scaling
  const geometryWithAttributes = useMemo(() => {
    if (!atlasData) return null

    // Use a base geometry that will be scaled per instance
    const geometry = new THREE.PlaneGeometry(1, 1)

    // Create UV offset data and aspect ratio data for each instance
    const uvOffsets = new Float32Array(arr100.length * 4) // 4 values per instance (u1, v1, u2, v2)
    const aspectRatios = new Float32Array(arr100.length) // 1 value per instance (width/height)

    arr100.forEach((i) => {
      // For demo purposes, use the first image's UV coordinates
      // In a real implementation, you'd map each instance to a specific image
      if (atlasData.images && atlasData.images.length > 0) {
        const imageData = atlasData.images[i % atlasData.images.length]
        const atlasWidth = atlasData.atlas.width
        const atlasHeight = atlasData.atlas.height

        // Calculate aspect ratio from the actual image dimensions
        const aspectRatio = imageData.width / imageData.height
        aspectRatios[i] = aspectRatio

        const u1 = imageData.x / atlasWidth
        const v1 = 1 - (imageData.y + imageData.height) / atlasHeight
        const u2 = (imageData.x + imageData.width) / atlasWidth
        const v2 = 1 - imageData.y / atlasHeight

        uvOffsets[i * 4 + 0] = u1
        uvOffsets[i * 4 + 1] = v1
        uvOffsets[i * 4 + 2] = u2
        uvOffsets[i * 4 + 3] = v2
      }
    })

    geometry.setAttribute("uvOffset", new THREE.InstancedBufferAttribute(uvOffsets, 4))
    geometry.setAttribute("aspectRatio", new THREE.InstancedBufferAttribute(aspectRatios, 1))
    return geometry
  }, [atlasData, arr100])

  if (!atlasMaterial || !atlasData || !geometryWithAttributes) {
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

  return (
    <>
      <ThumbnailInstances>
        <primitive object={geometryWithAttributes} attach="geometry" />
        <primitive object={atlasMaterial} attach="material" />

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
