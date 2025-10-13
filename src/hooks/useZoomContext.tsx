import { createContext, useContext, useState, ReactNode, useRef } from "react"

interface ZoomContextType {
  enableZoomStep: boolean
  setEnableZoomStep: (enabled: boolean) => void
  targetZoom: React.MutableRefObject<number>
}

const ZoomContext = createContext<ZoomContextType | undefined>(undefined)

export const ZoomProvider = ({ children }: { children: ReactNode }) => {
  const [enableZoomStep, setEnableZoomStep] = useState(false)
  const targetZoom = useRef(0) // target for smooth transition

  const handleSetEnableZoomStep = (enabled: boolean) => {
    console.log("ZoomContext: Setting enableZoomStep to:", enabled)
    setEnableZoomStep(enabled)
    targetZoom.current = enabled ? 1 : 0
  }

  console.log("ZoomProvider rendered with enableZoomStep:", enableZoomStep)

  return (
    <ZoomContext.Provider value={{ enableZoomStep, setEnableZoomStep: handleSetEnableZoomStep, targetZoom }}>
      {children}
    </ZoomContext.Provider>
  )
}

export const useZoomContext = () => {
  const context = useContext(ZoomContext)
  if (!context) {
    throw new Error("useZoomContext must be used within ZoomProvider")
  }
  return context
}
