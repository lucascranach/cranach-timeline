import { useMemo } from "react"
import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three/webgpu"
import * as TSL from "three/tsl"

interface DecadeVerticalShaderOptions {
  lineWidth?: number // Width of the vertical lines
  lineColor?: THREE.Color // Color of the vertical lines
  backgroundColor?: THREE.Color // Background color
  opacity?: number // Overall opacity of the effect
  decadePositions?: number[] // Array of x positions where decade lines should appear
  dashLength?: number // Length of the visible dash segment along Y
  gapLength?: number // Length of the gap between dashes
  dashOffset?: number // Offset to scroll / shift dash pattern
}

export const DecadeVerticalShaderTSL = (options: DecadeVerticalShaderOptions = {}) => {
  const {
    lineWidth = 0.08,
    lineColor = new THREE.Color(0.2, 0.2, 0.25),
    backgroundColor = new THREE.Color(0.02, 0.02, 0.05),
    opacity = 0.5,
    decadePositions = [],
    dashLength = 1.0,
    gapLength = 0.6,
    dashOffset = 0.0,
  } = options

  // Create uniform nodes for shader parameters
  const lineWidthNode = TSL.uniform(lineWidth)
  const lineColorNode = TSL.uniform(lineColor)
  const backgroundColorNode = TSL.uniform(backgroundColor)
  const opacityNode = TSL.uniform(opacity)
  const dashLengthNode = TSL.uniform(dashLength)
  const gapLengthNode = TSL.uniform(gapLength)
  const dashOffsetNode = TSL.uniform(dashOffset)

  // Calculate average spacing for regular pattern fallback
  const avgSpacing =
    decadePositions.length > 1
      ? (decadePositions[decadePositions.length - 1] - decadePositions[0]) / (decadePositions.length - 1)
      : 10.0
  const spacingNode = TSL.uniform(avgSpacing)

  // Use the first decade position as offset
  const offsetNode = TSL.uniform(decadePositions.length > 0 ? decadePositions[0] : 0)

  // Get world position from vertex shader
  const worldPos = TSL.positionWorld

  // Calculate the decade vertical lines
  const decadeGridLogic = TSL.Fn(() => {
    // Get x coordinate in world space
    const x = worldPos.x
    const y = worldPos.y // used for dash pattern along vertical lines

    // Create vertical lines at decade positions
    // Since we can't easily iterate through arrays in TSL, we use a mathematical approach
    // Adjust x by offset and create regular pattern based on average spacing
    const adjustedX = x.sub(offsetNode)
    const linePattern = TSL.mod(adjustedX, spacingNode)
    const distanceFromLine = TSL.min(linePattern, spacingNode.sub(linePattern))

    // Create line when distance is within line width
    const isLine = distanceFromLine.lessThan(lineWidthNode.mul(0.5))

    // Create a subtle fade effect at line edges
    const fadeStart = lineWidthNode.mul(0.1)
    const fadeEnd = lineWidthNode.mul(0.5)
    const lineFade = TSL.smoothstep(fadeStart, fadeEnd, distanceFromLine)
    const lineStrength = isLine.select(TSL.sub(1.0, lineFade), 0.0)

    // --- Dash pattern logic ---
    // We create a repeating pattern along Y composed of a visible segment (dashLength) and a gap (gapLength)
    const dashCycle = dashLengthNode.add(gapLengthNode)
    // Shift / animate via dashOffset
    const dashPos = TSL.mod(y.add(dashOffsetNode), dashCycle)
    const dashVisible = dashPos.lessThan(dashLengthNode)

    // Optional: soften dash edges (very small fade for aesthetics)
    const dashEdgeFadeSize = dashLengthNode.mul(0.15) // 15% of dash length
    const distanceIntoDash = dashPos
    const distanceFromDashEnd = dashLengthNode.sub(dashPos)
    const edgeMin = TSL.min(distanceIntoDash, distanceFromDashEnd)
    const dashEdgeFade = TSL.smoothstep(0.0, dashEdgeFadeSize, edgeMin)

    const dashMask = dashVisible.select(dashEdgeFade, 0.0)

    const dashedLineStrength = lineStrength.mul(dashMask)

    // Mix between background and line color
    const finalColor = TSL.mix(backgroundColorNode, lineColorNode, dashedLineStrength)

    return finalColor
  })

  // Call the decade grid function
  const decadeColor = decadeGridLogic()

  // Create final color with opacity
  const finalColor = TSL.vec4(decadeColor, opacityNode)

  // Create the material
  const material = new THREE.NodeMaterial()
  material.colorNode = finalColor
  material.transparent = true
  material.depthWrite = false
  material.side = THREE.DoubleSide

  return material
}

// Helper component for easier React integration
interface DecadeVerticalBackgroundProps extends DecadeVerticalShaderOptions {
  width?: number
  height?: number
  position?: [number, number, number]
  yearKeys?: string[]
  yearPositions?: Record<string, number>
  dashSpeed?: number // units per second to scroll dash pattern
}

export const DecadeDiagonalBackground = ({
  width = 200,
  height = 40,
  position = [0, 0, -2],
  yearKeys,
  yearPositions,
  dashSpeed = 0,
  ...shaderOptions
}: DecadeVerticalBackgroundProps) => {
  // Calculate decade positions from year data
  const decadePositions = useMemo(() => {
    if (!yearKeys || !yearPositions) return []

    const positions: number[] = []
    const years = yearKeys.map((y) => parseInt(y)).sort((a, b) => a - b)
    const minYear = years[0]
    const maxYear = years[years.length - 1]

    // Expand the range by ±100 years
    const expandedMinYear = minYear - 100
    const expandedMaxYear = maxYear + 100

    // Find decade boundaries within the expanded year range
    const startDecade = Math.floor(expandedMinYear / 10) * 10
    const endDecade = Math.ceil(expandedMaxYear / 10) * 10

    // Calculate average spacing from existing data for extrapolation
    const avgSpacing =
      years.length > 1
        ? (yearPositions[years[years.length - 1].toString()] - yearPositions[years[0].toString()]) /
          (years[years.length - 1] - years[0])
        : 1

    for (let decade = startDecade; decade <= endDecade; decade += 10) {
      // Find the position of this decade year if it exists
      const decadeStr = decade.toString()
      if (yearPositions[decadeStr]) {
        positions.push(yearPositions[decadeStr])
      } else {
        // Interpolate or extrapolate position for decades not in yearPositions
        if (decade >= minYear && decade <= maxYear) {
          // Interpolate within the existing range
          const nearestYears = years
            .filter((y) => Math.abs(y - decade) <= 5)
            .sort((a, b) => Math.abs(a - decade) - Math.abs(b - decade))
          if (nearestYears.length > 0) {
            const nearestYear = nearestYears[0]
            const nearestPos = yearPositions[nearestYear.toString()]
            if (nearestPos !== undefined) {
              const yearDiff = decade - nearestYear
              positions.push(nearestPos + yearDiff * avgSpacing)
            }
          }
        } else {
          // Extrapolate beyond the existing range
          const firstPos = yearPositions[years[0].toString()]
          const lastPos = yearPositions[years[years.length - 1].toString()]

          if (decade < minYear) {
            // Extrapolate to the left
            const yearDiff = decade - years[0]
            positions.push(firstPos + yearDiff * avgSpacing)
          } else if (decade > maxYear) {
            // Extrapolate to the right
            const yearDiff = decade - years[years.length - 1]
            positions.push(lastPos + yearDiff * avgSpacing)
          }
        }
      }
    }

    return positions
  }, [yearKeys, yearPositions])
  // Calculate appropriate width based on expanded year range
  const calculatedWidth = useMemo(() => {
    if (yearKeys && yearKeys.length > 0 && yearPositions) {
      const years = yearKeys.map((y) => parseInt(y)).sort((a, b) => a - b)
      const minYear = years[0]
      const maxYear = years[years.length - 1]

      // Calculate average spacing for extrapolation
      const avgSpacing =
        years.length > 1
          ? (yearPositions[years[years.length - 1].toString()] - yearPositions[years[0].toString()]) /
            (years[years.length - 1] - years[0])
          : 1

      // Calculate positions for expanded range (±100 years)
      const firstPos = yearPositions[years[0].toString()]
      const lastPos = yearPositions[years[years.length - 1].toString()]
      const expandedStartPos = firstPos - 100 * avgSpacing
      const expandedEndPos = lastPos + 100 * avgSpacing

      return Math.abs(expandedEndPos - expandedStartPos) + 40 // Add some padding
    }
    return width
  }, [yearKeys, yearPositions, width])

  // Calculate center position based on year positions
  const centerPosition: [number, number, number] = useMemo(() => {
    if (yearKeys && yearKeys.length > 0 && yearPositions) {
      const firstYear = yearKeys[0]
      const lastYear = yearKeys[yearKeys.length - 1]
      const startPos = yearPositions[firstYear]
      const endPos = yearPositions[lastYear]
      const centerX = (startPos + endPos) / 2
      return [centerX, position[1], position[2]]
    }
    return position
  }, [yearKeys, yearPositions, position])

  const material = useMemo(() => {
    return DecadeVerticalShaderTSL({ ...shaderOptions, decadePositions })
  }, [shaderOptions, decadePositions])

  // Animate dash offset if dashSpeed != 0 (mutating the uniform value each frame)
  const dashOffsetRef = useRef(0)
  useFrame((_, delta) => {
    if (dashSpeed !== 0 && (material as any)?.colorNode) {
      dashOffsetRef.current += dashSpeed * delta
      // access the uniforms we created (dashOffsetNode) indirectly by reconstructing material? Instead we recreate with changed option.
      // Simpler: update the underlying uniform value if exposed; NodeMaterial stores uniforms in material.uniforms
      const uniforms = (material as any).uniforms
      if (uniforms && uniforms.dashOffsetNode) {
        uniforms.dashOffsetNode.value = dashOffsetRef.current
      }
    }
  })

  return (
    <mesh position={centerPosition}>
      <planeGeometry args={[calculatedWidth, height]} />
      <primitive object={material} />
    </mesh>
  )
}
