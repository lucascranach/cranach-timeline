import { createContext, useContext, useState, ReactNode } from "react"
import { ProcessedEvent } from "../types/events"

interface SelectedEventContextType {
  selectedEvent: ProcessedEvent | null
  selectedGroupName: string | null
  selectedEventPosition: [number, number, number] | null
  setSelectedEvent: (
    event: ProcessedEvent | null,
    groupName: string | null,
    position?: [number, number, number] | null
  ) => void
}

const SelectedEventContext = createContext<SelectedEventContextType | undefined>(undefined)

export const SelectedEventProvider = ({ children }: { children: ReactNode }) => {
  const [selectedEvent, setSelectedEventState] = useState<ProcessedEvent | null>(null)
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null)
  const [selectedEventPosition, setSelectedEventPosition] = useState<[number, number, number] | null>(null)

  const setSelectedEvent = (
    event: ProcessedEvent | null,
    groupName: string | null,
    position: [number, number, number] | null = null
  ) => {
    setSelectedEventState(event)
    setSelectedGroupName(groupName)
    setSelectedEventPosition(position)
  }

  return (
    <SelectedEventContext.Provider
      value={{ selectedEvent, selectedGroupName, selectedEventPosition, setSelectedEvent }}
    >
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
