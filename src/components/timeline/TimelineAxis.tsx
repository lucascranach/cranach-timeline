import { Fragment, useState, useEffect } from "react"
import * as THREE from "three"

interface TimelineAxisProps {
  yearKeys: string[]
  yearPositions: Record<string, number>
  thumbnailHeight: number
  majorTickEvery: number
  showAxis: boolean
}

const TimelineAxis = ({ yearKeys, yearPositions, thumbnailHeight, majorTickEvery, showAxis }: TimelineAxisProps) => {
  const [axisColor, setAxisColor] = useState("#ffffff")
  const [tickMajorColor, setTickMajorColor] = useState("#bbbbbb")
  const [tickMinorColor, setTickMinorColor] = useState("#666666")

  useEffect(() => {
    const updateColors = () => {
      const styles = getComputedStyle(document.documentElement)
      setAxisColor(styles.getPropertyValue("--canvas-axis").trim())
      setTickMajorColor(styles.getPropertyValue("--canvas-tick-major").trim())
      setTickMinorColor(styles.getPropertyValue("--canvas-tick-minor").trim())
    }

    updateColors()

    const observer = new MutationObserver(updateColors)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

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
        <planeGeometry args={[axisWidth, 0.1]} />
        <meshBasicMaterial color={axisColor} />
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
            <meshBasicMaterial color={isMajor ? tickMajorColor : tickMinorColor} />
          </mesh>
        )
      })}
    </group>
  )
}

export default TimelineAxis
