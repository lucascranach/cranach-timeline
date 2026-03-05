import { useState, useEffect, useRef } from "react"
import { ProcessedEvent, ProcessedEventGroup, EventsProps, EventSelectionState } from "../types/events"

/**
 * Hook for managing event selection state
 */
export const useEventSelection = (
  externalSelection: EventsProps["selection"],
  processedEventGroups: ProcessedEventGroup[]
): EventSelectionState => {
  // Internal fallback selection if not controlled
  const [internalSelection, setInternalSelection] = useState<{ group: string; instance: number } | null>(null)
  const selection = externalSelection !== undefined ? externalSelection : internalSelection
  const lastActiveRef = useRef<string | null>(null)

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

  return {
    selection,
  }
}
