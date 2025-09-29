import { useMemo } from "react"
import * as THREE from "three"
import { ProcessedEventGroup, GroupBounds } from "../../types/events"
import { ACTIVE_EVENT_SCALE, OUTLINE_PADDING_X, OUTLINE_PADDING_Y, createEventColors } from "../../utils/eventsUtils"
import GroupOutline from "./GroupOutline"
import GroupLabel from "./GroupLabel"
import EventPill from "./EventPill"

interface EventGroupProps {
  group: ProcessedEventGroup
  groupIndex: number
  eventBaseY: number
  pillWidth: number
  pillHeight: number
  pillGeometry: THREE.ShapeGeometry
  selection: { group: string; instance: number } | null
  hovered: { group: string; instance: number } | null
  onEventClick: (processed: any, groupData: ProcessedEventGroup, instanceId: number) => void
  onHoverChange: (payload: { group: string; instance: number } | null) => void
  setHovered: React.Dispatch<React.SetStateAction<{ group: string; instance: number } | null>>
}

const EventGroup = ({
  group,
  groupIndex,
  eventBaseY,
  pillWidth,
  pillHeight,
  pillGeometry,
  selection,
  hovered,
  onEventClick,
  onHoverChange,
  setHovered,
}: EventGroupProps) => {
  const count = group.processedEvents.length
  if (count === 0) return null

  // Calculate group bounds for outline
  const bounds = useMemo<GroupBounds | null>(() => {
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
  }, [group.processedEvents, pillWidth, pillHeight, eventBaseY, group.yOffset])

  const { outlineColor } = createEventColors(group.color)

  return (
    <group key={group.name} name={`event-group-${group.name}`}>
      {bounds ? (
        <>
          <GroupLabel
            text={group.name}
            position={[bounds.centerX - bounds.width / 2 - 0.5, bounds.centerY, 0.005]}
            color={outlineColor}
            fontSize={16}
          />
          <GroupOutline
            width={bounds.width}
            height={bounds.height}
            position={[bounds.centerX, bounds.centerY, 0.001]}
            color={outlineColor}
          />
        </>
      ) : null}

      <EventPill
        group={group}
        eventBaseY={eventBaseY}
        pillWidth={pillWidth}
        pillGeometry={pillGeometry}
        selection={selection}
        hovered={hovered}
        onEventClick={onEventClick}
        onHoverChange={onHoverChange}
        setHovered={setHovered}
      />
    </group>
  )
}

export default EventGroup
