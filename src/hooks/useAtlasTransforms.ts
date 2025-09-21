import { useMemo } from "react"
import * as THREE from "three"

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

interface YearLabel {
  x: number
  y: number
  year: string
  key: string
}

interface TransformSettings {
  columnsPerYear: number
  preserveAspectRatio: boolean
  thumbnailWidth: number
  thumbnailHeight: number
  rowSpacing: number
}

export const useAtlasTransforms = (
  atlasData: AtlasData | null,
  sortedImages: AtlasImage[],
  yearKeys: string[],
  groupedByYear: Record<string, AtlasImage[]>,
  yearPositions: Record<string, number>,
  geometry: THREE.BufferGeometry | null,
  settings: TransformSettings
) => {
  return useMemo(() => {
    if (!atlasData || !geometry || !sortedImages.length) {
      return {
        positions: [] as [number, number, number][],
        scales: [] as [number, number, number][],
        yearColumnLabels: [] as YearLabel[],
      }
    }

    const positions: [number, number, number][] = []
    const scales: [number, number, number][] = []
    const yearColumnLabels: YearLabel[] = []

    yearKeys.forEach((year) => {
      const yearItems = groupedByYear[year] || []
      const yearCenterX = yearPositions[year]

      yearItems.forEach((imageData: any, itemIndex: number) => {
        const row = Math.floor(itemIndex / settings.columnsPerYear)
        const col = itemIndex % settings.columnsPerYear

        const imageWidth = imageData.width || 100
        const imageHeight = imageData.height || 100
        const aspectRatio = imageWidth / imageHeight

        let finalWidth: number, finalHeight: number
        if (settings.preserveAspectRatio) {
          const targetAspect = settings.thumbnailWidth / settings.thumbnailHeight
          if (aspectRatio > targetAspect) {
            finalWidth = settings.thumbnailWidth
            finalHeight = settings.thumbnailWidth / aspectRatio
          } else {
            finalHeight = settings.thumbnailHeight
            finalWidth = settings.thumbnailHeight * aspectRatio
          }
        } else {
          finalWidth = settings.thumbnailWidth
          finalHeight = settings.thumbnailHeight
        }

        // Compute total columns for this year to center them around the yearCenterX
        const columnsInFirstRow = Math.min(settings.columnsPerYear, yearItems.length)
        const totalWidthFirstRow = columnsInFirstRow * finalWidth + (columnsInFirstRow - 1) * settings.rowSpacing
        const firstColStart = yearCenterX - totalWidthFirstRow / 2
        const x = firstColStart + col * (finalWidth + settings.rowSpacing)
        const y = row * (finalHeight + settings.rowSpacing)

        positions.push([x, y, 0])
        scales.push([finalWidth, finalHeight, 1])
      })

      // Create year label (centered for each year)
      const labelY = -settings.thumbnailHeight * 0.75
      yearColumnLabels.push({
        x: yearCenterX,
        y: labelY,
        year,
        key: yearItems.length > 0 ? `${year}-center` : `${year}-empty`,
      })
    })

    return { positions, scales, yearColumnLabels }
  }, [
    atlasData,
    geometry,
    sortedImages,
    yearKeys,
    groupedByYear,
    yearPositions,
    settings.columnsPerYear,
    settings.preserveAspectRatio,
    settings.thumbnailWidth,
    settings.thumbnailHeight,
    settings.rowSpacing,
  ])
}
