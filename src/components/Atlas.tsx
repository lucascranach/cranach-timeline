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
  const {
    thumbnailWidth,
    thumbnailHeight,
    cropMode,
    cropOffsetX,
    cropOffsetY,
    cropScale,
    preserveAspectRatio,
    spacing,
  } = useControls("Thumbnail Settings", {
    thumbnailWidth: { value: 1, min: 0.1, max: 3, step: 0.1, label: "Width" },
    thumbnailHeight: { value: 0.5, min: 0.1, max: 3, step: 0.1, label: "Height" },
    preserveAspectRatio: { value: false, label: "Preserve Aspect Ratio" },
    spacing: { value: 1.2, min: 0.1, max: 5, step: 0.1, label: "Spacing" },
    cropMode: {
      value: "fill",
      options: ["fit", "fill", "custom"],
      label: "Crop Mode",
    },
    cropOffsetX: { value: 0, min: -1, max: 1, step: 0.01, label: "Crop Offset X" },
    cropOffsetY: { value: 0, min: -1, max: 1, step: 0.01, label: "Crop Offset Y" },
    cropScale: { value: 1, min: 0.1, max: 2, step: 0.01, label: "Crop Scale" },
  })

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

  // Create geometry with UV offset attributes and correct aspect ratios
  const geometryWithAttributes = useMemo(() => {
    if (!atlasData) return null

    // Create UV offset data for each instance
    const uvOffsets = new Float32Array(arr100.length * 4) // 4 values per instance (u1, v1, u2, v2)

    arr100.forEach((i) => {
      if (atlasData.images && atlasData.images.length > 0) {
        const imageData = atlasData.images[i % atlasData.images.length]
        const atlasWidth = atlasData.atlas.width
        const atlasHeight = atlasData.atlas.height

        // Calculate actual image dimensions and aspect ratio
        const imageWidth = imageData.width || 100 // fallback if width missing
        const imageHeight = imageData.height || 100 // fallback if height missing
        const aspectRatio = imageWidth / imageHeight

        // Calculate base UV coordinates
        let u1 = imageData.x / atlasWidth
        let v1 = 1 - (imageData.y + imageData.height) / atlasHeight
        let u2 = (imageData.x + imageData.width) / atlasWidth
        let v2 = 1 - imageData.y / atlasHeight

        // Apply cropping based on crop mode
        if (cropMode === "fit") {
          // Fit mode: show entire image, preserve aspect ratio
          // No UV cropping needed - the geometry scaling handles aspect ratio
        } else if (cropMode === "fill") {
          // Fill mode: crop to fill specified thumbnail dimensions
          const thumbAspect = thumbnailWidth / thumbnailHeight

          if (aspectRatio > thumbAspect) {
            // Image is wider, crop horizontally
            const cropAmount = (1 - thumbAspect / aspectRatio) * 0.5
            const uvWidth = u2 - u1
            u1 += cropAmount * uvWidth
            u2 -= cropAmount * uvWidth
          } else {
            // Image is taller, crop vertically
            const cropAmount = (1 - aspectRatio / thumbAspect) * 0.5
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

    // Create base geometry (unit plane that will be scaled per instance)
    const geometry = new THREE.PlaneGeometry(1, 1)
    geometry.setAttribute("uvOffset", new THREE.InstancedBufferAttribute(uvOffsets, 4))

    return geometry
  }, [atlasData, arr100, cropMode, cropOffsetX, cropOffsetY, cropScale, thumbnailWidth, thumbnailHeight])

  if (!atlasMaterial || !atlasData || !geometryWithAttributes) {
    return (
      <>
        <ThumbnailInstances>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="orange" />
          {arr100.map((i) => (
            <group position={[i * spacing, 0, 0]} key={i}>
              <Thumbnail key={i} position={[i * spacing, 0, 0]} />
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

        {arr100.map((i) => {
          if (!atlasData.images || atlasData.images.length === 0) {
            return <Thumbnail key={i} position={[i * spacing, 0, 0]} />
          }

          const imageData = atlasData.images[i % atlasData.images.length]
          const imageWidth = imageData.width || 100
          const imageHeight = imageData.height || 100
          const aspectRatio = imageWidth / imageHeight

          // Calculate thumbnail dimensions based on settings
          let finalWidth, finalHeight

          if (preserveAspectRatio) {
            // Preserve aspect ratio mode: scale to fit within specified dimensions
            const targetAspect = thumbnailWidth / thumbnailHeight

            if (aspectRatio > targetAspect) {
              // Image is wider, scale by width
              finalWidth = thumbnailWidth
              finalHeight = thumbnailWidth / aspectRatio
            } else {
              // Image is taller, scale by height
              finalHeight = thumbnailHeight
              finalWidth = thumbnailHeight * aspectRatio
            }
          } else {
            // Direct dimensions: use specified width and height (may distort aspect ratio)
            finalWidth = thumbnailWidth
            finalHeight = thumbnailHeight
          }

          return <Thumbnail key={i} position={[i * spacing, 0, 0]} scale={[finalWidth, finalHeight, 1]} />
        })}
      </ThumbnailInstances>
    </>
  )
}

export default Atlas
