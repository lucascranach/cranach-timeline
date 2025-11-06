import React, { createContext, useCallback, useContext, useMemo, useState } from "react"
import { AtlasImage } from "@/types/atlas"

type Year = number

export type YearBounds = {
  left: number
  right: number
}

type BoundsState = {
  years: Year[]
  centers: Record<Year, number>
  bounds: Record<Year, YearBounds>
  minX: number
  maxX: number
}

type LayoutInputs = {
  yearPositions: Record<string, number>
  groupedByYear: Record<string, AtlasImage[]>
  columnsPerYear: number
  thumbnailWidth: number
  rowSpacing: number
}

type TimelineBoundsContextType = {
  state: BoundsState | null
  setFromLayout: (inputs: LayoutInputs) => void
}

const TimelineBoundsContext = createContext<TimelineBoundsContextType | undefined>(undefined)

export const TimelineBoundsProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<BoundsState | null>(null)

  const setFromLayout = useCallback((inputs: LayoutInputs) => {
    const { yearPositions, groupedByYear, columnsPerYear, thumbnailWidth, rowSpacing } = inputs

    const years = Object.keys(yearPositions)
      .map((y) => parseInt(y, 10))
      .sort((a, b) => a - b)

    const centers: Record<Year, number> = {}
    const bounds: Record<Year, YearBounds> = {}

    years.forEach((year) => {
      const centerX = yearPositions[year.toString()]
      centers[year] = centerX

      const yearItems = groupedByYear[year.toString()] || []
      // At least one column width so we always have a sensible clamp window,
      // even for years without images.
      const columnsInFirstRow = Math.max(1, Math.min(columnsPerYear, yearItems.length))
      const totalWidthFirstRow = columnsInFirstRow * thumbnailWidth + (columnsInFirstRow - 1) * rowSpacing
      const left = centerX - totalWidthFirstRow / 2
      const right = centerX + totalWidthFirstRow / 2
      bounds[year] = { left, right }
    })

    const minX = years.length ? bounds[years[0]].left : 0
    const maxX = years.length ? bounds[years[years.length - 1]].right : 0

    setState({ years, centers, bounds, minX, maxX })
  }, [])

  const value = useMemo(() => ({ state, setFromLayout }), [state, setFromLayout])

  return <TimelineBoundsContext.Provider value={value}>{children}</TimelineBoundsContext.Provider>
}

export const useTimelineBounds = () => {
  const ctx = useContext(TimelineBoundsContext)
  if (!ctx) throw new Error("useTimelineBounds must be used within TimelineBoundsProvider")
  return ctx
}
