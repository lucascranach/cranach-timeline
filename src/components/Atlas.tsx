import { useLoader } from "@react-three/fiber"
import * as THREE from "three"
import { AtlasShaderMaterialTSL } from "@/shader/tsl/AtlasShaderMaterialTSL"
import { DecadeDiagonalBackground } from "@/shader/tsl/DecadeDiagonalShaderTSL"
import { useMemo } from "react"
import { useAtlasControls } from "@/hooks/useAtlasControls"
import { useAtlasData } from "@/hooks/useAtlasData"
import { useAtlasGeometry } from "@/hooks/useAtlasGeometry"
import { useAtlasTransforms } from "@/hooks/useAtlasTransforms"
import TimelineAxis from "./TimelineAxis"
import YearLabels from "./YearLabels"
import ThumbnailMesh from "./ThumbnailMesh"
import FallbackUI from "./FallbackUI"
import Events from "./Events"
import { useEvents } from "@/hooks/useEvents"

// Native InstancedMesh replacement for previous createInstances usage
// Each instance represents one thumbnail quad with per-instance transform & UV cropping via instanced attribute.

interface AtlasImage {
  filename: string
  x: number
  y: number
  width: number
  height: number
  sorting_number?: string
}

interface AtlasData {
  atlas: {
    width: number
    height: number
  }
  images: AtlasImage[]
}

// Event files configuration with colors
const EVENT_FILE_CONFIGS = [
  {
    file: "/events/cranachElderEvents_en.json",
    name: "Cranach Elder",
    color: "#FEB701",
  },
  {
    file: "/events/cranachYoungerEvents_en.json",
    name: "Cranach Younger",
    color: "#FEB701",
  },
  {
    file: "/events/historyEvents_en.json",
    name: "History",
    color: "#FEB701",
  },
  {
    file: "/events/lutherEvents_en.json",
    name: "Luther",
    color: "#FEB701",
  },
]

const Atlas = () => {
  const atlasTexture = useLoader(THREE.TextureLoader, "/atlas/texture_atlas.webp")

  // Use custom hooks for controls and settings
  const controls = useAtlasControls()

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
    showAxis,
    showAllYearLabels,
    majorTickEvery,
    eventGap,
    dashLength,
    dashGap,
    dashSpeed,
  } = controls

  // Load and process atlas data
  const { atlasData, sortedImages, groupedByYear, yearKeys, yearPositions } = useAtlasData(yearSpacing)

  // Load events data
  const { eventGroups } = useEvents(EVENT_FILE_CONFIGS)

  // Handle thumbnail click
  const handleThumbnailClick = (index: number, imageData?: AtlasImage) => {
    if (!imageData) return
    console.log(`Thumbnail ${index} clicked`, imageData.sorting_number)
    // Extend click behavior here (e.g., open modal, highlight, etc.)
  }

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

  // Use custom hooks for geometry and transforms
  const cropSettings = { mode: cropMode, offsetX: cropOffsetX, offsetY: cropOffsetY, scale: cropScale }
  const geometryWithAttributes = useAtlasGeometry(
    atlasData,
    sortedImages,
    thumbnailWidth,
    thumbnailHeight,
    cropSettings
  )

  const transformSettings = {
    columnsPerYear,
    preserveAspectRatio,
    thumbnailWidth,
    thumbnailHeight,
    rowSpacing,
  }

  const instanceTransforms = useAtlasTransforms(
    atlasData,
    sortedImages,
    yearKeys,
    groupedByYear,
    yearPositions,
    geometryWithAttributes,
    transformSettings
  )

  // Fallback UI while data/material not ready
  if (!atlasMaterial || !atlasData || !geometryWithAttributes || !sortedImages.length) {
    return <FallbackUI sortedImages={sortedImages} onThumbnailClick={handleThumbnailClick} />
  }

  const instanceCount = instanceTransforms.positions.length

  return (
    <group position={[0, -30, 0]}>
      {/* Vertical decade background */}
      <DecadeDiagonalBackground
        yearKeys={yearKeys}
        yearPositions={yearPositions}
        height={500} // Much larger height to extend stripes further at top and bottom
        lineWidth={0.15}
        opacity={0.4}
        lineColor={new THREE.Color(0.25, 0.25, 0.3)}
        backgroundColor={new THREE.Color("#18181a")} // Match the overall background color
        dashLength={dashLength}
        gapLength={dashGap}
        dashSpeed={dashSpeed}
      />

      <group position={[0, -1, 0]}>
        {/* <TimelineAxis
          yearKeys={yearKeys}
          yearPositions={yearPositions}
          thumbnailHeight={thumbnailHeight}
          majorTickEvery={majorTickEvery}
          showAxis={showAxis}
        /> */}
        <YearLabels
          yearLabels={instanceTransforms.yearColumnLabels}
          thumbnailHeight={thumbnailHeight}
          showAllYearLabels={showAllYearLabels}
          majorTickEvery={majorTickEvery}
        />
      </group>

      <ThumbnailMesh
        geometry={geometryWithAttributes}
        material={atlasMaterial}
        instanceCount={instanceCount}
        positions={instanceTransforms.positions}
        scales={instanceTransforms.scales}
        sortedImages={sortedImages}
        onThumbnailClick={handleThumbnailClick}
      />

      <group position={[0, -7, 0]}>
        <Events
          eventGroups={eventGroups}
          yearPositions={yearPositions}
          thumbnailHeight={thumbnailHeight}
          gapBetweenGroups={eventGap}
        />
      </group>
    </group>
  )
}

export default Atlas
