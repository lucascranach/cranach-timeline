import { useLoader } from "@react-three/fiber"
import { Html } from "@react-three/drei"
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
    showAxis,
    showAllYearLabels,
    majorTickEvery,
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
    showAxis: { value: true, label: "Show Axis" },
    showAllYearLabels: { value: false, label: "Show All Year Labels" },
    majorTickEvery: { value: 10, min: 2, max: 50, step: 1, label: "Major Tick Every" },
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
  // Define uniform timeline year range
  const START_YEAR = 1500
  const END_YEAR = 1950

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
    // Uniform year list from START_YEAR..END_YEAR (even if no images)
    const keys = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => String(START_YEAR + i))

    // Uniform positions: each year placed at fixed spacing along x
    const positions = keys.reduce((acc, year, idx) => {
      acc[year] = idx * yearSpacing
      return acc
    }, {} as Record<string, number>)

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
      return {
        positions: [] as [number, number, number][],
        scales: [] as [number, number, number][],
        yearColumnLabels: [] as { x: number; y: number; year: string; key: string }[],
      }
    }

    const positions: [number, number, number][] = []
    const scales: [number, number, number][] = []
    const yearColumnLabels: { x: number; y: number; year: string; key: string }[] = []

    yearKeys.forEach((year) => {
      const yearItems = groupedByYear[year] || []
      const yearCenterX = yearPositions[year]

      // Track first-row (row 0) columns for label placement
      const firstRowColumns: { col: number; x: number; width: number; height: number }[] = []

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

        // Compute total columns for this year to center them around the yearCenterX
        const totalCols = Math.min(columnsPerYear, yearItems.length)
        const rows = Math.ceil(yearItems.length / columnsPerYear)
        // Width of one column cell (including spacing except maybe last) approximated via finalWidth + rowSpacing
        const columnsInFirstRow = Math.min(columnsPerYear, yearItems.length)
        const totalWidthFirstRow = columnsInFirstRow * finalWidth + (columnsInFirstRow - 1) * rowSpacing
        const firstColStart = yearCenterX - totalWidthFirstRow / 2
        const x = firstColStart + col * (finalWidth + rowSpacing)
        const y = row * (finalHeight + rowSpacing)

        positions.push([x, y, 0])
        scales.push([finalWidth, finalHeight, 1])

        if (row === 0) {
          firstRowColumns.push({ col, x, width: finalWidth, height: finalHeight })
        }
      })

      if (yearItems.length > 0) {
        // After processing year items, create a single centered label for the year
        const labelY = -thumbnailHeight * 0.75
        yearColumnLabels.push({
          x: yearCenterX,
          y: labelY,
          year,
          key: `${year}-center`,
        })
      } else {
        // Empty year still gets a tick label
        yearColumnLabels.push({
          x: yearCenterX,
          y: -thumbnailHeight * 0.75,
          year,
          key: `${year}-empty`,
        })
      }
    })

    return { positions, scales, yearColumnLabels }
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
    <group>
      {showAxis && (
        <group name="timeline-axis">
          {/* Baseline spanning full years range */}
          {(() => {
            const totalYears = yearKeys.length - 1
            const axisStart = yearPositions[yearKeys[0]]
            const axisEnd = yearPositions[yearKeys[yearKeys.length - 1]]
            const axisWidth = axisEnd - axisStart
            return (
              <mesh position={[axisStart + axisWidth / 2, -thumbnailHeight * 0.5, -0.001]}>
                <planeGeometry args={[axisWidth, 0.01]} />
                <meshBasicMaterial color="#888" />
              </mesh>
            )
          })()}
          {/* Tick marks */}
          {yearKeys.map((year) => {
            const x = yearPositions[year]
            const y = -thumbnailHeight * 0.5
            const isMajor = parseInt(year) % majorTickEvery === 0
            const height = isMajor ? 0.15 : 0.08
            return (
              <mesh key={`tick-${year}`} position={[x, y, -0.002]}>
                <planeGeometry args={[0.005, height]} />
                <meshBasicMaterial color={isMajor ? "#bbb" : "#666"} />
              </mesh>
            )
          })}
        </group>
      )}
      <instancedMesh
        ref={instancedMeshRef}
        args={[geometryWithAttributes, atlasMaterial, instanceCount || 1]}
        frustumCulled={false}
        onClick={(e) => {
          e.stopPropagation()
          const index = e.instanceId ?? -1
          if (index >= 0 && sortedImages[index]) {
            handleThumbnailClick(index, sortedImages[index])
          }
        }}
      />
      {/* Year labels (HTML) repeated under each column */}
      {instanceTransforms.yearColumnLabels
        .filter((lbl) => showAllYearLabels || parseInt(lbl.year) % majorTickEvery === 0)
        .map((lbl) => (
          <Html
            key={lbl.key}
            position={[lbl.x, lbl.y - 1, 0.001]}
            // transform
            // distanceFactor={4}
            center
            style={{ pointerEvents: "none" }}
          >
            <div
              style={{
                fontSize: `${thumbnailHeight * 18}px`,
                lineHeight: 1,
                fontWeight: 500,
                fontFamily: "system-ui, sans-serif",
                color: "#fff",
                textShadow: "0 0 4px rgba(0,0,0,0.8)",
                whiteSpace: "nowrap",
                transform: "translateY(-2px)",
              }}
            >
              {lbl.year}
            </div>
          </Html>
        ))}
    </group>
  )
}

export default Atlas
