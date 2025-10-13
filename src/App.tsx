import "./styles/App.css"

import Scene from "./components/Scene"
import ZoomToggle from "./components/ZoomToggle"
import RelatedEventsToggle from "./components/RelatedEventsToggle"
import { Leva } from "leva"
import { ZoomProvider, useZoomContext } from "./hooks/useZoomContext"
import { SelectedEventProvider } from "./hooks/useSelectedEventContext"
import { RelatedEventsProvider, useRelatedEventsContext } from "./hooks/useRelatedEventsContext"

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
      <Title>Lucas Cranach Timeline</Title>
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
          <AppContent />
        </RelatedEventsProvider>
      </SelectedEventProvider>
    </ZoomProvider>
  )
}

export default App
