import { EventsProps } from "../../types/events"
import { useEventProcessing, usePillControls } from "../../hooks/useEventsData"
import { useEventSelection } from "../../hooks/useEventSelection"
import { useSidebarGallery } from "../../hooks/useSidebarGalleryContext"
import EventGroup from "./EventGroup"

const Events = ({
  eventGroups,
  yearPositions,
  thumbnailHeight,
  gapBetweenGroups = 0.15,
  selection: externalSelection,
  selectedYear = null,
  onHoverChange,
  onProcessed,
}: EventsProps) => {
  // Get focused year from context
  const { focusedYear } = useSidebarGallery()

  // Process event groups into renderable data
  const processedEventGroups = useEventProcessing(eventGroups, yearPositions, gapBetweenGroups, onProcessed)

  // Handle selection state
  const { selection } = useEventSelection(externalSelection, processedEventGroups)

  // Pill controls and geometry
  const { pillWidth, pillHeight, pillGeometry } = usePillControls()

  // Position events below the timeline
  const eventBaseY = -thumbnailHeight * 0.5 - 0.3

  return (
    <group name="timeline-events">
      {processedEventGroups.map((group, groupIndex) => (
        <EventGroup
          key={group.name}
          group={group}
          groupIndex={groupIndex}
          eventBaseY={eventBaseY}
          pillWidth={pillWidth}
          pillHeight={pillHeight}
          pillGeometry={pillGeometry}
          selection={selection}
          selectedYear={selectedYear}
          focusedYear={focusedYear}
        />
      ))}
    </group>
  )
}

export default Events
