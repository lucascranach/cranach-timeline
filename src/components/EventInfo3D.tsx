import { Html } from "@react-three/drei"
import styled from "styled-components"
import { useEffect } from "react"
import { ProcessedEvent } from "../types/events"

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

interface EventInfo3DProps {
  event: ProcessedEvent
  groupName: string
  position: [number, number, number]
  onClear: () => void
}

const EventInfo3D = ({ event, groupName, position, onClear }: EventInfo3DProps) => {
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
        style={{
          pointerEvents: "auto",
          transform: "translate(-50%, -100%)",
          zIndex: 100000000000000000000,
          position: "relative",
        }}
      >
        <EventInfoContainer>
          <CloseButton onClick={handleClear} title="Clear selection (ESC)">
            ×
          </CloseButton>
          <EventGroupName>{groupName}</EventGroupName>
          <EventDate>{formatDate(event.event.startDate)}</EventDate>
          <EventDescription>{event.event.description}</EventDescription>
        </EventInfoContainer>
      </Html>
    </group>
  )
}

export default EventInfo3D
