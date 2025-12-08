import "./styles/App.css"

import Scene from "@/components/timeline/Scene"
import ZoomToggle from "@/components/timeline/ZoomToggle"
import RelatedEventsToggle from "@/components/timeline/RelatedEventsToggle"
import { ImagePrefetchIndicator } from "@/components/timeline/ImagePrefetchIndicator"
import { ThemeToggle } from "@/components/timeline/ThemeToggle"
import { Leva } from "leva"
import { ZoomProvider, useZoomContext } from "./hooks/useZoomContext"
import { SelectedEventProvider } from "./hooks/useSelectedEventContext"
import { RelatedEventsProvider, useRelatedEventsContext } from "./hooks/useRelatedEventsContext"
import { SidebarGalleryProvider } from "./hooks/useSidebarGalleryContext"
import { ThemeProvider } from "./hooks/useThemeContext"
import { Provider as JotaiProvider } from "jotai"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"

import styled from "styled-components"

const Title = styled.h1`
  position: absolute;
  top: 3rem;
  left: 3rem;
  color: white;
  font-family: "IBMPlexSans", sans-serif;
  font-size: 2rem;
  font-weight: 100;
  z-index: 9999;
  margin: 0;
  padding: 0;
  pointer-events: none;
`

const SidebarTriggerButton = styled(SidebarTrigger)`
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  backdrop-filter: blur(20px);
  font-family: "IBMPlexSans", sans-serif;

  &:hover {
    background: rgba(0, 0, 0, 0.85);
    border-color: rgba(255, 255, 255, 0.2);
  }
`

const AppContent = () => {
  const { enableZoomStep, setEnableZoomStep } = useZoomContext()
  const { keepRelatedEventsOpen, setKeepRelatedEventsOpen } = useRelatedEventsContext()

  return (
    <>
      {/* <SidebarTriggerButton /> */}
      <ThemeToggle />
      <ZoomToggle isEnabled={enableZoomStep} onToggle={setEnableZoomStep} />
      {/* <RelatedEventsToggle isEnabled={keepRelatedEventsOpen} onToggle={setKeepRelatedEventsOpen} /> */}
      <ImagePrefetchIndicator />
      <Leva collapsed hidden />

      <Scene />
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <JotaiProvider>
        <ZoomProvider>
          <SelectedEventProvider>
            <RelatedEventsProvider>
              <SidebarGalleryProvider>
                <SidebarProvider defaultOpen={true}>
                  <div style={{ width: "100%", height: "100vh", position: "relative" }}>
                    <AppContent />
                    <AppSidebar />
                  </div>
                </SidebarProvider>
              </SidebarGalleryProvider>
            </RelatedEventsProvider>
          </SelectedEventProvider>
        </ZoomProvider>
      </JotaiProvider>
    </ThemeProvider>
  )
}

export default App
