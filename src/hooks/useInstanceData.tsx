import { useMemo } from "react"
import { groupResultsByYear, calculateYearWidths, calculateYearPositions, getAtlasKey } from "@/utils/atlasUtils"

export const useInstanceData = (
  results,
  atlasData,
  yearSpacing,
  verticalSpacing,
  depthSpacing,
  scale,
  columnsPerYear,
  rowSpacing
) => {
  return useMemo(() => {
    if (!results || !atlasData) return []

    const groupedByYear = groupResultsByYear(results)
    const yearKeys = Object.keys(groupedByYear).sort()
    const yearWidths = calculateYearWidths(groupedByYear, atlasData, columnsPerYear, scale, rowSpacing)
    const yearPositions = calculateYearPositions(yearKeys, yearWidths, yearSpacing)

    const instances = []

    yearKeys.forEach((year) => {
      const items = groupedByYear[year]
      const baseX = yearPositions[year]

      items
        .filter((item) => {
          const atlasKey = getAtlasKey(item.img_src)
          return atlasKey && atlasData.images.find((img) => img.filename === atlasKey)
        })
        .forEach((item, i) => {
          const atlasKey = getAtlasKey(item.img_src)
          const imageData = atlasData.images.find((img) => img.filename === atlasKey)
          if (!imageData) return

          const aspectRatio = imageData.width / imageData.height

          // Calculate UV coordinates
          const atlasWidth = atlasData.atlas.width
          const atlasHeight = atlasData.atlas.height
          const u1 = imageData.x / atlasWidth
          const v1 = 1 - (imageData.y + imageData.height) / atlasHeight
          const u2 = (imageData.x + imageData.width) / atlasWidth
          const v2 = 1 - imageData.y / atlasHeight

          // Calculate position
          const col = i % columnsPerYear
          const row = Math.floor(i / columnsPerYear)

          let xOffset = 0
          for (let c = 0; c < col; c++) {
            const prevIdx = row * columnsPerYear + c
            if (prevIdx < items.length) {
              const prevItem = items[prevIdx]
              const prevAtlasKey = getAtlasKey(prevItem.img_src)
              const prevImageData = atlasData.images.find((img) => img.filename === prevAtlasKey)
              if (prevImageData) {
                const prevAspectRatio = prevImageData.width / prevImageData.height
                xOffset += prevAspectRatio * scale + rowSpacing
              }
            }
          }

          const xPos = baseX + xOffset
          const yPos = -row * verticalSpacing
          const zPos = i * depthSpacing

          instances.push({
            position: [xPos, yPos, zPos],
            scale: [aspectRatio * scale, scale, 1],
            uv: [u1, v1, u2, v2],
          })
        })
    })

    return instances
  }, [results, atlasData, yearSpacing, verticalSpacing, depthSpacing, scale, columnsPerYear, rowSpacing])
}
