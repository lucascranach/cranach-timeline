import { useEffect, useCallback } from "react"
import { SelectionState } from "@/types/atlas"
import { ProcessedEventGroup } from "@/types/events"

interface UseKeyboardNavigationProps {
  selection: SelectionState | null
  processedGroups: ProcessedEventGroup[]
  onSelectionChange: (selection: SelectionState | null) => void
}

/**
 * Hook to handle keyboard navigation through events using arrow keys
 */
export const useKeyboardNavigation = ({
  selection,
  processedGroups,
  onSelectionChange,
}: UseKeyboardNavigationProps) => {
  const moveHorizontal = useCallback(
    (dir: 1 | -1): SelectionState | null => {
      const maxGroups = processedGroups.length
      let newSel: SelectionState | null = selection ? { ...selection, centerOnSelect: true } : null

      if (!newSel) {
        // Initialize at first available event
        for (let gi = 0; gi < maxGroups; gi++) {
          const g = processedGroups[gi]
          if (g.processedEvents.length) {
            return {
              groupIndex: gi,
              eventIndex: dir === 1 ? 0 : g.processedEvents.length - 1,
              centerOnSelect: true,
            }
          }
        }
        return null
      }

      const g = processedGroups[newSel.groupIndex]
      if (!g) return newSel

      const count = g.processedEvents.length
      if (!count) return newSel

      let idx = newSel.eventIndex + dir
      idx = Math.max(0, Math.min(count - 1, idx))

      return { groupIndex: newSel.groupIndex, eventIndex: idx, centerOnSelect: true }
    },
    [selection, processedGroups]
  )

  const moveVertical = useCallback(
    (dir: 1 | -1): SelectionState | null => {
      const maxGroups = processedGroups.length
      let newSel: SelectionState | null = selection ? { ...selection, centerOnSelect: true } : null

      if (!newSel) {
        // Initialize at first event of first group
        return moveHorizontal(1)
      }

      const prevGroup = processedGroups[newSel.groupIndex]
      const prevEvent = prevGroup?.processedEvents[newSel.eventIndex]
      const prevPos = prevEvent?.startPos ?? null

      let gi = newSel.groupIndex + dir
      gi = Math.max(0, Math.min(maxGroups - 1, gi))

      const g = processedGroups[gi]
      if (!g || !g.processedEvents.length) return newSel

      // Try to find closest event by position
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

      return { groupIndex: gi, eventIndex: ei, centerOnSelect: true }
    },
    [selection, processedGroups, moveHorizontal]
  )

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ignore if Escape key (handled elsewhere)
      if (e.key === "Escape") return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const target = e.target as HTMLElement
      const tag = target?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return

      if (!processedGroups.length) return

      let newSel: SelectionState | null = null
      let handled = false

      switch (e.key) {
        case "ArrowRight":
          newSel = moveHorizontal(1)
          handled = true
          break
        case "ArrowLeft":
          newSel = moveHorizontal(-1)
          handled = true
          break
        case "ArrowDown":
          newSel = moveVertical(1)
          handled = true
          break
        case "ArrowUp":
          newSel = moveVertical(-1)
          handled = true
          break
      }

      if (handled) {
        e.preventDefault()
        // Only update if selection actually changed
        if (
          !selection ||
          !newSel ||
          selection.groupIndex !== newSel.groupIndex ||
          selection.eventIndex !== newSel.eventIndex ||
          selection.centerOnSelect !== newSel.centerOnSelect
        ) {
          onSelectionChange(newSel)
        }
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [selection, processedGroups, moveHorizontal, moveVertical, onSelectionChange])
}
