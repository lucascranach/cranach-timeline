import { useLoader } from "@react-three/fiber"
import * as THREE from "three"
import CameraPlane from "./CameraPlane"
import { AtlasShaderMaterialTSL } from "@/shader/tsl/AtlasShaderMaterialTSL"
import { DecadeDiagonalBackground } from "@/shader/tsl/DecadeDiagonalShaderTSL"
import { useMemo, useState, useCallback, useEffect, useRef } from "react"
import { useAtlasControls } from "@/hooks/useAtlasControls"
import { useAtlasData } from "@/hooks/useAtlasData"
import { useAtlasGeometry } from "@/hooks/useAtlasGeometry"
import { useAtlasTransforms } from "@/hooks/useAtlasTransforms"
import TimelineAxis from "./TimelineAxis"
import YearLabels from "./YearLabels"
import ThumbnailMesh from "./ThumbnailMesh"
import FallbackUI from "./FallbackUI"
import Events, { ProcessedEventGroup } from "./Events"
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
    atlasY,
  } = controls

  // Load and process atlas data
  const { atlasData, sortedImages, groupedByYear, yearKeys, yearPositions } = useAtlasData(yearSpacing)

  // Load events data
  const { eventGroups } = useEvents(EVENT_FILE_CONFIGS)

  // Processed groups reference (from Events child)
  const processedGroupsRef = useRef<ProcessedEventGroup[]>([])
  const [selection, setSelection] = useState<{ groupIndex: number; eventIndex: number } | null>(null)

  // Helper to dispatch camera center event
  const centerOnX = useCallback((x: number) => {
    const evt = new CustomEvent("timeline-center", { detail: { x } })
    window.dispatchEvent(evt)
  }, [])

  // When selection changes, auto center
  useEffect(() => {
    if (!selection) return
    const group = processedGroupsRef.current[selection.groupIndex]
    if (!group) return
    const ev = group.processedEvents[selection.eventIndex]
    if (!ev) return
    centerOnX(ev.startPos)
  }, [selection, centerOnX])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement
      const tag = target?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return
      if (!processedGroupsRef.current.length) return

      const maxGroups = processedGroupsRef.current.length
      let newSel = selection

      const moveHorizontal = (dir: 1 | -1) => {
        if (!newSel) {
          // Initialize at first available event
          for (let gi = 0; gi < maxGroups; gi++) {
            const g = processedGroupsRef.current[gi]
            if (g.processedEvents.length) {
              newSel = { groupIndex: gi, eventIndex: dir === 1 ? 0 : g.processedEvents.length - 1 }
              return
            }
          }
          return
        }
        const g = processedGroupsRef.current[newSel.groupIndex]
        if (!g) return
        const count = g.processedEvents.length
        if (!count) return
        let idx = newSel.eventIndex + dir
        if (idx < 0) idx = 0
        if (idx > count - 1) idx = count - 1
        newSel = { groupIndex: newSel.groupIndex, eventIndex: idx }
      }

      const moveVertical = (dir: 1 | -1) => {
        if (!newSel) {
          // initialize at first event of first group
          moveHorizontal(1)
          return
        }
        let gi = newSel.groupIndex + dir
        if (gi < 0) gi = 0
        if (gi > maxGroups - 1) gi = maxGroups - 1
        const g = processedGroupsRef.current[gi]
        if (!g || !g.processedEvents.length) return
        // Try to keep same eventIndex if possible
        let ei = newSel.eventIndex
        if (ei > g.processedEvents.length - 1) ei = g.processedEvents.length - 1
        newSel = { groupIndex: gi, eventIndex: ei }
      }

      let handled = false
      switch (e.key) {
        case "ArrowRight":
          moveHorizontal(1)
          handled = true
          break
        case "ArrowLeft":
          moveHorizontal(-1)
          handled = true
          break
        case "ArrowDown":
          moveVertical(1)
          handled = true
          break
        case "ArrowUp":
          moveVertical(-1)
          handled = true
          break
      }
      if (handled) {
        e.preventDefault()
        if (newSel !== selection) setSelection(newSel)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [selection])

  const handleEventSelect = useCallback(({ group, instance }: { group: string; instance: number }) => {
    const gi = processedGroupsRef.current.findIndex((g) => g.name === group)
    if (gi !== -1) {
      setSelection({ groupIndex: gi, eventIndex: instance })
    }
  }, [])

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
    <group position={[0, atlasY, 0]}>
      {/* Vertical decade background */}
      <CameraPlane offset={[0, -25, -60]} size={[220, 49.1]} color={"#0f0f10"} opacity={0.6} depthTest={true} />
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

      <group position={[0, 0, 0]}>
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
          selection={
            selection
              ? { group: processedGroupsRef.current[selection.groupIndex]?.name, instance: selection.eventIndex }
              : null
          }
          onSelect={({ group, instance }) => handleEventSelect({ group, instance })}
          onProcessed={(groups) => {
            processedGroupsRef.current = groups
          }}
        />
      </group>
    </group>
  )
}

export default Atlas
