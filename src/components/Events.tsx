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

  // Process event groups into renderable data
  const processedEventGroups = useMemo(() => {
    return eventGroups.map((group, groupIndex) => {
      const processedEvents = group.events.map((event, eventIndex) => {
        const startYear = getYearFromDate(event.startDate)
        const startPos = getPositionForYear(startYear)

        let endPos = null
        let isRange = false

        if (event.endDate && event.endDate.trim() !== "") {
          const endYear = getYearFromDate(event.endDate)
          endPos = getPositionForYear(endYear)
          isRange = true
        }

        return {
          id: `${groupIndex}-${eventIndex}`,
          startPos,
          endPos,
          isRange,
          event,
          startYear,
          endYear: isRange ? getYearFromDate(event.endDate!) : null,
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

  // For each group we create an instanced mesh
  return (
    <group name="timeline-events">
      {processedEventGroups.map((group) => {
        const count = group.processedEvents.length
        const ref = useRef<THREE.InstancedMesh | null>(null)
        const color = new THREE.Color(group.color)
        const dummy = new THREE.Object3D()
        const tempMatrix = new THREE.Matrix4()

        useLayoutEffect(() => {
          if (!ref.current) return
          group.processedEvents.forEach((processedEvent, i) => {
            const { startPos, endPos, isRange } = processedEvent
            const eventY = eventBaseY - group.yOffset

            const width = isRange && endPos != null ? Math.max(0.0001, endPos - startPos) : 1
            const centerX = isRange && endPos != null ? startPos + width * 0.5 : startPos

            dummy.position.set(centerX - 0.5, eventY, 0.002) // offset to align like previous
            dummy.scale.set(width, 0.5, 1)
            dummy.rotation.set(0, 0, 0)
            dummy.updateMatrix()
            ref.current!.setMatrixAt(i, dummy.matrix)
          })
          ref.current.instanceMatrix.needsUpdate = true
        }, [group.processedEvents, eventBaseY, group.yOffset])

        const onClick = useCallback(
          (e) => {
            e.stopPropagation()
            const instanceId = e.instanceId
            group.processedEvents[instanceId] && handleEventClick(group.processedEvents[instanceId].event, group.name)
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
            <planeGeometry args={[1, 0.5]} />
            <meshBasicMaterial color={color} />
          </instancedMesh>
        )
      })}
    </group>
  )
}

export default Events
