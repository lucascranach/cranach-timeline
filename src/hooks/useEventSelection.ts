import { useState, useEffect, useRef, useCallback } from "react"
import { ProcessedEvent, ProcessedEventGroup, EventsProps, EventSelectionState } from "../types/events"

/**
 * Hook for managing event selection and hover states
 */
export const useEventSelection = (
  externalSelection: EventsProps["selection"],
  processedEventGroups: ProcessedEventGroup[],
  onSelect: EventsProps["onSelect"],
  onHoverChange: EventsProps["onHoverChange"]
): EventSelectionState => {
  // Internal fallback selection if not controlled
  const [internalSelection, setInternalSelection] = useState<{ group: string; instance: number } | null>(null)
  const selection = externalSelection !== undefined ? externalSelection : internalSelection
  const [hovered, setHovered] = useState<{ group: string; instance: number } | null>(null)
  const lastActiveRef = useRef<string | null>(null)

  // Handle click on event
  const handleEventClick = useCallback(
    (processed: ProcessedEvent, groupData: ProcessedEventGroup, instanceId: number) => {
      onSelect?.({ group: groupData.name, instance: instanceId, processed, groupData })
      if (externalSelection === undefined) {
        setInternalSelection({ group: groupData.name, instance: instanceId })
      }
    },
    [onSelect, externalSelection]
  )

  // Log active event changes
  useEffect(() => {
    if (!selection) {
      lastActiveRef.current = null
      return
    }

    const groupData = processedEventGroups.find((g) => g.name === selection.group)
    const processed = groupData?.processedEvents[selection.instance]
    if (!processed) return

    const key = `${selection.group}-${selection.instance}`
    if (lastActiveRef.current === key) return

    lastActiveRef.current = key
    console.log("Active event", {
      group: selection.group,
      event: processed.event,
      startYear: processed.startYear,
    })
  }, [selection, processedEventGroups])

  // Handle hover changes
  const handleHoverChange = useCallback(
    (payload: { group: string; instance: number } | null) => {
      setHovered(payload)
      onHoverChange?.(payload)
    },
    [onHoverChange]
  )

  return {
    selection,
    hovered,
    setHovered,
    handleEventClick,
  }
}
