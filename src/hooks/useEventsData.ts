import { useMemo, useEffect } from "react"
import { useControls } from "leva"
import { EventGroup, ProcessedEventGroup, PillControlsConfig } from "../types/events"
import { processEventGroups, createPillGeometry } from "../utils/eventsUtils"

/**
 * Hook for processing event groups into renderable data
 */
export const useEventProcessing = (
  eventGroups: EventGroup[],
  yearPositions: Record<string, number>,
  gapBetweenGroups: number,
  onProcessed?: (groups: ProcessedEventGroup[]) => void
) => {
  const processedEventGroups = useMemo(() => {
    return processEventGroups(eventGroups, yearPositions, gapBetweenGroups)
  }, [eventGroups, yearPositions, gapBetweenGroups])

  // Expose processed groups upward when they change
  useEffect(() => {
    onProcessed?.(processedEventGroups)
  }, [processedEventGroups, onProcessed])

  return processedEventGroups
}

/**
 * Hook for managing pill controls and geometry
 */
export const usePillControls = () => {
  const { pillWidth, pillHeight, pillRadius } = useControls("Event Pills", {
    pillWidth: { value: 1, min: 0.2, max: 3, step: 0.05 },
    pillHeight: { value: 1.5, min: 0.1, max: 1.5, step: 0.05 },
    pillRadius: { value: 1.0, min: 0, max: 1, step: 0.01 },
  })

  const config: PillControlsConfig = { pillWidth, pillHeight, pillRadius }

  const pillGeometry = useMemo(() => {
    return createPillGeometry(config)
  }, [pillWidth, pillHeight, pillRadius])

  useEffect(() => {
    return () => pillGeometry.dispose()
  }, [pillGeometry])

  return { pillWidth, pillHeight, pillRadius, pillGeometry }
}
