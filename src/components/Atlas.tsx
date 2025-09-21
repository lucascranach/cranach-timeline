import { createInstances, Text } from "@react-three/drei"
import { useLoader } from "@react-three/fiber"
import * as THREE from "three"
import { AtlasShaderMaterialTSL } from "@/shader/tsl/AtlasShaderMaterialTSL"
import { useMemo, useEffect, useState } from "react"
import { useControls } from "leva"
import { groupResultsByYear, calculateYearWidths, calculateYearPositions, getAtlasKey } from "@/utils/atlasUtils"

const [ThumbnailInstances, Thumbnail] = createInstances()

const Atlas = () => {
  const [atlasData, setAtlasData] = useState(null)
  const atlasTexture = useLoader(THREE.TextureLoader, "/atlas/texture_atlas.webp")

  // Handle thumbnail click
  const handleThumbnailClick = (index: number, imageData?: any) => {
    console.log(`Thumbnail ${index} clicked`, imageData)
    // Add your custom click logic here
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
  } = useControls("Thumbnail Settings", {
    thumbnailWidth: { value: 1, min: 0.1, max: 3, step: 0.1, label: "Width" },
    thumbnailHeight: { value: 0.5, min: 0.1, max: 3, step: 0.1, label: "Height" },
    preserveAspectRatio: { value: false, label: "Preserve Aspect Ratio" },

    columnsPerYear: { value: 1, min: 1, max: 20, step: 1, label: "Columns per Year" },
    rowSpacing: { value: 0.01, min: 0.1, max: 5, step: 0.1, label: "Row Spacing" },
    yearSpacing: { value: 2, min: 0.1, max: 10, step: 0.1, label: "Year Spacing" },
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

  if (!atlasMaterial || !atlasData || !geometryWithAttributes || !sortedImages.length) {
    return (
      <>
        <ThumbnailInstances>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="orange" />
          {sortedImages.map((imageData, i) => (
            <group key={imageData.filename || i}>
              <Thumbnail position={[i * 2, 0, 0]} onClick={() => handleThumbnailClick(i, imageData)} />
            </group>
          ))}
        </ThumbnailInstances>
      </>
    )
  }

  // Create positioned instances for each year group
  const thumbnailInstances = []
  const yearLabels = []
  let globalIndex = 0

  yearKeys.forEach((year) => {
    const yearItems = groupedByYear[year]
    const yearStartX = yearPositions[year]
    const rows = Math.ceil(yearItems.length / columnsPerYear)

    // Track the lowest Y position for this year to position the year label
    let minY = 0

    yearItems.forEach((imageData, itemIndex) => {
      const row = Math.floor(itemIndex / columnsPerYear)
      const col = itemIndex % columnsPerYear

      // Calculate position within the year group
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

      const x = yearStartX + col * (finalWidth + rowSpacing)
      const y = row * (finalHeight + rowSpacing)

      // Capture the current index for the closure
      const currentIndex = globalIndex

      thumbnailInstances.push(
        <Thumbnail
          key={imageData.filename || globalIndex}
          position={[x, y, 0]}
          scale={[finalWidth, finalHeight, 1]}
          onClick={() => handleThumbnailClick(currentIndex, imageData)}
        />
      )

      globalIndex++
    })
  })

  return (
    <>
      <ThumbnailInstances>
        <primitive object={geometryWithAttributes} attach="geometry" />
        <primitive object={atlasMaterial} attach="material" />
        {thumbnailInstances}
      </ThumbnailInstances>
    </>
  )
}

export default Atlas
