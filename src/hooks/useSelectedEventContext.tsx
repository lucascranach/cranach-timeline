import { createContext, useContext, useState, ReactNode } from "react"
import { ProcessedEvent } from "../types/events"

interface SelectedEventContextType {
  selectedEvent: ProcessedEvent | null
  selectedGroupName: string | null
  setSelectedEvent: (event: ProcessedEvent | null, groupName: string | null) => void
}

const SelectedEventContext = createContext<SelectedEventContextType | undefined>(undefined)

export const SelectedEventProvider = ({ children }: { children: ReactNode }) => {
  const [selectedEvent, setSelectedEventState] = useState<ProcessedEvent | null>(null)
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null)

  const setSelectedEvent = (event: ProcessedEvent | null, groupName: string | null) => {
    setSelectedEventState(event)
    setSelectedGroupName(groupName)
  }

  return (
    <SelectedEventContext.Provider value={{ selectedEvent, selectedGroupName, setSelectedEvent }}>
      {children}
    </SelectedEventContext.Provider>
  )
}

export const useSelectedEvent = () => {
  const context = useContext(SelectedEventContext)
  if (!context) {
    throw new Error("useSelectedEvent must be used within SelectedEventProvider")
  }
  return context
}
