import { Html } from "@react-three/drei"
import styled from "styled-components"
import { useEffect, useState, useMemo } from "react"
import { FaChevronUp, FaChevronDown } from "react-icons/fa"
import { ProcessedEvent, ProcessedEventGroup } from "@/types/events"
import { useRelatedEventsContext } from "@/hooks/useRelatedEventsContext"

const EventInfoContainer = styled.div`
  max-width: 500px;
  min-width: 300px;
  color: white;
  font-family: "IBMPlexSans", sans-serif;
  background: rgba(0, 0, 0, 0.4);
  padding: 1.25rem 1.75rem;
  border-radius: 1rem;
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) inset,
    0 1px 0 0 rgba(255, 255, 255, 0.15) inset;
  pointer-events: auto;
  position: relative;
  z-index: 9999;
`

const EventDate = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: #feb701;
  margin-bottom: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const EventDescription = styled.div`
  font-size: 0.95rem;
  font-weight: 300;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.95);
`

const EventGroupName = styled.div`
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`

const CloseButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  line-height: 1;
  transition: all 0.2s ease;
  padding: 0;
  pointer-events: auto;
  z-index: 10000;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`

const RelatedEventsSection = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
`

const RelatedEventsHeader = styled.div`
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`

const RelatedEventItem = styled.div<{ $isExpanded: boolean }>`
  margin-bottom: 0.4rem;
  padding: 0.4rem 0.6rem;
  background: transparent;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: background 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`

const RelatedEventTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
`

const RelatedEventGroup = styled.span`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const RelatedEventDescription = styled.div`
  font-size: 0.8rem;
  font-weight: 300;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.4rem;
  padding-top: 0.4rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`

const ExpandIcon = styled.span<{ $isExpanded: boolean }>`
  display: inline-flex;
  align-items: center;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
`

interface EventInfo3DProps {
  event: ProcessedEvent
  groupName: string
  position: [number, number, number]
  onClear: () => void
  allEventGroups?: ProcessedEventGroup[]
}

const EventInfo3D = ({ event, groupName, position, onClear, allEventGroups = [] }: EventInfo3DProps) => {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const { keepRelatedEventsOpen } = useRelatedEventsContext()

  // Reset expanded events when the selected event changes (only if keepRelatedEventsOpen is false)
  useEffect(() => {
    if (!keepRelatedEventsOpen) {
      setExpandedEvents(new Set())
    }
  }, [event.id, keepRelatedEventsOpen])

  // Handle ESC key to clear selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClear()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClear])

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    console.log("Close button clicked!")
    onClear()
  }

  const toggleEventExpanded = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedEvents((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(eventId)) {
        newSet.delete(eventId)
      } else {
        newSet.add(eventId)
      }
      return newSet
    })
  }

  // Find related events from the same year but different groups
  // Memoize to prevent recalculating on every render
  const relatedEvents = useMemo(
    () =>
      allEventGroups
        .filter((group) => group.name !== groupName) // Exclude current group
        .flatMap((group) =>
          group.processedEvents
            .filter((evt) => evt.startYear === event.startYear)
            .map((evt) => ({
              ...evt,
              groupName: group.name,
              groupColor: group.color,
            }))
        ),
    [allEventGroups, groupName, event.startYear]
  )

  // Automatically expand all related events when keepRelatedEventsOpen is enabled
  useEffect(() => {
    if (keepRelatedEventsOpen && relatedEvents.length > 0) {
      const allEventIds = relatedEvents.map((evt, index) => `${evt.groupName}-${index}`)
      setExpandedEvents(new Set(allEventIds))
    }
  }, [keepRelatedEventsOpen, relatedEvents])

  // Format the date nicely
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  // Calculate position above the event
  // Position it above the pill with a visible gap
  // The pill height is ~1.5, so half height is ~0.75
  // We add 0.75 (half pill height) + 0.5 (gap) to create clear spacing
  const displayPosition: [number, number, number] = [position[0], position[1] + 1.25, position[2]]

  return (
    <group position={[0, 2, 0]}>
      <Html
        position={displayPosition}
        center
        occlude={false}
        style={{
          pointerEvents: "none",
          transform: "translate(-50%, -100%)",
          zIndex: 100000000000000000000,
          position: "relative",
        }}
        wrapperClass="event-info-wrapper"
      >
        <EventInfoContainer>
          <CloseButton onClick={handleClear} title="Clear selection (ESC)">
            ×
          </CloseButton>
          <EventGroupName>{groupName}</EventGroupName>
          <EventDate>{formatDate(event.event.startDate)}</EventDate>
          <EventDescription>{event.event.description}</EventDescription>

          {/* Related events from the same year */}
          {relatedEvents.length > 0 && (
            <RelatedEventsSection>
              <RelatedEventsHeader>
                Related Events in {event.startYear} ({relatedEvents.length})
              </RelatedEventsHeader>
              {relatedEvents.map((relatedEvent, index) => {
                const eventId = `${relatedEvent.groupName}-${index}`
                const isExpanded = expandedEvents.has(eventId)
                return (
                  <RelatedEventItem
                    key={eventId}
                    $isExpanded={isExpanded}
                    onClick={(e) => toggleEventExpanded(eventId, e)}
                  >
                    <RelatedEventTitle>
                      <RelatedEventGroup>{relatedEvent.groupName}</RelatedEventGroup>
                      <ExpandIcon $isExpanded={isExpanded}>
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </ExpandIcon>
                    </RelatedEventTitle>
                    {isExpanded && <RelatedEventDescription>{relatedEvent.event.description}</RelatedEventDescription>}
                  </RelatedEventItem>
                )
              })}
            </RelatedEventsSection>
          )}
        </EventInfoContainer>
      </Html>
    </group>
  )
}

export default EventInfo3D
