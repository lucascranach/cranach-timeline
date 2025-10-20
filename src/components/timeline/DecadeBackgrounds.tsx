import * as THREE from "three"
import { DecadeDiagonalBackground } from "@/shader/tsl/DecadeDiagonalShaderTSL"

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
        lineColor={new THREE.Color(0.25, 0.25, 0.3)}
        backgroundColor={new THREE.Color("#18181a")}
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
          lineColor={new THREE.Color(0.2, 0.2, 0.25)}
          backgroundColor={new THREE.Color("#18181a")}
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
