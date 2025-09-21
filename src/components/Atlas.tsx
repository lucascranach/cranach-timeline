import { useLoader } from "@react-three/fiber"
import * as THREE from "three"
import { AtlasShaderMaterialTSL } from "@/shader/tsl/AtlasShaderMaterialTSL"
import { useMemo, useEffect, useState, useRef } from "react"
import { useControls } from "leva"
import { groupResultsByYear, calculateYearWidths, calculateYearPositions } from "@/utils/atlasUtils"

// Native InstancedMesh replacement for previous createInstances usage
// Each instance represents one thumbnail quad with per-instance transform & UV cropping via instanced attribute.

const Atlas = () => {
  const [atlasData, setAtlasData] = useState(null)
  const atlasTexture = useLoader(THREE.TextureLoader, "/atlas/texture_atlas.webp")

  // Instance mesh ref
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null)

  // Handle thumbnail click via R3F event instanceId
  const handleThumbnailClick = (index: number, imageData?: any) => {
    if (!imageData) return
    console.log(`Thumbnail ${index} clicked`, imageData.sorting_number)
    // Extend click behavior here (e.g., open modal, highlight, etc.)
  }

  // Leva controls for thumbnail sizing and cropping
  const {
    thumbnailWidth,
    thumbnailHeight,
    cropMode,
    cropOffsetX,
    cropOffsetY,
    cropScale,
    preserveAspectRatio,
    columnsPerYear,
    rowSpacing,
    yearSpacing,
    instanceLimit,
  } = useControls("Thumbnail Settings", {
    thumbnailWidth: { value: 1, min: 0.1, max: 3, step: 0.1, label: "Width" },
    thumbnailHeight: { value: 0.5, min: 0.1, max: 3, step: 0.1, label: "Height" },
    preserveAspectRatio: { value: false, label: "Preserve Aspect Ratio" },

    columnsPerYear: { value: 1, min: 1, max: 20, step: 1, label: "Columns per Year" },
    rowSpacing: { value: 0.01, min: 0.1, max: 5, step: 0.1, label: "Row Spacing" },
    yearSpacing: { value: 2, min: 0.1, max: 10, step: 0.1, label: "Year Spacing" },
    instanceLimit: { value: 0, min: 0, max: 10000, step: 100, label: "Instance Limit (0 = auto)" },
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
    fetch("/atlas/texture_atlas.json")
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

  // Sort and group images by year from sorting_number
  const { sortedImages, groupedByYear, yearKeys, yearPositions } = useMemo(() => {
    if (!atlasData?.images) {
      return { sortedImages: [], groupedByYear: {}, yearKeys: [], yearPositions: {} }
    }

    // Sort images by sorting_number
    const sorted = [...atlasData.images].sort((a, b) => {
      const aSort = a.sorting_number || "0000-000"
      const bSort = b.sorting_number || "0000-000"
      return aSort.localeCompare(bSort)
    })

    // Group by year using atlasUtils
    const grouped = groupResultsByYear(sorted)
    const keys = Object.keys(grouped).sort()

    // Calculate year positions
    const yearWidths = calculateYearWidths(grouped, atlasData, columnsPerYear, thumbnailWidth, rowSpacing)
    const positions = calculateYearPositions(keys, yearWidths, yearSpacing)

    return {
      sortedImages: sorted,
      groupedByYear: grouped,
      yearKeys: keys,
      yearPositions: positions,
    }
  }, [atlasData, columnsPerYear, thumbnailWidth, rowSpacing, yearSpacing])

  // Create geometry with UV offset attributes and correct aspect ratios
  const geometryWithAttributes = useMemo(() => {
    if (!atlasData || !sortedImages.length) return null

    // Create UV offset data for each instance
    const uvOffsets = new Float32Array(sortedImages.length * 4) // 4 values per instance (u1, v1, u2, v2)

    sortedImages.forEach((imageData, i) => {
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
    })

    // Create base geometry (unit plane that will be scaled per instance)
    const geometry = new THREE.PlaneGeometry(1, 1)
    geometry.setAttribute("uvOffset", new THREE.InstancedBufferAttribute(uvOffsets, 4))

    return geometry
  }, [atlasData, sortedImages, cropMode, cropOffsetX, cropOffsetY, cropScale, thumbnailWidth, thumbnailHeight])

  // Precompute per-instance transforms (position & scale) preserving original layout logic
  const instanceTransforms = useMemo(() => {
    if (!atlasData || !geometryWithAttributes || !sortedImages.length) {
      return { positions: [] as [number, number, number][], scales: [] as [number, number, number][] }
    }

    const positions: [number, number, number][] = []
    const scales: [number, number, number][] = []

    yearKeys.forEach((year) => {
      const yearItems = groupedByYear[year]
      const yearStartX = yearPositions[year]

      yearItems.forEach((imageData: any, itemIndex: number) => {
        const row = Math.floor(itemIndex / columnsPerYear)
        const col = itemIndex % columnsPerYear

        const imageWidth = imageData.width || 100
        const imageHeight = imageData.height || 100
        const aspectRatio = imageWidth / imageHeight

        let finalWidth: number, finalHeight: number
        if (preserveAspectRatio) {
          const targetAspect = thumbnailWidth / thumbnailHeight

          if (aspectRatio > targetAspect) {
            finalWidth = thumbnailWidth
            finalHeight = thumbnailWidth / aspectRatio
          } else {
            finalHeight = thumbnailHeight
            finalWidth = thumbnailHeight * aspectRatio
          }
        } else {
          finalWidth = thumbnailWidth
          finalHeight = thumbnailHeight
        }

        const x = yearStartX + col * (finalWidth + rowSpacing)
        const y = row * (finalHeight + rowSpacing)

        positions.push([x, y, 0])
        scales.push([finalWidth, finalHeight, 1])
      })
    })

    return { positions, scales }
  }, [
    atlasData,
    geometryWithAttributes,
    sortedImages,
    yearKeys,
    groupedByYear,
    yearPositions,
    columnsPerYear,
    preserveAspectRatio,
    thumbnailWidth,
    thumbnailHeight,
    rowSpacing,
  ])

  // Apply transforms to instanced mesh
  useEffect(() => {
    if (!instancedMeshRef.current || !instanceTransforms.positions.length) return
    const mesh = instancedMeshRef.current
    const dummy = new THREE.Object3D()
    const { positions, scales } = instanceTransforms
    const count = Math.min(positions.length, mesh.count)
    for (let i = 0; i < count; i++) {
      const pos = positions[i]
      const scl = scales[i]
      dummy.position.set(pos[0], pos[1], pos[2])
      dummy.scale.set(scl[0], scl[1], scl[2])
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [instanceTransforms])

  // Fallback UI (simplified) while data/material not ready
  if (!atlasMaterial || !atlasData || !geometryWithAttributes || !sortedImages.length) {
    return (
      <group>
        {sortedImages.slice(0, 10).map((imageData: any, i: number) => (
          <mesh
            key={imageData.filename || i}
            position={[i * 1.2, 0, 0]}
            onClick={() => handleThumbnailClick(i, imageData)}
          >
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        ))}
      </group>
    )
  }

  const instanceCount = instanceTransforms.positions.length

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[geometryWithAttributes, atlasMaterial, instanceCount || 1]}
      // Pointer events using R3F – instanceId gives which thumbnail was clicked
      onClick={(e) => {
        e.stopPropagation()
        const index = e.instanceId ?? -1
        if (index >= 0 && sortedImages[index]) {
          handleThumbnailClick(index, sortedImages[index])
        }
      }}
    />
  )
}

export default Atlas
