import styled from "styled-components"

const ToggleContainer = styled.div`
  position: absolute;
  bottom: 3rem;
  right: 15rem;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "IBMPlexSans", sans-serif;
  color: white;
  background: rgba(0, 0, 0, 0.75);
  padding: 0.75rem;
  border-radius: 0.75rem;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    background: rgba(0, 0, 0, 0.85);
  }
`

const ToggleIcon = styled.svg<{ $isActive: boolean }>`
  width: 24px;
  height: 24px;
  fill: ${(props) => (props.$isActive ? "#FEB701" : "rgba(255, 255, 255, 0.5)")};
  transition: fill 0.2s ease, transform 0.2s ease;

  ${ToggleContainer}:hover & {
    fill: ${(props) => (props.$isActive ? "#ffcc33" : "rgba(255, 255, 255, 0.7)")};
    transform: scale(1.1);
  }
`

interface RelatedEventsToggleProps {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
}

const RelatedEventsToggle = ({ isEnabled, onToggle }: RelatedEventsToggleProps) => {
  const handleToggle = () => {
    onToggle(!isEnabled)
  }

  return (
    <ToggleContainer onClick={handleToggle} title={isEnabled ? "Hide related events" : "Show related events"}>
      <ToggleIcon $isActive={isEnabled} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        {isEnabled ? (
          // Link icon (connected/enabled state)
          <path d="M10.59 13.41c.41.39.41 1.03 0 1.42-.39.39-1.03.39-1.42 0a5.003 5.003 0 0 1 0-7.07l3.54-3.54a5.003 5.003 0 0 1 7.07 0 5.003 5.003 0 0 1 0 7.07l-1.49 1.49c.01-.82-.12-1.64-.4-2.42l.47-.48a2.982 2.982 0 0 0 0-4.24 2.982 2.982 0 0 0-4.24 0l-3.53 3.53a2.982 2.982 0 0 0 0 4.24zm2.82-4.24c.39-.39 1.03-.39 1.42 0a5.003 5.003 0 0 1 0 7.07l-3.54 3.54a5.003 5.003 0 0 1-7.07 0 5.003 5.003 0 0 1 0-7.07l1.49-1.49c-.01.82.12 1.64.4 2.43l-.47.47a2.982 2.982 0 0 0 0 4.24 2.982 2.982 0 0 0 4.24 0l3.53-3.53a2.982 2.982 0 0 0 0-4.24.973.973 0 0 1 0-1.42z" />
        ) : (
          // Unlink icon (disconnected/disabled state)
          <path d="M17 7h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.43-.98 2.63-2.31 2.98l1.46 1.46C20.88 15.61 22 13.95 22 12c0-2.76-2.24-5-5-5zm-1 4h-2.19l2 2H16zM2 4.27l3.11 3.11C3.29 8.12 2 9.91 2 12c0 2.76 2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1 0-1.59 1.21-2.9 2.76-3.07L8.73 11H8v2h2.73L13 15.27V17h1.73l4.01 4L20 19.74 3.27 3 2 4.27z" />
        )}
      </ToggleIcon>
    </ToggleContainer>
  )
}

export default RelatedEventsToggle
