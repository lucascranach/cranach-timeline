import { Html } from "@react-three/drei"
import styled from "styled-components"
import { ProcessedEvent } from "../types/events"

const EventInfoContainer = styled.div`
  max-width: 500px;
  min-width: 300px;
  color: white;
  font-family: "IBMPlexSans", sans-serif;
  background: rgba(0, 0, 0, 0.85);
  padding: 1.25rem 1.75rem;
  border-radius: 0.75rem;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  pointer-events: auto;
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

interface EventInfo3DProps {
  event: ProcessedEvent
  groupName: string
  position: [number, number, number]
}

const EventInfo3D = ({ event, groupName, position }: EventInfo3DProps) => {
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
  // Position it slightly above the pill (add a small gap of ~0.3 units)
  // The pill height is ~1.5, so half height is ~0.75
  // We add 0.75 (half pill height) + 0.3 (gap) to place it just above
  const displayPosition: [number, number, number] = [position[0], position[1] + 1.05, position[2]]

  return (
    <Html
      position={displayPosition}
      center
      style={{
        pointerEvents: "none",
        transform: "translate(-50%, -100%)", // Center horizontally, align from bottom
      }}
    >
      <EventInfoContainer>
        <EventGroupName>{groupName}</EventGroupName>
        <EventDate>{formatDate(event.event.startDate)}</EventDate>
        <EventDescription>{event.event.description}</EventDescription>
      </EventInfoContainer>
    </Html>
  )
}

export default EventInfo3D
