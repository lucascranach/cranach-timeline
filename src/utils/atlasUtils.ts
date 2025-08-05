export const getAtlasKey = (imgSrc) => {
  if (!imgSrc) return null
  const filename = imgSrc.split("/").pop()
  return filename.replace(/-s(\.\w+)$/, "-s$1")
}

export const groupResultsByYear = (results) => {
  return results.reduce((acc, item) => {
    const sorting_number = item.sorting_number
    if (!sorting_number) return acc
    const year = parseInt(sorting_number.slice(0, 4), 10)
    if (!year) return acc
    if (!acc[year]) acc[year] = []
    acc[year].push(item)
    return acc
  }, {})
}

export const calculateYearWidths = (groupedByYear, atlasData, columnsPerYear, scale, rowSpacing) => {
  const yearWidths = {}
  const yearKeys = Object.keys(groupedByYear).sort()

  yearKeys.forEach((year) => {
    const items = groupedByYear[year].filter((item) => {
      const atlasKey = getAtlasKey(item.img_src)
      return atlasKey && atlasData.images.find((img) => img.filename === atlasKey)
    })

    if (items.length === 0) {
      yearWidths[year] = 0
      return
    }

    const rows = Math.ceil(items.length / columnsPerYear)
    let maxRowWidth = 0

    for (let row = 0; row < rows; row++) {
      const startIdx = row * columnsPerYear
      const endIdx = Math.min(startIdx + columnsPerYear, items.length)
      let rowWidth = 0

      for (let i = startIdx; i < endIdx; i++) {
        const item = items[i]
        const atlasKey = getAtlasKey(item.img_src)
        const imageData = atlasData.images.find((img) => img.filename === atlasKey)
        if (imageData) {
          const aspectRatio = imageData.width / imageData.height
          const thumbnailWidth = aspectRatio * scale
          rowWidth += thumbnailWidth
          if (i < endIdx - 1) rowWidth += rowSpacing
        }
      }

      maxRowWidth = Math.max(maxRowWidth, rowWidth)
    }

    yearWidths[year] = maxRowWidth
  })

  return yearWidths
}

export const calculateYearPositions = (yearKeys, yearWidths, yearSpacing) => {
  const yearPositions = {}
  let currentX = 0

  yearKeys.forEach((year) => {
    yearPositions[year] = currentX
    const requiredWidth = yearWidths[year]
    const minSpacing = requiredWidth + 0.5
    const actualSpacing = Math.max(yearSpacing, minSpacing)
    currentX += actualSpacing
  })

  return yearPositions
}
