import { useLoader } from "@react-three/fiber"
import * as THREE from "three"
import { AtlasShaderMaterialTSL } from "@/shader/tsl/AtlasShaderMaterialTSL"
import { useMemo, useState, useCallback, useEffect, useRef } from "react"
import { useAtlasControls } from "@/hooks/useAtlasControls"
import { useAtlasData } from "@/hooks/useAtlasData"
import { useAtlasGeometry } from "@/hooks/useAtlasGeometry"
import { useAtlasTransforms } from "@/hooks/useAtlasTransforms"
import { useZoomContext } from "@/hooks/useZoomContext"
import { useSelectedEvent } from "@/hooks/useSelectedEventContext"
import { useZoomAnimation } from "@/hooks/useZoomAnimation"
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation"
import { useEventAutoSelection } from "@/hooks/useEventAutoSelection"
import { useEvents } from "@/hooks/useEvents"
import { useSidebarGallery } from "@/hooks/useSidebarGalleryContext"
import YearLabels from "./YearLabels"
import ThumbnailMesh from "./ThumbnailMesh"
import FallbackUI from "./FallbackUI"
import DecadeBackgrounds from "./DecadeBackgrounds"
import Events from "@/components/events/Events"
import EventInfo3D from "./EventInfo3D"
import { ProcessedEventGroup } from "@/types/events"
import { AtlasImage, SelectionState } from "@/types/atlas"
import { EVENT_FILE_CONFIGS } from "@/constants/eventConfigs"

/**
 * Main Atlas component - renders the timeline with thumbnails, events, and backgrounds
 */
const Atlas = () => {
  const atlasTexture = useLoader(THREE.TextureLoader, "/timeline/atlas/texture_atlas.webp")

  // Controls and context
  const controls = useAtlasControls()
  const { targetZoom } = useZoomContext()
  const { setSelectedEvent, selectedEvent, selectedGroupName, selectedEventPosition } = useSelectedEvent()
  const { setColumnData } = useSidebarGallery()

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
    showAllYearLabels,
    majorTickEvery,
    eventGap,
    dashLength,
    dashGap,
    dashSpeed,
    atlasY,
    zoomMultiplier,
  } = controls

  // Zoom animation
  const { zoomProgress, zoomOriginX, isZooming } = useZoomAnimation({
    targetZoom,
    zoomMultiplier,
  })

  // Calculate effective dimensions with zoom interpolation
  const effectiveThumbnailWidth = useMemo(
    () => thumbnailWidth + (thumbnailWidth * zoomMultiplier - thumbnailWidth) * zoomProgress,
    [thumbnailWidth, zoomMultiplier, zoomProgress]
  )

  const effectiveThumbnailHeight = useMemo(
    () => thumbnailHeight + (thumbnailHeight * zoomMultiplier - thumbnailHeight) * zoomProgress,
    [thumbnailHeight, zoomMultiplier, zoomProgress]
  )

  const effectiveYearSpacing = useMemo(
    () => yearSpacing + (yearSpacing * zoomMultiplier - yearSpacing) * zoomProgress,
    [yearSpacing, zoomMultiplier, zoomProgress]
  )

  // Load atlas and events data
  const { atlasData, sortedImages, groupedByYear, yearKeys, yearPositions } = useAtlasData(
    effectiveYearSpacing,
    zoomOriginX,
    zoomProgress,
    zoomMultiplier
  )

  const { eventGroups } = useEvents(EVENT_FILE_CONFIGS)

  // Selection state management
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const processedGroupsRef = useRef<ProcessedEventGroup[]>([])
  const [selectedColumnInfo, setSelectedColumnInfo] = useState<{ year: string; column: number } | null>(null)

  // Camera centering helper
  const centerOnX = useCallback((x: number) => {
    const evt = new CustomEvent("timeline-center", { detail: { x } })
    window.dispatchEvent(evt)
  }, [])

  // Auto-selection based on camera position
  const { blockAutoSelect } = useEventAutoSelection({
    selection,
    processedGroups: processedGroupsRef.current,
    isZooming,
    onSelectionChange: setSelection,
  })

  // Keyboard navigation
  useKeyboardNavigation({
    selection,
    processedGroups: processedGroupsRef.current,
    onSelectionChange: setSelection,
  })

  // Update selected event context when selection changes
  useEffect(() => {
    if (!selection) {
      setSelectedEvent(null, null, null)
      return
    }

    const group = processedGroupsRef.current[selection.groupIndex]
    if (!group) {
      setSelectedEvent(null, null, null)
      return
    }

    const event = group.processedEvents[selection.eventIndex]
    if (!event) {
      setSelectedEvent(null, null, null)
      return
    }

    // Calculate event position for UI placement
    const eventBaseY = -thumbnailHeight * 0.5 - 0.3
    const eventY = eventBaseY - group.yOffset
    const position: [number, number, number] = [event.startPos, eventY, 0]

    setSelectedEvent(event, group.name, position)
  }, [selection, setSelectedEvent, thumbnailHeight])

  // Auto-center on selection changes
  useEffect(() => {
    if (!selection || selection.centerOnSelect === false) return

    const group = processedGroupsRef.current[selection.groupIndex]
    if (!group) return

    const ev = group.processedEvents[selection.eventIndex]
    if (!ev) return

    blockAutoSelect(800) // Block auto-selection during manual centering
    centerOnX(ev.startPos)
  }, [selection, centerOnX, blockAutoSelect])

  // Event handlers
  const handleEventSelect = useCallback(({ group, instance }: { group: string; instance: number }) => {
    const gi = processedGroupsRef.current.findIndex((g) => g.name === group)
    if (gi !== -1) {
      setSelection({ groupIndex: gi, eventIndex: instance, centerOnSelect: true })
    }
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelection(null)
  }, [])

  const handleThumbnailClick = useCallback(
    (index: number, imageData?: AtlasImage) => {
      if (!imageData || !atlasData) return
      console.log(`Thumbnail ${index} clicked`, imageData.sorting_number)

      // Extract year from sorting_number (format: "YYYY-XXX")
      const sortingNumber = imageData.sorting_number || ""
      const year = sortingNumber.split("-")[0]

      // Find all images in the same year
      const yearItems = groupedByYear[year] || []

      // Find which column this image is in within its year
      const indexInYear = yearItems.findIndex((img) => img.sorting_number === imageData.sorting_number)
      if (indexInYear === -1) return

      const column = indexInYear % columnsPerYear

      // Toggle: if clicking on the same column, deselect it
      if (selectedColumnInfo && selectedColumnInfo.year === year && selectedColumnInfo.column === column) {
        setSelectedColumnInfo(null)
        setColumnData(null)
        console.log("Deselected column")
        return
      }

      // Store the selected column info
      setSelectedColumnInfo({ year, column })

      // Get all images in the same column
      const columnImages = yearItems.filter((_, idx) => idx % columnsPerYear === column)

      // Remove duplicates based on sorting_number
      const uniqueColumnImages = columnImages.filter(
        (image, idx, arr) => arr.findIndex((img) => img.sorting_number === image.sorting_number) === idx
      )

      // Set the column data for the sidebar
      setColumnData({
        year,
        column,
        images: uniqueColumnImages,
      })

      console.log(
        `Column ${column} in year ${year}:`,
        uniqueColumnImages.map((img) => img.sorting_number)
      )
      if (columnImages.length !== uniqueColumnImages.length) {
        console.warn(
          `⚠️ Found ${columnImages.length - uniqueColumnImages.length} duplicate(s) in column ${column} of year ${year}`
        )
      }
    },
    [atlasData, groupedByYear, columnsPerYear, setColumnData, selectedColumnInfo]
  )

  // Create atlas material
  const atlasMaterial = useMemo(() => {
    if (!atlasTexture || !atlasData) return null

    return AtlasShaderMaterialTSL(atlasTexture, {
      mode: cropMode,
      offsetX: cropOffsetX,
      offsetY: cropOffsetY,
      scale: cropScale,
    })
  }, [atlasTexture, atlasData, cropMode, cropOffsetX, cropOffsetY, cropScale])

  // Geometry with attributes (uses base dimensions to prevent recreation during zoom)
  const geometryWithAttributes = useAtlasGeometry(
    atlasData,
    sortedImages,
    thumbnailWidth,
    thumbnailHeight,
    {
      mode: cropMode,
      offsetX: cropOffsetX,
      offsetY: cropOffsetY,
      scale: cropScale,
    },
    selectedColumnInfo,
    columnsPerYear,
    groupedByYear
  )

  // Instance transforms (uses effective dimensions for proper layout during zoom)
  const instanceTransforms = useAtlasTransforms(
    atlasData,
    sortedImages,
    yearKeys,
    groupedByYear,
    yearPositions,
    geometryWithAttributes,
    {
      columnsPerYear,
      preserveAspectRatio,
      thumbnailWidth: effectiveThumbnailWidth,
      thumbnailHeight: effectiveThumbnailHeight,
      rowSpacing,
    }
  )

  // Show fallback while loading
  if (!atlasMaterial || !atlasData || !geometryWithAttributes || !sortedImages.length) {
    return <FallbackUI sortedImages={sortedImages} onThumbnailClick={handleThumbnailClick} />
  }

  const instanceCount = instanceTransforms.positions.length

  return (
    <>
      {/* Background decade stripes */}
      <DecadeBackgrounds
        yearKeys={yearKeys}
        yearPositions={yearPositions}
        dashLength={dashLength}
        dashGap={dashGap}
        dashSpeed={dashSpeed}
        zoomProgress={zoomProgress}
      />

      {/* Main timeline group */}
      <group position={[0, atlasY, 0]}>
        {/* Year labels */}
        <YearLabels
          yearLabels={instanceTransforms.yearColumnLabels}
          thumbnailHeight={effectiveThumbnailHeight}
          showAllYearLabels={showAllYearLabels}
          majorTickEvery={majorTickEvery}
          yearPositions={yearPositions}
          isZoomed={zoomProgress > 0.5}
        />

        {/* Thumbnail mesh */}
        <ThumbnailMesh
          key="thumbnail-mesh"
          geometry={geometryWithAttributes}
          material={atlasMaterial}
          instanceCount={instanceCount}
          positions={instanceTransforms.positions}
          scales={instanceTransforms.scales}
          sortedImages={sortedImages}
          onThumbnailClick={handleThumbnailClick}
        />

        {/* Events group */}
        <group position={[0, -7, 0]}>
          <Events
            eventGroups={eventGroups}
            yearPositions={yearPositions}
            thumbnailHeight={effectiveThumbnailHeight}
            gapBetweenGroups={eventGap}
            selection={
              selection
                ? { group: processedGroupsRef.current[selection.groupIndex]?.name, instance: selection.eventIndex }
                : null
            }
            selectedYear={selectedEvent?.startYear ?? null}
            onSelect={handleEventSelect}
            onProcessed={(groups) => {
              processedGroupsRef.current = groups
            }}
          />

          {/* Event info panel */}
          {selectedEvent && selectedGroupName && selectedEventPosition && (
            <EventInfo3D
              event={selectedEvent}
              groupName={selectedGroupName}
              position={selectedEventPosition}
              onClear={handleClearSelection}
              allEventGroups={processedGroupsRef.current}
            />
          )}
        </group>
      </group>
    </>
  )
}

export default Atlas
