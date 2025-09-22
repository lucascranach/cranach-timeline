import { useMemo, useRef, useLayoutEffect, useCallback, useEffect, useState } from "react"
import * as THREE from "three"
import { useControls } from "leva"

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

  // Selection state: which event (by group + instance index) is currently selected
  const [selection, setSelection] = useState<{ group: string; instance: number } | null>(null)

  // Handle click on event
  const handleEventClick = (eventData: EventData, groupName: string) => {
    console.log(`${groupName} event clicked:`, eventData.description)
  }

  // Position events below the timeline
  const eventBaseY = -thumbnailHeight * 0.5 - 0.3

  // Leva controls for pill size
  const { pillWidth, pillHeight, pillRadius } = useControls("Event Pills", {
    pillWidth: { value: 1, min: 0.2, max: 3, step: 0.05 },
    pillHeight: { value: 1.5, min: 0.1, max: 1.5, step: 0.05 },
    pillRadius: { value: 1.0, min: 0, max: 1, step: 0.01 },
  })

  // Create pill geometry from controls
  const pillGeometry = useMemo(() => {
    const width = pillWidth
    const height = pillHeight
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
  }, [pillWidth, pillHeight, pillRadius])

  useEffect(() => () => pillGeometry.dispose(), [pillGeometry])

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
            // Align right edge with timeline position
            dummy.position.set(startPos - pillWidth, eventY, 0.002)
            dummy.rotation.set(0, 0, 0)
            dummy.scale.set(1, 1, 1)
            dummy.updateMatrix()
            ref.current!.setMatrixAt(i, dummy.matrix)
          })
          ref.current.instanceMatrix.needsUpdate = true
        }, [group.processedEvents, eventBaseY, group.yOffset, pillWidth])

        const onClick = useCallback(
          (e) => {
            e.stopPropagation()
            const instanceId = e.instanceId
            const data = group.processedEvents[instanceId]
            if (data) {
              handleEventClick(data.event, group.name)
              setSelection((prev) => {
                // Optional toggle off if clicking the already-selected event
                if (prev && prev.group === group.name && prev.instance === instanceId) return null
                return { group: group.name, instance: instanceId }
              })
            }
          },
          [group]
        )

        // Base (default) color is gray; highlight uses the group's configured color (fallback to #FEB701)
        const baseColor = new THREE.Color("#808080")
        const highlightColor = new THREE.Color(group.color || "#FEB701")

        // Initial color setup (all base color)
        useLayoutEffect(() => {
          if (!ref.current) return
          for (let i = 0; i < count; i++) {
            ref.current.setColorAt(i, baseColor)
          }
          ref.current.instanceColor!.needsUpdate = true
        }, [count, baseColor])

        // Update colors when selection changes
        useLayoutEffect(() => {
          if (!ref.current) return
          // If this group is selected, color ALL instances (including the clicked one) red
          if (selection && selection.group === group.name) {
            for (let i = 0; i < count; i++) {
              ref.current.setColorAt(i, highlightColor)
            }
          } else {
            // Reset to base color (either no selection or different group selected means no highlight here)
            for (let i = 0; i < count; i++) {
              ref.current.setColorAt(i, baseColor)
            }
          }
          ref.current.instanceColor!.needsUpdate = true
        }, [selection, count, group.name, baseColor, highlightColor])

        return (
          <instancedMesh
            key={group.name}
            name={`event-group-${group.name}`}
            ref={ref}
            args={[undefined, undefined, count]}
            onClick={onClick}
            onPointerOver={(e) => {
              e.stopPropagation()
              document.body.style.cursor = "pointer"
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto"
            }}
            frustumCulled={false}
          >
            <primitive object={pillGeometry} attach="geometry" />
            <meshBasicMaterial vertexColors />
          </instancedMesh>
        )
      })}
    </group>
  )
}

export default Events
