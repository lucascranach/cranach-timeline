import "./styles/App.css"

import Scene from "@/components/timeline/Scene"
import ZoomToggle from "@/components/timeline/ZoomToggle"
import { ImagePrefetchIndicator } from "@/components/timeline/ImagePrefetchIndicator"
import { ThemeToggle } from "@/components/timeline/ThemeToggle"
import { Leva } from "leva"
import { ZoomProvider, useZoomContext } from "./hooks/useZoomContext"
import { SelectedEventProvider } from "./hooks/useSelectedEventContext"
import { SidebarGalleryProvider } from "./hooks/useSidebarGalleryContext"
import { ThemeProvider } from "./hooks/useThemeContext"
import { Provider as JotaiProvider } from "jotai"
import { useEffect } from "react"
import { getCurrentLanguage } from "./utils/languageUtils"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"

import styled from "styled-components"

const Title = styled.h1`
  position: fixed;
  top: 1rem;
  left: 3rem;
  color: var(--canvas-text);
  font-family: "IBMPlexSans", sans-serif;
  font-size: 3.25rem;
  font-weight: 300;
  z-index: 99999;
  margin: 0;
  padding: 0;
  pointer-events: none;
  opacity: 0.8f;
  letter-spacing: 0.02em;
`

const AppContent = () => {
  const { enableZoomStep, setEnableZoomStep } = useZoomContext()

  return (
    <>
      <Title>
        Lucas Cranach <br />
        Timeline
      </Title>
      <ThemeToggle />
      <ZoomToggle isEnabled={enableZoomStep} onToggle={setEnableZoomStep} />
      <ImagePrefetchIndicator />
      <Leva
        collapsed
        titleBar={{
          title: "My Controls",
          drag: true,
          filter: true,
          position: { x: 0, y: 0 },
          onDrag: () => {},
        }}
      />

      <Scene />
    </>
  )
}

function App() {
  useEffect(() => {
    const language = getCurrentLanguage()
    const title = language === "de" ? "Lucas Cranach Zeitleiste" : "Lucas Cranach Timeline"
    document.title = title
  }, [])

  return (
    <ThemeProvider>
      <JotaiProvider>
        <ZoomProvider>
          <SelectedEventProvider>
            <SidebarGalleryProvider>
              <SidebarProvider defaultOpen={true}>
                <div style={{ width: "100%", height: "100vh", position: "relative" }}>
                  <AppContent />
                  <AppSidebar />
                </div>
              </SidebarProvider>
            </SidebarGalleryProvider>
          </SelectedEventProvider>
        </ZoomProvider>
      </JotaiProvider>
    </ThemeProvider>
  )
}

export default App
