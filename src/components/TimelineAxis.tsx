import { Fragment } from "react"

interface TimelineAxisProps {
  yearKeys: string[]
  yearPositions: Record<string, number>
  thumbnailHeight: number
  majorTickEvery: number
  showAxis: boolean
}

const TimelineAxis = ({ yearKeys, yearPositions, thumbnailHeight, majorTickEvery, showAxis }: TimelineAxisProps) => {
  if (!showAxis || !yearKeys.length) {
    return null
  }

  const axisStart = yearPositions[yearKeys[0]]
  const axisEnd = yearPositions[yearKeys[yearKeys.length - 1]]
  const axisWidth = axisEnd - axisStart
  const baselineY = -thumbnailHeight * 0.5

  return (
    <group name="timeline-axis">
      {/* Baseline spanning full years range */}
      <mesh position={[axisStart + axisWidth / 2, baselineY, -0.001]}>
        <planeGeometry args={[axisWidth, 0.01]} />
        <meshBasicMaterial color="#888" />
      </mesh>

      {/* Tick marks */}
      {yearKeys.map((year) => {
        const x = yearPositions[year]
        const y = baselineY
        const isMajor = parseInt(year) % majorTickEvery === 0
        const height = isMajor ? 0.15 : 0.08

        return (
          <mesh key={`tick-${year}`} position={[x, y, -0.002]}>
            <planeGeometry args={[0.005, height]} />
            <meshBasicMaterial color={isMajor ? "#bbb" : "#666"} />
          </mesh>
        )
      })}
    </group>
  )
}

export default TimelineAxis
