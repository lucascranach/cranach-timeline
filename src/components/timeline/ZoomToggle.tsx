import styled from "styled-components"

const ToggleContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: calc(24rem + 4.5rem);
  z-index: 99999;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: "IBMPlexSans", sans-serif;
  color: white;
  background: rgba(0, 0, 0, 0.4);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  pointer-events: auto;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.6);
    border-color: rgba(255, 255, 255, 0.2);
  }
`

const ToggleLabel = styled.div`
  z-index: 9999;
  font-size: 0.875rem;
  font-weight: 300;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.9;
`

const ToggleSwitch = styled.div<{ $isActive: boolean }>`
  position: relative;
  width: 40px;
  height: 22px;
  background-color: ${(props) => (props.$isActive ? "#FEB701" : "rgba(255, 255, 255, 0.15)")};
  border-radius: 11px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${(props) => (props.$isActive ? "#ffcc33" : "rgba(255, 255, 255, 0.25)")};
  }
`

const ToggleSlider = styled.div<{ $isActive: boolean }>`
  position: absolute;
  top: 2px;
  left: ${(props) => (props.$isActive ? "20px" : "2px")};
  width: 18px;
  height: 18px;
  background-color: white;
  border-radius: 50%;
  transition: left 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
`

interface ZoomToggleProps {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
}

const ZoomToggle = ({ isEnabled, onToggle }: ZoomToggleProps) => {
  const handleToggle = () => {
    // console.log("Toggle clicked! Current state:", isEnabled, "New state:", !isEnabled)
    onToggle(!isEnabled)
  }

  // console.log("ZoomToggle rendered with isEnabled:", isEnabled)

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
