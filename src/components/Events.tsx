import { useMemo, useRef, useLayoutEffect, useCallback } from "react"
import * as THREE from "three"

interface EventData {
  startDate: string
  endDate?: string
  description: string
}

interface EventGroup {
  name: string
  color: string
  events: EventData[]
}

interface EventsProps {
  eventGroups: EventGroup[]
  yearPositions: Record<string, number>
  thumbnailHeight: number
  gapBetweenGroups?: number
}

const Events = ({ eventGroups, yearPositions, thumbnailHeight, gapBetweenGroups = 0.15 }: EventsProps) => {
  // Convert date string to year
  const getYearFromDate = (dateString: string): number => {
    return new Date(dateString).getFullYear()
  }

  // Interpolate position between years
  const getPositionForYear = (year: number): number => {
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

  // Process event groups into renderable data (single point events only, no ranges)
  const processedEventGroups = useMemo(() => {
    return eventGroups.map((group, groupIndex) => {
      const processedEvents = group.events.map((event, eventIndex) => {
        const startYear = getYearFromDate(event.startDate)
        const startPos = getPositionForYear(startYear)
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
  }, [eventGroups, yearPositions, gapBetweenGroups])

  // Handle click on event
  const handleEventClick = (eventData: EventData, groupName: string) => {
    console.log(`${groupName} event clicked:`, eventData.description)
  }

  // Position events below the timeline
  const eventBaseY = -thumbnailHeight * 0.5 - 0.3

  // Create pill (rounded rectangle) geometry once (width 1, height 0.5, radius 0.25)
  const pillGeometry = useMemo(() => {
    const width = 1
    const height = 0.5
    const r = Math.min(0.25, width / 2, height / 2)
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
  }, [])

  return (
    <group name="timeline-events">
      {processedEventGroups.map((group) => {
        const count = group.processedEvents.length
        if (count === 0) return null
        const ref = useRef<THREE.InstancedMesh | null>(null)
        const color = new THREE.Color(group.color)
        const dummy = new THREE.Object3D()

        useLayoutEffect(() => {
          if (!ref.current) return
          group.processedEvents.forEach((processedEvent, i) => {
            const { startPos } = processedEvent
            const eventY = eventBaseY - group.yOffset
            dummy.position.set(startPos - 0.5, eventY, 0.002)
            dummy.rotation.set(0, 0, 0)
            dummy.scale.set(1, 1, 1) // geometry already sized
            dummy.updateMatrix()
            ref.current!.setMatrixAt(i, dummy.matrix)
          })
          ref.current.instanceMatrix.needsUpdate = true
        }, [group.processedEvents, eventBaseY, group.yOffset])

        const onClick = useCallback(
          (e) => {
            e.stopPropagation()
            const instanceId = e.instanceId
            const data = group.processedEvents[instanceId]
            if (data) handleEventClick(data.event, group.name)
          },
          [group]
        )

        return (
          <instancedMesh
            key={group.name}
            name={`event-group-${group.name}`}
            ref={ref}
            args={[undefined, undefined, count]}
            onClick={onClick}
          >
            <primitive object={pillGeometry} attach="geometry" />
            <meshBasicMaterial color={color} />
          </instancedMesh>
        )
      })}
    </group>
  )
}

export default Events
