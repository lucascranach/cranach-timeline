import { createContext, useContext, useState, ReactNode } from "react"

interface RelatedEventsContextType {
  keepRelatedEventsOpen: boolean
  setKeepRelatedEventsOpen: (value: boolean) => void
}

const RelatedEventsContext = createContext<RelatedEventsContextType | undefined>(undefined)

export const RelatedEventsProvider = ({ children }: { children: ReactNode }) => {
  const [keepRelatedEventsOpen, setKeepRelatedEventsOpen] = useState(false)

  return (
    <RelatedEventsContext.Provider value={{ keepRelatedEventsOpen, setKeepRelatedEventsOpen }}>
      {children}
    </RelatedEventsContext.Provider>
  )
}

export const useRelatedEventsContext = () => {
  const context = useContext(RelatedEventsContext)
  if (!context) {
    throw new Error("useRelatedEventsContext must be used within RelatedEventsProvider")
  }
  return context
}
