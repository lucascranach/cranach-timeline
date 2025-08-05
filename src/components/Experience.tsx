import { createInstances } from "@react-three/drei"
import { useLoader } from "@react-three/fiber"
import * as THREE from "three"
import { AtlasShaderMaterialTSL } from "@/shader/tsl/AtlasShaderMaterialTSL"
import { useMemo, useEffect, useState } from "react"
import { useControls } from "leva"

const [ThumbnailInstances, Thumbnail] = createInstances()

const Atlas = () => {
  const arr100 = Array.from({ length: 100 }, (_, i) => i)
  const [atlasData, setAtlasData] = useState(null)
  const atlasTexture = useLoader(THREE.TextureLoader, "/texture-atlas.webp")

  // Leva controls for thumbnail sizing and cropping
  const { thumbnailWidth, thumbnailHeight, cropMode, cropOffsetX, cropOffsetY, cropScale } = useControls(
    "Thumbnail Settings",
    {
      thumbnailWidth: { value: 1, min: 0.1, max: 3, step: 0.1, label: "Width" },
      thumbnailHeight: { value: 1, min: 0.1, max: 3, step: 0.1, label: "Height" },
      cropMode: {
        value: "fill",
        options: ["fit", "fill", "custom"],
        label: "Crop Mode",
      },
      cropOffsetX: { value: 0, min: -1, max: 1, step: 0.01, label: "Crop Offset X" },
      cropOffsetY: { value: 0, min: -1, max: 1, step: 0.01, label: "Crop Offset Y" },
      cropScale: { value: 1, min: 0.1, max: 2, step: 0.01, label: "Crop Scale" },
    }
  )

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

    const cropSettings = {
      mode: cropMode,
      offsetX: cropOffsetX,
      offsetY: cropOffsetY,
      scale: cropScale,
    }

    return AtlasShaderMaterialTSL(atlasTexture, cropSettings)
  }, [atlasTexture, atlasData, cropMode, cropOffsetX, cropOffsetY, cropScale])

  // Create geometry with UV offset attributes and cropping
  const geometryWithAttributes = useMemo(() => {
    if (!atlasData) return null

    // Use uniform dimensions for all thumbnails - no aspect ratio adjustment of the plane
    const finalWidth = thumbnailWidth
    const finalHeight = thumbnailHeight

    // Create geometry with uniform dimensions - all thumbnails will be the same size
    const geometry = new THREE.PlaneGeometry(finalWidth, finalHeight)

    // Create UV offset data and aspect ratio data for each instance
    const uvOffsets = new Float32Array(arr100.length * 4) // 4 values per instance (u1, v1, u2, v2)
    const aspectRatios = new Float32Array(arr100.length) // 1 value per instance (width/height)

    arr100.forEach((i) => {
      if (atlasData.images && atlasData.images.length > 0) {
        const imageData = atlasData.images[i % atlasData.images.length]
        const atlasWidth = atlasData.atlas.width
        const atlasHeight = atlasData.atlas.height

        // Calculate aspect ratio from the actual image dimensions
        const aspectRatio = imageData.width / imageData.height
        aspectRatios[i] = aspectRatio

        // Calculate base UV coordinates
        let u1 = imageData.x / atlasWidth
        let v1 = 1 - (imageData.y + imageData.height) / atlasHeight
        let u2 = (imageData.x + imageData.width) / atlasWidth
        let v2 = 1 - imageData.y / atlasHeight

        // Apply cropping based on crop mode
        if (cropMode === "fit") {
          // Fit mode: show entire image, may have letterboxing
          // No additional cropping needed, use full UV coordinates
        } else if (cropMode === "fill") {
          // Fill mode: crop to fill the thumbnail dimensions
          const imageAspect = aspectRatio
          const thumbAspect = finalWidth / finalHeight

          if (imageAspect > thumbAspect) {
            // Image is wider than thumbnail, crop horizontally
            const cropAmount = (1 - thumbAspect / imageAspect) * 0.5
            const uvWidth = u2 - u1
            u1 += cropAmount * uvWidth
            u2 -= cropAmount * uvWidth
          } else {
            // Image is taller than thumbnail, crop vertically
            const cropAmount = (1 - imageAspect / thumbAspect) * 0.5
            const uvHeight = v2 - v1
            v1 += cropAmount * uvHeight
            v2 -= cropAmount * uvHeight
          }
        } else if (cropMode === "custom") {
          // Custom mode: use manual crop controls
          const centerU = (u1 + u2) * 0.5
          const centerV = (v1 + v2) * 0.5
          const uvWidth = (u2 - u1) * cropScale
          const uvHeight = (v2 - v1) * cropScale

          u1 = centerU - uvWidth * 0.5 + cropOffsetX * uvWidth * 0.5
          u2 = centerU + uvWidth * 0.5 + cropOffsetX * uvWidth * 0.5
          v1 = centerV - uvHeight * 0.5 + cropOffsetY * uvHeight * 0.5
          v2 = centerV + uvHeight * 0.5 + cropOffsetY * uvHeight * 0.5

          // Clamp to original image bounds within the atlas
          const imageU1 = imageData.x / atlasWidth
          const imageU2 = (imageData.x + imageData.width) / atlasWidth
          const imageV1 = 1 - (imageData.y + imageData.height) / atlasHeight
          const imageV2 = 1 - imageData.y / atlasHeight

          u1 = Math.max(imageU1, Math.min(u1, imageU2))
          u2 = Math.max(imageU1, Math.min(u2, imageU2))
          v1 = Math.max(imageV1, Math.min(v1, imageV2))
          v2 = Math.max(imageV1, Math.min(v2, imageV2))
        }

        uvOffsets[i * 4 + 0] = u1
        uvOffsets[i * 4 + 1] = v1
        uvOffsets[i * 4 + 2] = u2
        uvOffsets[i * 4 + 3] = v2
      }
    })

    geometry.setAttribute("uvOffset", new THREE.InstancedBufferAttribute(uvOffsets, 4))
    geometry.setAttribute("aspectRatio", new THREE.InstancedBufferAttribute(aspectRatios, 1))
    return geometry
  }, [atlasData, arr100, thumbnailWidth, thumbnailHeight, cropMode, cropOffsetX, cropOffsetY, cropScale])

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
          <Thumbnail key={i} position={[i, 0, 0]} />
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
