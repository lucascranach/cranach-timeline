import { useRef, useCallback } from "react"
import { useFrame } from "@react-three/fiber"
import { SelectionState } from "@/types/atlas"
import { ProcessedEventGroup } from "@/types/events"

interface UseEventAutoSelectionProps {
  selection: SelectionState | null
  processedGroups: ProcessedEventGroup[]
  isZooming: boolean
  onSelectionChange: (selection: SelectionState | null) => void
}

/**
 * Hook to handle automatic event selection based on camera position
 * Finds the closest event in the active group to the camera's x position
 */
export const useEventAutoSelection = ({
  selection,
  processedGroups,
  isZooming,
  onSelectionChange,
}: UseEventAutoSelectionProps) => {
  const selectionRef = useRef<SelectionState | null>(null)
  const autoSelectBlockRef = useRef<number>(0)

  const getNow = useCallback(() => (typeof performance !== "undefined" ? performance.now() : Date.now()), [])

  // Update ref when selection changes
  selectionRef.current = selection

  // Block auto-selection temporarily (used after manual centering)
  const blockAutoSelect = useCallback(
    (durationMs: number = 800) => {
      autoSelectBlockRef.current = getNow() + durationMs
    },
    [getNow]
  )

  useFrame((state) => {
    const now = getNow()

    // Skip if auto-selection is blocked
    if (now < autoSelectBlockRef.current) return

    // Don't auto-select during zoom transitions
    if (isZooming) return

    if (!processedGroups.length) return

    const cameraX = state.camera.position.x
    const current = selectionRef.current

    // Only run auto-selection if there's already a selection active
    if (!current) return

    const activeGroupIndex = current.groupIndex
    if (
      activeGroupIndex < 0 ||
      !processedGroups[activeGroupIndex] ||
      !processedGroups[activeGroupIndex].processedEvents.length
    ) {
      return
    }

    const activeGroup = processedGroups[activeGroupIndex]
    if (!activeGroup.processedEvents.length) return

    // Find closest event in the active group
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

    // Only update if selection changed
    if (current.groupIndex === best.groupIndex && current.eventIndex === best.eventIndex) {
      return
    }

    onSelectionChange(best)
  })

  return { blockAutoSelect }
}
