import styled from "styled-components"

const ToggleContainer = styled.div`
  position: absolute;
  bottom: 3rem;
  right: 3rem;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: "IBMPlexSans", sans-serif;
  color: white;
  background: rgba(0, 0, 0, 0.75);
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  }
`

const ToggleLabel = styled.div`
  z-index: 9999;
  font-size: 0.95rem;
  font-weight: 300;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const ToggleSwitch = styled.div<{ $isActive: boolean }>`
  position: relative;
  width: 44px;
  height: 24px;
  background-color: ${(props) => (props.$isActive ? "#FEB701" : "rgba(255, 255, 255, 0.2)")};
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${(props) => (props.$isActive ? "#ffcc33" : "rgba(255, 255, 255, 0.3)")};
  }
`

const ToggleSlider = styled.div<{ $isActive: boolean }>`
  position: absolute;
  top: 2px;
  left: ${(props) => (props.$isActive ? "22px" : "2px")};
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: left 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`

interface ZoomToggleProps {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
}

const ZoomToggle = ({ isEnabled, onToggle }: ZoomToggleProps) => {
  const handleToggle = () => {
    console.log("Toggle clicked! Current state:", isEnabled, "New state:", !isEnabled)
    onToggle(!isEnabled)
  }

  console.log("ZoomToggle rendered with isEnabled:", isEnabled)

  return (
    <ToggleContainer onClick={handleToggle}>
      <ToggleLabel>
        <span>2× Zoom</span>
        <ToggleSwitch $isActive={isEnabled}>
          <ToggleSlider $isActive={isEnabled} />
        </ToggleSwitch>
      </ToggleLabel>
    </ToggleContainer>
  )
}

export default ZoomToggle
