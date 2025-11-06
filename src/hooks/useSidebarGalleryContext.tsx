import { createContext, useContext, useState, ReactNode } from "react"
import { AtlasImage } from "@/types/atlas"
import { ProcessedEvent, ProcessedEventGroup } from "@/types/events"

interface ColumnData {
  year: string
  column: number
  images: AtlasImage[]
}

interface EventData {
  event: ProcessedEvent
  groupName: string
  allEventGroups: ProcessedEventGroup[]
}

interface FocusedYearData {
  year: number
  events: ProcessedEventGroup[]
  images: AtlasImage[]
}

interface YearSlide {
  year: number
  events: ProcessedEventGroup[]
  images: AtlasImage[]
}

type ViewMode = "ids" | "thumbnails"
type SidebarMode = "column" | "event" | "focused-year" | null

interface SidebarGalleryContextType {
  columnData: ColumnData | null
  setColumnData: (data: ColumnData | null) => void
  eventData: EventData | null
  setEventData: (data: EventData | null) => void
  focusedYearData: FocusedYearData | null
  setFocusedYearData: (data: FocusedYearData | null) => void
  focusedYear: number | null
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  sidebarMode: SidebarMode
  setSidebarMode: (mode: SidebarMode) => void
  scrollDirection: "left" | "right" | null
  setScrollDirection: (direction: "left" | "right" | null) => void
  allYearSlides: YearSlide[]
  setAllYearSlides: (slides: YearSlide[]) => void
}

const SidebarGalleryContext = createContext<SidebarGalleryContextType | undefined>(undefined)

export const SidebarGalleryProvider = ({ children }: { children: ReactNode }) => {
  const [columnData, setColumnData] = useState<ColumnData | null>(null)
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [focusedYearData, setFocusedYearData] = useState<FocusedYearData | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("ids")
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(null)
  const [scrollDirection, setScrollDirection] = useState<"left" | "right" | null>(null)
  const [allYearSlides, setAllYearSlides] = useState<YearSlide[]>([])

  return (
    <SidebarGalleryContext.Provider
      value={{
        columnData,
        setColumnData,
        eventData,
        setEventData,
        focusedYearData,
        setFocusedYearData,
        focusedYear: focusedYearData?.year ?? null,
        viewMode,
        setViewMode,
        sidebarMode,
        setSidebarMode,
        scrollDirection,
        setScrollDirection,
        allYearSlides,
        setAllYearSlides,
      }}
    >
      {children}
    </SidebarGalleryContext.Provider>
  )
}

export const useSidebarGallery = () => {
  const context = useContext(SidebarGalleryContext)
  if (!context) {
    throw new Error("useSidebarGallery must be used within SidebarGalleryProvider")
  }
  return context
}
