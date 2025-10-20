import "./styles/App.css"

import Scene from "@/components/timeline/Scene"
import ZoomToggle from "@/components/timeline/ZoomToggle"
import RelatedEventsToggle from "@/components/timeline/RelatedEventsToggle"
import { Leva } from "leva"
import { ZoomProvider, useZoomContext } from "./hooks/useZoomContext"
import { SelectedEventProvider } from "./hooks/useSelectedEventContext"
import { RelatedEventsProvider, useRelatedEventsContext } from "./hooks/useRelatedEventsContext"

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

const AppContent = () => {
  const { enableZoomStep, setEnableZoomStep } = useZoomContext()
  const { keepRelatedEventsOpen, setKeepRelatedEventsOpen } = useRelatedEventsContext()

  return (
    <>
      <ZoomToggle isEnabled={enableZoomStep} onToggle={setEnableZoomStep} />
      <RelatedEventsToggle isEnabled={keepRelatedEventsOpen} onToggle={setKeepRelatedEventsOpen} />
      <Leva collapsed hidden />

      <Scene />
    </>
  )
}

function App() {
  return (
    <ZoomProvider>
      <SelectedEventProvider>
        <RelatedEventsProvider>
          <SidebarProvider>
            <AppSidebar />
            {/* <SidebarTrigger
              style={{
                position: "absolute",
                color: "red",
                top: "1rem",
                left: "1rem",
                zIndex: 10000,
              }}
            /> */}
            <AppContent />
          </SidebarProvider>
        </RelatedEventsProvider>
      </SelectedEventProvider>
    </ZoomProvider>
  )
}

export default App
