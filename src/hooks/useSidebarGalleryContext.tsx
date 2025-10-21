import { createContext, useContext, useState, ReactNode } from "react"
import { AtlasImage } from "@/types/atlas"

interface ColumnData {
  year: string
  column: number
  images: AtlasImage[]
}

type ViewMode = "ids" | "thumbnails"

interface SidebarGalleryContextType {
  columnData: ColumnData | null
  setColumnData: (data: ColumnData | null) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

const SidebarGalleryContext = createContext<SidebarGalleryContextType | undefined>(undefined)

export const SidebarGalleryProvider = ({ children }: { children: ReactNode }) => {
  const [columnData, setColumnData] = useState<ColumnData | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("ids")

  return (
    <SidebarGalleryContext.Provider value={{ columnData, setColumnData, viewMode, setViewMode }}>
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
