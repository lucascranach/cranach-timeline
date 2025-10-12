import { useLoader, useFrame } from "@react-three/fiber"
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
import Events from "./events/Events"
import { ProcessedEventGroup } from "../types/events"
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
    file: "/timeline/events/cranachElderEvents_en.json",
    name: "Cranach Elder",
    color: "#FEB701",
  },
  {
    file: "/timeline/events/cranachYoungerEvents_en.json",
    name: "Cranach Younger",
    color: "#FEB701",
  },
  {
    file: "/timeline/events/historyEvents_en.json",
    name: "History",
    color: "#FEB701",
  },
  {
    file: "/timeline/events/lutherEvents_en.json",
    name: "Luther",
    color: "#FEB701",
  },
]

type SelectionState = {
  groupIndex: number
  eventIndex: number
  centerOnSelect?: boolean
}

const Atlas = () => {
  const atlasTexture = useLoader(THREE.TextureLoader, "/timeline/atlas/texture_atlas.webp")

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
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const selectionRef = useRef<SelectionState | null>(null)
  const autoSelectBlockRef = useRef<number>(0)
  const getNow = useCallback(() => (typeof performance !== "undefined" ? performance.now() : Date.now()), [])

  useEffect(() => {
    selectionRef.current = selection
  }, [selection])

  // Helper to dispatch camera center event
  const centerOnX = useCallback((x: number) => {
    const evt = new CustomEvent("timeline-center", { detail: { x } })
    window.dispatchEvent(evt)
  }, [])

  // When selection changes, auto center
  useEffect(() => {
    if (!selection || selection.centerOnSelect === false) return
    const group = processedGroupsRef.current[selection.groupIndex]
    if (!group) return
    const ev = group.processedEvents[selection.eventIndex]
    if (!ev) return
    autoSelectBlockRef.current = getNow() + 800
    centerOnX(ev.startPos)
  }, [selection, centerOnX, getNow])

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement
      const tag = target?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return
      if (!processedGroupsRef.current.length) return

      const maxGroups = processedGroupsRef.current.length
      let newSel: SelectionState | null = selection ? { ...selection, centerOnSelect: true } : null

      const moveHorizontal = (dir: 1 | -1) => {
        if (!newSel) {
          // Initialize at first available event
          for (let gi = 0; gi < maxGroups; gi++) {
            const g = processedGroupsRef.current[gi]
            if (g.processedEvents.length) {
              newSel = {
                groupIndex: gi,
                eventIndex: dir === 1 ? 0 : g.processedEvents.length - 1,
                centerOnSelect: true,
              }
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
        newSel = { groupIndex: newSel.groupIndex, eventIndex: idx, centerOnSelect: true }
      }

      const moveVertical = (dir: 1 | -1) => {
        if (!newSel) {
          // initialize at first event of first group
          moveHorizontal(1)
          return
        }
        const prevGroup = processedGroupsRef.current[newSel.groupIndex]
        const prevEvent = prevGroup?.processedEvents[newSel.eventIndex]
        const prevPos = prevEvent?.startPos ?? null

        let gi = newSel.groupIndex + dir
        if (gi < 0) gi = 0
        if (gi > maxGroups - 1) gi = maxGroups - 1
        const g = processedGroupsRef.current[gi]
        if (!g || !g.processedEvents.length) return
        // Try to keep same eventIndex if possible
        let ei = newSel.eventIndex
        if (prevPos !== null) {
          let closestIndex = 0
          let closestDist = Infinity
          g.processedEvents.forEach((ev, index) => {
            const dist = Math.abs(ev.startPos - prevPos)
            if (dist < closestDist) {
              closestDist = dist
              closestIndex = index
            }
          })
          ei = closestIndex
        } else if (ei > g.processedEvents.length - 1) {
          ei = g.processedEvents.length - 1
        }
        newSel = { groupIndex: gi, eventIndex: ei, centerOnSelect: true }
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
        if (
          !selection ||
          selection.groupIndex !== newSel?.groupIndex ||
          selection.eventIndex !== newSel?.eventIndex ||
          selection.centerOnSelect !== newSel?.centerOnSelect
        ) {
          setSelection(newSel)
        }
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [selection])

  const handleEventSelect = useCallback(({ group, instance }: { group: string; instance: number }) => {
    const gi = processedGroupsRef.current.findIndex((g) => g.name === group)
    if (gi !== -1) {
      setSelection({ groupIndex: gi, eventIndex: instance, centerOnSelect: true })
    }
  }, [])

  useFrame((state) => {
    const now = getNow()
    if (now < autoSelectBlockRef.current) return
    const groups = processedGroupsRef.current
    if (!groups.length) return

    const cameraX = state.camera.position.x
    const current = selectionRef.current
    let activeGroupIndex = current?.groupIndex ?? -1
    if (activeGroupIndex < 0 || !groups[activeGroupIndex] || !groups[activeGroupIndex].processedEvents.length) {
      activeGroupIndex = groups.findIndex((g) => g.processedEvents.length > 0)
      if (activeGroupIndex === -1) return
    }

    const activeGroup = groups[activeGroupIndex]
    if (!activeGroup.processedEvents.length) return

    let bestEventIndex = 0
    let bestDist = Infinity
    activeGroup.processedEvents.forEach((ev, eventIndex) => {
      const dist = Math.abs(ev.startPos - cameraX)
      if (dist < bestDist) {
        bestDist = dist
        bestEventIndex = eventIndex
      }
    })

    const best: SelectionState = {
      groupIndex: activeGroupIndex,
      eventIndex: bestEventIndex,
      centerOnSelect: false,
    }

    if (current && current.groupIndex === best.groupIndex && current.eventIndex === best.eventIndex) return

    setSelection(best)
  })

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
      {/* <CameraPlane offset={[0, -25, -60]} size={[220, 49.1]} color={"#62646f"} opacity={0.6} depthTest={true} /> */}
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
