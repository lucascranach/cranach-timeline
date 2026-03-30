import { useState, useEffect, useMemo } from "react"
import { groupResultsByYear } from "@/utils/atlasUtils"
import { AtlasData, AtlasImage } from "@/types/atlas"

import { path } from "@/store/base"

export const useAtlasData = (
  yearSpacing: number,
  zoomOriginX: number | null = null,
  zoomProgress: number = 0,
  zoomMultiplier: number = 1
) => {
  const [atlasData, setAtlasData] = useState<AtlasData | null>(null)
  const HIDE_THUMBNAILS_FROM_YEAR = 1586

  // Define uniform timeline year range (extended earlier if needed)
  const START_YEAR = 1400
  const END_YEAR = 1950
  // Year that should appear at x = 0
  const REFERENCE_YEAR = 1507

  // Load atlas data
  useEffect(() => {
    fetch("/data-proxy/texture-atlas/texture-atlas.json")
      .then((response) => response.json())
      .then((data) => setAtlasData(data))
      .catch((err) => console.error("Failed to load atlas data:", err))
  }, [])

  // Sort and group images by year from sorting_number - memoized separately
  // to avoid recreating groupedByYear when zoom/spacing changes
  const { sortedImages, groupedByYear, yearKeys } = useMemo(() => {
    if (!atlasData?.images) {
      return { sortedImages: [], groupedByYear: {}, yearKeys: [] }
    }

    // Sort images by sorting_number
    const sorted = [...atlasData.images].sort((a, b) => {
      const aSort = a.sorting_number || "0000-000"
      const bSort = b.sorting_number || "0000-000"
      return aSort.localeCompare(bSort)
    })

    // Hide thumbnails from the configured cutoff year onward.
    const filteredSorted = sorted.filter((image) => {
      const year = parseInt((image.sorting_number || "").slice(0, 4), 10)
      return Number.isNaN(year) || year < HIDE_THUMBNAILS_FROM_YEAR
    })

    // Group by year using atlasUtils
    const grouped = groupResultsByYear(filteredSorted)
    // Uniform year list from START_YEAR..END_YEAR (even if no images)
    const keys = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => String(START_YEAR + i))

    return {
      sortedImages: filteredSorted,
      groupedByYear: grouped,
      yearKeys: keys,
    }
  }, [atlasData, HIDE_THUMBNAILS_FROM_YEAR])

  // Calculate year positions separately - this can change with zoom/spacing
  // without recreating sortedImages/groupedByYear
  const yearPositions = useMemo(() => {
    // Center positions so REFERENCE_YEAR maps to x = 0
    // When zooming, scale positions relative to the zoom origin (screen center)
    return yearKeys.reduce(
      (acc, year) => {
        const yrNum = parseInt(year, 10)
        const basePosition = (yrNum - REFERENCE_YEAR) * yearSpacing

        // If we have a zoom origin, scale positions relative to it
        if (zoomOriginX !== null && zoomProgress > 0) {
          // Calculate what the base spacing would be (unzoomed)
          const baseSpacing = yearSpacing / (1 + (zoomMultiplier - 1) * zoomProgress)
          const basePos = (yrNum - REFERENCE_YEAR) * baseSpacing
          // Scale offset from zoom origin
          const offsetFromOrigin = basePos - zoomOriginX
          const currentScale = 1 + (zoomMultiplier - 1) * zoomProgress
          acc[year] = zoomOriginX + offsetFromOrigin * currentScale
        } else {
          acc[year] = basePosition
        }

        return acc
      },
      {} as Record<string, number>
    )
  }, [yearKeys, yearSpacing, zoomOriginX, zoomProgress, zoomMultiplier])

  return {
    atlasData,
    sortedImages,
    groupedByYear,
    yearKeys,
    yearPositions,
  }
}
