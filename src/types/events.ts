import * as THREE from "three"

export interface EventData {
  startDate: string
  endDate?: string
  description: string
}

export interface EventGroup {
  name: string
  color: string
  events: EventData[]
}

export interface ProcessedEvent {
  id: string
  startPos: number
  event: EventData
  startYear: number
}

export interface ProcessedEventGroup extends EventGroup {
  processedEvents: ProcessedEvent[]
  yOffset: number
}

export interface EventsProps {
  eventGroups: EventGroup[]
  yearPositions: Record<string, number>
  thumbnailHeight: number
  gapBetweenGroups?: number
  /** Currently selected event, managed externally */
  selection?: { group: string; instance: number } | null
  /** Year of the selected event to highlight related events */
  selectedYear?: number | null
  /** Expose processed data */
  onProcessed?: (groups: ProcessedEventGroup[]) => void
}

export interface GroupOutlineProps {
  width: number
  height: number
  position: [number, number, number]
  color: THREE.ColorRepresentation
  thickness?: number
  isActive?: boolean
}

export interface GroupLabelProps {
  text: string
  position: [number, number, number]
  color: THREE.ColorRepresentation
  fontSize?: number
  isActive?: boolean
}

export interface EventGroupRenderProps {
  group: ProcessedEventGroup
  groupIndex: number
  eventBaseY: number
  pillWidth: number
  pillHeight: number
  pillGeometry: THREE.ShapeGeometry
  selection: { group: string; instance: number } | null
}

export interface GroupBounds {
  centerX: number
  centerY: number
  width: number
  height: number
}

export interface EventSelectionState {
  selection: { group: string; instance: number } | null
}

export interface PillControlsConfig {
  pillWidth: number
  pillHeight: number
  pillRadius: number
}
