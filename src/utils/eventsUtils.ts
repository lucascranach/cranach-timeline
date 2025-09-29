import * as THREE from "three"
import {
  EventData,
  EventGroup,
  ProcessedEvent,
  ProcessedEventGroup,
  GroupBounds,
  PillControlsConfig,
} from "../types/events"

// Constants
export const ACTIVE_EVENT_SCALE = 2
export const OUTLINE_PADDING_X = 0.2
export const OUTLINE_PADDING_Y = 0.1
export const OUTLINE_THICKNESS = 0.05

/**
 * Convert date string to year
 */
export const getYearFromDate = (dateString: string): number => {
  return new Date(dateString).getFullYear()
}

/**
 * Interpolate position between years
 */
export const getPositionForYear = (year: number, yearPositions: Record<string, number>): number => {
  const yearStr = year.toString()
  if (yearPositions[yearStr]) {
    return yearPositions[yearStr]
  }

  // Find the two closest years and interpolate
  const years = Object.keys(yearPositions)
    .map((y) => parseInt(y))
    .sort((a, b) => a - b)

  let lowerYear = years[0]
  let upperYear = years[years.length - 1]

  for (let i = 0; i < years.length - 1; i++) {
    if (years[i] <= year && years[i + 1] >= year) {
      lowerYear = years[i]
      upperYear = years[i + 1]
      break
    }
  }

  if (lowerYear === upperYear) {
    return yearPositions[lowerYear.toString()]
  }

  // Linear interpolation
  const t = (year - lowerYear) / (upperYear - lowerYear)
  const lowerPos = yearPositions[lowerYear.toString()]
  const upperPos = yearPositions[upperYear.toString()]
  return lowerPos + t * (upperPos - lowerPos)
}

/**
 * Process event groups into renderable data (single point events only, no ranges)
 */
export const processEventGroups = (
  eventGroups: EventGroup[],
  yearPositions: Record<string, number>,
  gapBetweenGroups: number
): ProcessedEventGroup[] => {
  return eventGroups.map((group, groupIndex) => {
    const processedEvents: ProcessedEvent[] = group.events.map((event, eventIndex) => {
      const startYear = getYearFromDate(event.startDate)
      const startPos = getPositionForYear(startYear, yearPositions)
      return {
        id: `${groupIndex}-${eventIndex}`,
        startPos,
        event,
        startYear,
      }
    })
    return {
      ...group,
      processedEvents,
      yOffset: groupIndex * gapBetweenGroups,
    }
  })
}

/**
 * Create pill geometry from controls
 */
export const createPillGeometry = (config: PillControlsConfig): THREE.ShapeGeometry => {
  const { pillWidth: width, pillHeight: height, pillRadius } = config
  const r = Math.min(pillRadius, width / 2, height / 2)
  const shape = new THREE.Shape()
  const x = -width / 2
  const y = -height / 2

  shape.moveTo(x + r, y)
  shape.lineTo(x + width - r, y)
  shape.quadraticCurveTo(x + width, y, x + width, y + r)
  shape.lineTo(x + width, y + height - r)
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  shape.lineTo(x + r, y + height)
  shape.quadraticCurveTo(x, y + height, x, y + height - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)

  return new THREE.ShapeGeometry(shape)
}

/**
 * Calculate group bounds for outlines
 */
export const calculateGroupBounds = (
  processedEventGroups: ProcessedEventGroup[],
  pillWidth: number,
  pillHeight: number,
  eventBaseY: number
): (GroupBounds | null)[] => {
  return processedEventGroups.map((group) => {
    const count = group.processedEvents.length
    if (!count) return null

    let minLeft = Infinity
    let maxRight = -Infinity
    const halfWidth = (pillWidth * ACTIVE_EVENT_SCALE) / 2

    group.processedEvents.forEach((processedEvent) => {
      const centerX = processedEvent.startPos - pillWidth
      const left = centerX - halfWidth
      const right = centerX + halfWidth
      if (left < minLeft) minLeft = left
      if (right > maxRight) maxRight = right
    })

    if (!isFinite(minLeft) || !isFinite(maxRight)) {
      return null
    }

    minLeft -= OUTLINE_PADDING_X
    maxRight += OUTLINE_PADDING_X

    const baseCenterY = eventBaseY - group.yOffset
    const halfHeight = (pillHeight * ACTIVE_EVENT_SCALE) / 2 + OUTLINE_PADDING_Y

    return {
      centerX: (minLeft + maxRight) / 2,
      centerY: baseCenterY,
      width: maxRight - minLeft,
      height: halfHeight * 2,
    }
  })
}

/**
 * Create colors for event pills
 */
export const createEventColors = (groupColor?: string) => {
  const baseColor = new THREE.Color("#b4b4b4")
  const highlightColor = new THREE.Color(groupColor || "#FEB701")
  const outlineColor = highlightColor.clone().lerp(new THREE.Color("#ffffff"), 0.4)

  return { baseColor, highlightColor, outlineColor }
}
