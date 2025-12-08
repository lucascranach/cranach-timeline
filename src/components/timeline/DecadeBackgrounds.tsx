import * as THREE from "three"
import { DecadeDiagonalBackground } from "@/shader/tsl/DecadeDiagonalShaderTSL"
import { useEffect, useState } from "react"

interface DecadeBackgroundsProps {
  yearKeys: string[]
  yearPositions: Record<string, number>
  dashLength: number
  dashGap: number
  dashSpeed: number
  zoomProgress: number
}

/**
 * Component that renders decade background stripes
 * Includes both main decade stripes and 5-year stripes that appear when zoomed
 */
const DecadeBackgrounds = ({
  yearKeys,
  yearPositions,
  dashLength,
  dashGap,
  dashSpeed,
  zoomProgress,
}: DecadeBackgroundsProps) => {
  // Get theme colors from CSS variables
  const [colors, setColors] = useState({
    bg: new THREE.Color("#18181a"),
    linePrimary: new THREE.Color(0.25, 0.25, 0.3),
    lineSecondary: new THREE.Color(0.2, 0.2, 0.25),
  })

  useEffect(() => {
    const updateColors = () => {
      const styles = getComputedStyle(document.documentElement)
      const bg = styles.getPropertyValue("--canvas-bg").trim()
      const linePrimary = styles.getPropertyValue("--canvas-line-primary").trim()
      const lineSecondary = styles.getPropertyValue("--canvas-line-secondary").trim()

      setColors({
        bg: new THREE.Color(bg),
        linePrimary: new THREE.Color(linePrimary),
        lineSecondary: new THREE.Color(lineSecondary),
      })
    }

    updateColors()

    // Listen for theme changes
    const observer = new MutationObserver(updateColors)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Main decade stripes */}
      <DecadeDiagonalBackground
        yearKeys={yearKeys}
        yearPositions={yearPositions}
        offset={5}
        height={60}
        lineWidth={0.15}
        opacity={0.4}
        lineColor={colors.linePrimary}
        backgroundColor={colors.bg}
        dashLength={dashLength}
        gapLength={dashGap}
        dashSpeed={dashSpeed}
      />

      {/* 5-year stripes that appear when zoomed */}
      {zoomProgress > 0.3 && (
        <DecadeDiagonalBackground
          yearKeys={yearKeys}
          yearPositions={yearPositions}
          offset={5}
          height={60}
          lineWidth={0.08}
          opacity={0.2 * zoomProgress}
          lineColor={colors.lineSecondary}
          backgroundColor={colors.bg}
          dashLength={0.5}
          gapLength={0.5}
          dashSpeed={dashSpeed * 0.5}
          intervalYears={5}
        />
      )}
    </>
  )
}

export default DecadeBackgrounds
