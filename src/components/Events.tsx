import { useMemo } from "react"
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

  return (
    <group name="timeline-events">
      {processedEventGroups.map((group) => (
        <group key={group.name} name={`event-group-${group.name}`}>
          {group.processedEvents.map((processedEvent) => {
            const { id, startPos, endPos, isRange, event } = processedEvent
            const eventY = eventBaseY - group.yOffset

            if (isRange && endPos !== null) {
              // Render as a line for date ranges
              const lineWidth = endPos - startPos
              const centerX = startPos + lineWidth / 2

              return (
                <group key={`event-range-${id}`}>
                  {/* Line connecting start and end */}
                  <mesh position={[centerX, eventY, 0.001]} onClick={() => handleEventClick(event, group.name)}>
                    <planeGeometry args={[lineWidth, 0.02]} />
                    <meshBasicMaterial color={group.color} />
                  </mesh>

                  {/* Start marker */}
                  <mesh position={[startPos, eventY, 0.002]} onClick={() => handleEventClick(event, group.name)}>
                    <circleGeometry args={[0.05, 16]} />
                    <meshBasicMaterial color={group.color} />
                  </mesh>

                  {/* End marker */}
                  <mesh position={[endPos, eventY, 0.002]} onClick={() => handleEventClick(event, group.name)}>
                    <circleGeometry args={[0.05, 16]} />
                    <meshBasicMaterial color={group.color} />
                  </mesh>
                </group>
              )
            } else {
              // Render as a single point for single dates
              return (
                <mesh
                  key={`event-point-${id}`}
                  position={[startPos - 0.5, eventY, 0.002]}
                  onClick={() => handleEventClick(event, group.name)}
                >
                  <planeGeometry args={[1, 0.5]} />
                  <meshBasicMaterial color={group.color} />
                </mesh>
              )
            }
          })}
        </group>
      ))}
    </group>
  )
}

export default Events
