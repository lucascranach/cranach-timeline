import { useTheme } from "@/hooks/useThemeContext"
import { Moon, Sun } from "lucide-react"
import styled from "styled-components"

const ToggleButton = styled.button<{ $isDark: boolean }>`
  position: fixed;
  top: 1rem;
  right: calc(24rem + 1rem);
  z-index: 99999;
  background: rgba(0, 0, 0, 0.4);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  pointer-events: auto;

  &:hover {
    background: rgba(0, 0, 0, 0.6);
    border-color: rgba(255, 255, 255, 0.2);
  }

  svg {
    width: 1.125rem;
    height: 1.125rem;
    opacity: 0.9;
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
