import { useTheme } from "@/hooks/useThemeContext"
import { Moon, Sun } from "lucide-react"
import styled from "styled-components"

const ToggleButton = styled.button<{ $isDark: boolean }>`
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
  background: ${(props) => (props.$isDark ? "rgba(0, 0, 0, 0.75)" : "rgba(255, 255, 255, 0.75)")};
  color: ${(props) => (props.$isDark ? "white" : "black")};
  border: 1px solid ${(props) => (props.$isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)")};
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  transition: all 0.2s ease;
  pointer-events: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  &:hover {
    background: ${(props) => (props.$isDark ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.85)")};
    border-color: ${(props) => (props.$isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)")};
    transform: scale(1.05);
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme()

  return (
    <ToggleButton onClick={toggleTheme} $isDark={isDark} aria-label="Toggle theme">
      {isDark ? <Sun /> : <Moon />}
    </ToggleButton>
  )
}
