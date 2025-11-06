import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useSidebarGallery } from "./useSidebarGalleryContext"
import { AtlasImage } from "@/types/atlas"
import { ProcessedEventGroup } from "@/types/events"

interface UseFocusedYearProps {
  yearPositions: Record<string, number>
  groupedByYear: Record<string, AtlasImage[]>
  allEventGroups: ProcessedEventGroup[]
}

/**
 * Hook that tracks the camera position and updates the sidebar with the focused year's data
 */
export const useFocusedYear = ({ yearPositions, groupedByYear, allEventGroups }: UseFocusedYearProps) => {
  const { camera } = useThree()
  const { setFocusedYearData, setSidebarMode, sidebarMode, setScrollDirection, setAllYearSlides } = useSidebarGallery()
  const lastYearRef = useRef<number | null>(null)
  const lastCameraXRef = useRef<number>(camera.position.x)
  const scrollDirectionRef = useRef<"left" | "right" | null>(null)

  useFrame(() => {
    if (!yearPositions || Object.keys(yearPositions).length === 0) return

    const cameraX = camera.position.x

    // Track camera movement direction - only update state if changed
    const deltaX = cameraX - lastCameraXRef.current
    if (Math.abs(deltaX) > 0.01) {
      const newDirection = deltaX > 0 ? "right" : "left"
      if (scrollDirectionRef.current !== newDirection) {
        scrollDirectionRef.current = newDirection
        setScrollDirection(newDirection)
      }
    }
    lastCameraXRef.current = cameraX

    // Find the closest year based on camera X position
    let closestYear: string | null = null
    let minDistance = Infinity

    Object.entries(yearPositions).forEach(([year, xPos]) => {
      const distance = Math.abs(xPos - cameraX)
      if (distance < minDistance) {
        minDistance = distance
        closestYear = year
      }
    })

    if (!closestYear) return

    const focusedYear = parseInt(closestYear, 10)

    // Only update if the year has changed
    if (lastYearRef.current !== focusedYear) {
      lastYearRef.current = focusedYear

      // Get all events for this year
      const yearEvents = allEventGroups
        .map((group) => ({
          ...group,
          processedEvents: group.processedEvents.filter((evt) => evt.startYear === focusedYear),
        }))
        .filter((group) => group.processedEvents.length > 0)

      // Get all images for this year
      const yearImages = groupedByYear[closestYear] || []

      // Only update sidebar if we're in focused-year mode or no mode is set
      if (sidebarMode === "focused-year" || sidebarMode === null) {
        setFocusedYearData({
          year: focusedYear,
          events: yearEvents,
          images: yearImages,
        })
        setSidebarMode("focused-year")
      }
    }
  })

  // Prepare all year slides whenever data changes
  useEffect(() => {
    if (yearPositions && Object.keys(yearPositions).length > 0 && allEventGroups.length > 0) {
      // Prepare all year slides
      const allYears = Object.keys(yearPositions).sort()
      const slides = allYears.map((yearStr) => {
        const year = parseInt(yearStr, 10)
        const yearEvents = allEventGroups
          .map((group) => ({
            ...group,
            processedEvents: group.processedEvents.filter((evt) => evt.startYear === year),
          }))
          .filter((group) => group.processedEvents.length > 0)

        const yearImages = groupedByYear[yearStr] || []

        return {
          year,
          events: yearEvents,
          images: yearImages,
        }
      })

      setAllYearSlides(slides)
    }
  }, [yearPositions, allEventGroups, groupedByYear, setAllYearSlides])

  // Initialize with a default year on mount
  useEffect(() => {
    if (sidebarMode === null && yearPositions && Object.keys(yearPositions).length > 0) {
      // Set initial focused year
      const cameraX = camera.position.x
      let closestYear: string | null = null
      let minDistance = Infinity

      Object.entries(yearPositions).forEach(([year, xPos]) => {
        const distance = Math.abs(xPos - cameraX)
        if (distance < minDistance) {
          minDistance = distance
          closestYear = year
        }
      })

      if (closestYear) {
        const focusedYear = parseInt(closestYear, 10)
        const yearEvents = allEventGroups
          .map((group) => ({
            ...group,
            processedEvents: group.processedEvents.filter((evt) => evt.startYear === focusedYear),
          }))
          .filter((group) => group.processedEvents.length > 0)

        const yearImages = groupedByYear[closestYear] || []

        setFocusedYearData({
          year: focusedYear,
          events: yearEvents,
          images: yearImages,
        })
        setSidebarMode("focused-year")
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarMode, yearPositions]) // Only run when sidebarMode becomes null or yearPositions change
}
