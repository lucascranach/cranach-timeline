import styled from "styled-components"
import { ProcessedEvent } from "../types/events"

const EventInfoContainer = styled.div`
  position: absolute;
  top: 3rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  max-width: 600px;
  color: white;
  font-family: "IBMPlexSans", sans-serif;
  background: rgba(0, 0, 0, 0.75);
  padding: 1.5rem 2rem;
  border-radius: 0.75rem;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
  transition: opacity 0.3s ease, transform 0.3s ease;

  &.hidden {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
    pointer-events: none;
  }
`

const EventDate = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #feb701;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const EventDescription = styled.div`
  font-size: 1rem;
  font-weight: 300;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
`

const EventGroupName = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`

interface EventInfoProps {
  event: ProcessedEvent | null
  groupName?: string
}

const EventInfo = ({ event, groupName }: EventInfoProps) => {
  if (!event) {
    return <EventInfoContainer className="hidden" />
  }

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

  return (
    <EventInfoContainer>
      {groupName && <EventGroupName>{groupName}</EventGroupName>}
      <EventDate>{formatDate(event.event.startDate)}</EventDate>
      <EventDescription>{event.event.description}</EventDescription>
    </EventInfoContainer>
  )
}

export default EventInfo
