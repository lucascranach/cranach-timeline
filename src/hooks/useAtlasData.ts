import { useState, useEffect, useMemo } from "react"
import { groupResultsByYear } from "@/utils/atlasUtils"

interface AtlasImage {
  filename: string
  x: number
  y: number
  width: number
  height: number
  sorting_number?: string
}

interface AtlasData {
  atlas: {
    width: number
    height: number
  }
  images: AtlasImage[]
}

export const useAtlasData = (yearSpacing: number) => {
  const [atlasData, setAtlasData] = useState<AtlasData | null>(null)

  // Define uniform timeline year range
  const START_YEAR = 1500
  const END_YEAR = 1950

  // Load atlas data
  useEffect(() => {
    fetch("/atlas/texture_atlas.json")
      .then((response) => response.json())
      .then((data) => setAtlasData(data))
      .catch((err) => console.error("Failed to load atlas data:", err))
  }, [])

  // Sort and group images by year from sorting_number
  const { sortedImages, groupedByYear, yearKeys, yearPositions } = useMemo(() => {
    if (!atlasData?.images) {
      return { sortedImages: [], groupedByYear: {}, yearKeys: [], yearPositions: {} }
    }

    // Sort images by sorting_number
    const sorted = [...atlasData.images].sort((a, b) => {
      const aSort = a.sorting_number || "0000-000"
      const bSort = b.sorting_number || "0000-000"
      return aSort.localeCompare(bSort)
    })

    // Group by year using atlasUtils
    const grouped = groupResultsByYear(sorted)
    // Uniform year list from START_YEAR..END_YEAR (even if no images)
    const keys = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => String(START_YEAR + i))

    // Uniform positions: each year placed at fixed spacing along x
    const positions = keys.reduce((acc, year, idx) => {
      acc[year] = idx * yearSpacing
      return acc
    }, {} as Record<string, number>)

    return {
      sortedImages: sorted,
      groupedByYear: grouped,
      yearKeys: keys,
      yearPositions: positions,
    }
  }, [atlasData, yearSpacing])

  return {
    atlasData,
    sortedImages,
    groupedByYear,
    yearKeys,
    yearPositions,
  }
}
