import { createContext, useContext, useState, ReactNode } from "react"

interface ZoomContextType {
  enableZoomStep: boolean
  setEnableZoomStep: (enabled: boolean) => void
}

const ZoomContext = createContext<ZoomContextType | undefined>(undefined)

export const ZoomProvider = ({ children }: { children: ReactNode }) => {
  const [enableZoomStep, setEnableZoomStep] = useState(false)

  const handleSetEnableZoomStep = (enabled: boolean) => {
    console.log("ZoomContext: Setting enableZoomStep to:", enabled)
    setEnableZoomStep(enabled)
  }

  console.log("ZoomProvider rendered with enableZoomStep:", enableZoomStep)

  return (
    <ZoomContext.Provider value={{ enableZoomStep, setEnableZoomStep: handleSetEnableZoomStep }}>
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
