import { Html } from "@react-three/drei"
import { useMemo } from "react"

interface YearLabel {
  x: number
  y: number
  year: string
  key: string
}

interface YearLabelsProps {
  yearLabels: YearLabel[]
  thumbnailHeight: number
  showAllYearLabels: boolean
  majorTickEvery: number
  yearPositions: Record<string, number>
  isZoomed: boolean
}

const YearLabels = ({
  yearLabels,
  thumbnailHeight,
  showAllYearLabels,
  majorTickEvery,
  yearPositions,
  isZoomed,
}: YearLabelsProps) => {
  // Generate 5-year step labels when zoomed
  const fiveYearLabels = useMemo(() => {
    if (!isZoomed || !yearPositions) return []

    const labels: YearLabel[] = []
    const years = Object.keys(yearPositions)
      .map((y) => parseInt(y))
      .sort((a, b) => a - b)

    if (years.length < 2) return []

    const minYear = years[0]
    const maxYear = years[years.length - 1]

    // Calculate average spacing between years for interpolation
    const avgSpacing = (yearPositions[maxYear.toString()] - yearPositions[minYear.toString()]) / (maxYear - minYear)

    // Generate 5-year interval labels (e.g., 1475, 1480, 1485, etc.)
    for (let year = Math.floor(minYear / 5) * 5; year <= Math.ceil(maxYear / 5) * 5; year += 5) {
      // Skip if it's a decade (already shown)
      if (year % 10 === 0) continue

      // Interpolate position for this 5-year mark
      let position: number

      if (yearPositions[year.toString()]) {
        position = yearPositions[year.toString()]
      } else {
        // Find nearest known years for interpolation
        const lowerYear = years.filter((y) => y <= year).pop()
        const upperYear = years.find((y) => y >= year)

        if (lowerYear !== undefined && upperYear !== undefined) {
          const lowerPos = yearPositions[lowerYear.toString()]
          const upperPos = yearPositions[upperYear.toString()]
          const ratio = (year - lowerYear) / (upperYear - lowerYear)
          position = lowerPos + (upperPos - lowerPos) * ratio
        } else if (lowerYear !== undefined) {
          // Extrapolate from lower
          position = yearPositions[lowerYear.toString()] + (year - lowerYear) * avgSpacing
        } else if (upperYear !== undefined) {
          // Extrapolate from upper
          position = yearPositions[upperYear.toString()] - (upperYear - year) * avgSpacing
        } else {
          continue
        }
      }

      labels.push({
        x: position,
        y: -thumbnailHeight * 0.75,
        year: year.toString(),
        key: `5year-${year}`,
      })
    }

    return labels
  }, [isZoomed, yearPositions, thumbnailHeight])

  const filteredLabels = yearLabels.filter((lbl) => showAllYearLabels || parseInt(lbl.year) % majorTickEvery === 0)

  // Combine decade labels with 5-year labels when zoomed
  const allLabels = isZoomed ? [...filteredLabels, ...fiveYearLabels] : filteredLabels

  return (
    <>
      {allLabels.map((lbl) => {
        const isDecade = parseInt(lbl.year) % 10 === 0
        const isFiveYear = !isDecade && parseInt(lbl.year) % 5 === 0

        return (
          <Html
            zIndexRange={[1000, 0]}
            key={lbl.key}
            position={[lbl.x, lbl.y - 2, 0.001]}
            center
            style={{ pointerEvents: "none", zIndex: 1 }}
          >
            <div
              style={{
                fontSize: isFiveYear ? "14px" : "16px",
                lineHeight: 1,
                fontWeight: isFiveYear ? 400 : 500,
                fontFamily: "system-ui, sans-serif",
                color: isFiveYear ? "#aaa" : "#fff",
                textShadow: "0 0 4px rgba(0,0,0,0.8)",
                whiteSpace: "nowrap",
                transform: "translateY(-2px)",
                opacity: isFiveYear ? 0.8 : 1,
              }}
            >
              {lbl.year}
            </div>
          </Html>
        )
      })}
    </>
  )
}

export default YearLabels
