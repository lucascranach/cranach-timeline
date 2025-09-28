import { useMemo, useRef, useLayoutEffect, useCallback, useEffect, useState } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useControls } from "leva"

interface EventData {
  startDate: string
  endDate?: string
  description: string
}

interface EventGroup {
  name: string
  color: string
  events: EventData[]
}

interface ProcessedEvent {
  id: string
  startPos: number
  event: EventData
  startYear: number
}

export interface ProcessedEventGroup extends EventGroup {
  processedEvents: ProcessedEvent[]
  yOffset: number
}

interface EventsProps {
  eventGroups: EventGroup[]
  yearPositions: Record<string, number>
  thumbnailHeight: number
  gapBetweenGroups?: number
  /** Currently selected event, managed externally */
  selection?: { group: string; instance: number } | null
  /** Callback on select (click) */
  onSelect?: (payload: {
    group: string
    instance: number
    processed: ProcessedEvent
    groupData: ProcessedEventGroup
  }) => void
  /** Optional external hover handler */
  onHoverChange?: (payload: { group: string; instance: number } | null) => void
  /** Expose processed data */
  onProcessed?: (groups: ProcessedEventGroup[]) => void
}

const ACTIVE_EVENT_SCALE = 2
const OUTLINE_PADDING_X = 0.2
const OUTLINE_PADDING_Y = 0.1
const OUTLINE_THICKNESS = 0.05

type GroupBounds = {
  centerX: number
  centerY: number
  width: number
  height: number
}

interface GroupOutlineProps {
  width: number
  height: number
  position: [number, number, number]
  color: THREE.ColorRepresentation
  thickness?: number
}

const GroupOutline = ({ width, height, position, color, thickness = OUTLINE_THICKNESS }: GroupOutlineProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null)

  if (!materialRef.current) {
    materialRef.current = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      depthTest: false,
    })
  }

  useEffect(() => {
    const material = materialRef.current
    return () => {
      material?.dispose()
    }
  }, [])

  useEffect(() => {
    materialRef.current?.color.set(color)
  }, [color])

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    group.traverse((obj) => {
      obj.raycast = () => null
    })
  }, [])

  const halfWidth = width / 2
  const halfHeight = height / 2

  return (
    <group ref={groupRef} position={position} renderOrder={1}>
      <mesh position={[0, halfHeight, 0]} material={materialRef.current!}>
        <planeGeometry args={[width, thickness]} />
      </mesh>
      <mesh position={[0, -halfHeight, 0]} material={materialRef.current!}>
        <planeGeometry args={[width, thickness]} />
      </mesh>
      <mesh position={[-halfWidth, 0, 0]} material={materialRef.current!}>
        <planeGeometry args={[thickness, height]} />
      </mesh>
      <mesh position={[halfWidth, 0, 0]} material={materialRef.current!}>
        <planeGeometry args={[thickness, height]} />
      </mesh>
    </group>
  )
}

const Events = ({
  eventGroups,
  yearPositions,
  thumbnailHeight,
  gapBetweenGroups = 0.15,
  selection: externalSelection,
  onSelect,
  onHoverChange,
  onProcessed,
}: EventsProps) => {
  // Convert date string to year
  const getYearFromDate = (dateString: string): number => {
    return new Date(dateString).getFullYear()
  }

  // Interpolate position between years
  const getPositionForYear = (year: number): number => {
    const yearStr = year.toString()
    if (yearPositions[yearStr]) {
      return yearPositions[yearStr]
    }

    // Find the two closest years and interpolate
    const years = Object.keys(yearPositions)
      .map((y) => parseInt(y))
      .sort((a, b) => a - b)

    let lowerYear = years[0]
    let upperYear = years[years.length - 1]

    for (let i = 0; i < years.length - 1; i++) {
      if (years[i] <= year && years[i + 1] >= year) {
        lowerYear = years[i]
        upperYear = years[i + 1]
        break
      }
    }

    if (lowerYear === upperYear) {
      return yearPositions[lowerYear.toString()]
    }

    // Linear interpolation
    const t = (year - lowerYear) / (upperYear - lowerYear)
    const lowerPos = yearPositions[lowerYear.toString()]
    const upperPos = yearPositions[upperYear.toString()]
    return lowerPos + t * (upperPos - lowerPos)
  }

  // Process event groups into renderable data (single point events only, no ranges)
  const processedEventGroups: ProcessedEventGroup[] = useMemo(() => {
    return eventGroups.map((group, groupIndex) => {
      const processedEvents: ProcessedEvent[] = group.events.map((event, eventIndex) => {
        const startYear = getYearFromDate(event.startDate)
        const startPos = getPositionForYear(startYear)
        return {
          id: `${groupIndex}-${eventIndex}`,
          startPos,
          event,
          startYear,
        }
      })
      return {
        ...group,
        processedEvents,
        yOffset: groupIndex * gapBetweenGroups,
      }
    })
  }, [eventGroups, yearPositions, gapBetweenGroups])

  // Expose processed groups upward when they change
  useEffect(() => {
    onProcessed?.(processedEventGroups)
  }, [processedEventGroups, onProcessed])

  // Selection (clicked) state & hover state
  // Internal fallback selection if not controlled
  const [internalSelection, setInternalSelection] = useState<{ group: string; instance: number } | null>(null)
  const selection = externalSelection !== undefined ? externalSelection : internalSelection
  const [hovered, setHovered] = useState<{ group: string; instance: number } | null>(null)
  const lastActiveRef = useRef<string | null>(null)

  // Handle click on event
  const handleEventClick = (processed: ProcessedEvent, groupData: ProcessedEventGroup, instanceId: number) => {
    onSelect?.({ group: groupData.name, instance: instanceId, processed, groupData })
    if (externalSelection === undefined) {
      setInternalSelection({ group: groupData.name, instance: instanceId })
    }
  }

  useEffect(() => {
    if (!selection) {
      lastActiveRef.current = null
      return
    }

    const groupData = processedEventGroups.find((g) => g.name === selection.group)
    const processed = groupData?.processedEvents[selection.instance]
    if (!processed) return

    const key = `${selection.group}-${selection.instance}`
    if (lastActiveRef.current === key) return

    lastActiveRef.current = key
    console.log("Active event", {
      group: selection.group,
      event: processed.event,
      startYear: processed.startYear,
    })
  }, [selection, processedEventGroups])

  // Position events below the timeline
  const eventBaseY = -thumbnailHeight * 0.5 - 0.3

  // Leva controls for pill size
  const { pillWidth, pillHeight, pillRadius } = useControls("Event Pills", {
    pillWidth: { value: 1, min: 0.2, max: 3, step: 0.05 },
    pillHeight: { value: 1.5, min: 0.1, max: 1.5, step: 0.05 },
    pillRadius: { value: 1.0, min: 0, max: 1, step: 0.01 },
  })

  // Create pill geometry from controls
  const pillGeometry = useMemo(() => {
    const width = pillWidth
    const height = pillHeight
    const r = Math.min(pillRadius, width / 2, height / 2)
    const shape = new THREE.Shape()
    const x = -width / 2
    const y = -height / 2
    shape.moveTo(x + r, y)
    shape.lineTo(x + width - r, y)
    shape.quadraticCurveTo(x + width, y, x + width, y + r)
    shape.lineTo(x + width, y + height - r)
    shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    shape.lineTo(x + r, y + height)
    shape.quadraticCurveTo(x, y + height, x, y + height - r)
    shape.lineTo(x, y + r)
    shape.quadraticCurveTo(x, y, x + r, y)
    return new THREE.ShapeGeometry(shape)
  }, [pillWidth, pillHeight, pillRadius])

  useEffect(() => () => pillGeometry.dispose(), [pillGeometry])

  const groupBounds = useMemo<(GroupBounds | null)[]>(() => {
    return processedEventGroups.map((group) => {
      const count = group.processedEvents.length
      if (!count) return null

      let minLeft = Infinity
      let maxRight = -Infinity
      const halfWidth = (pillWidth * ACTIVE_EVENT_SCALE) / 2

      group.processedEvents.forEach((processedEvent) => {
        const centerX = processedEvent.startPos - pillWidth
        const left = centerX - halfWidth
        const right = centerX + halfWidth
        if (left < minLeft) minLeft = left
        if (right > maxRight) maxRight = right
      })

      if (!isFinite(minLeft) || !isFinite(maxRight)) {
        return null
      }

      minLeft -= OUTLINE_PADDING_X
      maxRight += OUTLINE_PADDING_X

      const baseCenterY = eventBaseY - group.yOffset
      const halfHeight = (pillHeight * ACTIVE_EVENT_SCALE) / 2 + OUTLINE_PADDING_Y

      return {
        centerX: (minLeft + maxRight) / 2,
        centerY: baseCenterY,
        width: maxRight - minLeft,
        height: halfHeight * 2,
      }
    })
  }, [processedEventGroups, pillWidth, pillHeight, eventBaseY])

  return (
    <group name="timeline-events">
      {processedEventGroups.map((group, groupIndex) => {
        const count = group.processedEvents.length
        if (count === 0) return null
        const bounds = groupBounds[groupIndex]
        const ref = useRef<THREE.InstancedMesh | null>(null)
        const dummy = new THREE.Object3D()

        // Initial placement (scale 1). Animated scaling handled in useFrame below.
        useLayoutEffect(() => {
          if (!ref.current) return
          group.processedEvents.forEach((processedEvent, i) => {
            const { startPos } = processedEvent
            const eventY = eventBaseY - group.yOffset
            dummy.position.set(startPos - pillWidth, eventY, 0.002)
            dummy.rotation.set(0, 0, 0)
            dummy.scale.set(1, 1, 1)
            dummy.updateMatrix()
            ref.current!.setMatrixAt(i, dummy.matrix)
          })
          ref.current.instanceMatrix.needsUpdate = true
        }, [group.processedEvents, eventBaseY, group.yOffset, pillWidth])

        // Per-instance current scales for smooth animation
        const instanceScalesRef = useRef<Float32Array>(new Float32Array(count).fill(1))
        if (!instanceScalesRef.current || instanceScalesRef.current.length !== count) {
          instanceScalesRef.current = new Float32Array(count).fill(1)
        }

        // Animate scale toward target (2 if hovered or selected, else 1)
        useFrame(() => {
          if (!ref.current) return
          let anyChanged = false
          const scales = instanceScalesRef.current!
          for (let i = 0; i < count; i++) {
            const active =
              (selection && selection.group === group.name && selection.instance === i) ||
              (hovered && hovered.group === group.name && hovered.instance === i)
            const target = active ? ACTIVE_EVENT_SCALE : 1
            const current = scales[i]
            const newScale = THREE.MathUtils.damp(current, target, 6, 1 / 60) // approx ease in/out
            if (Math.abs(newScale - current) > 0.0005) {
              scales[i] = newScale
              // Rebuild matrix only if scale changed
              const { startPos } = group.processedEvents[i]
              const eventY = eventBaseY - group.yOffset
              dummy.position.set(startPos - pillWidth, eventY, 0.002)
              dummy.rotation.set(0, 0, 0)
              dummy.scale.set(newScale, newScale, newScale)
              dummy.updateMatrix()
              ref.current.setMatrixAt(i, dummy.matrix)
              anyChanged = true
            }
          }
          if (anyChanged) ref.current.instanceMatrix.needsUpdate = true
        })

        const onClick = useCallback(
          (e) => {
            e.stopPropagation()
            const instanceId = e.instanceId
            const processed = group.processedEvents[instanceId]
            if (processed) {
              handleEventClick(processed, group, instanceId)
            }
          },
          [group]
        )

        // Base (default) color is gray; highlight uses the group's configured color (fallback to #FEB701)
        const baseColor = new THREE.Color("#b4b4b4")
        const highlightColor = new THREE.Color(group.color || "#FEB701")
        const outlineColor = highlightColor.clone().lerp(new THREE.Color("#ffffff"), 0.4)

        // Initial color setup (all base color)
        useLayoutEffect(() => {
          if (!ref.current) return
          for (let i = 0; i < count; i++) {
            ref.current.setColorAt(i, baseColor)
          }
          ref.current.instanceColor!.needsUpdate = true
        }, [count, baseColor])

        // Update colors when selection changes
        useLayoutEffect(() => {
          if (!ref.current) return
          // If this group is selected, color ALL instances (including the clicked one) red
          if (selection && selection.group === group.name) {
            for (let i = 0; i < count; i++) {
              ref.current.setColorAt(i, highlightColor)
            }
          } else {
            // Reset to base color (either no selection or different group selected means no highlight here)
            for (let i = 0; i < count; i++) {
              ref.current.setColorAt(i, baseColor)
            }
          }
          ref.current.instanceColor!.needsUpdate = true
        }, [selection, count, group.name, baseColor, highlightColor])

        return (
          <group key={group.name} name={`event-group-${group.name}`}>
            {bounds ? (
              <GroupOutline
                width={bounds.width}
                height={bounds.height}
                position={[bounds.centerX, bounds.centerY, 0.001]}
                color={outlineColor}
              />
            ) : null}
            <instancedMesh
              name={`event-group-${group.name}-instances`}
              ref={ref}
              args={[undefined, undefined, count]}
              onClick={onClick}
              onPointerMove={(e) => {
                e.stopPropagation()
                document.body.style.cursor = "pointer"
                const instanceId = e.instanceId
                if (instanceId !== undefined) {
                  const payload = { group: group.name, instance: instanceId }
                  setHovered(payload)
                  onHoverChange?.(payload)
                }
              }}
              onPointerOut={(e) => {
                e.stopPropagation()
                document.body.style.cursor = "auto"
                setHovered((prev) => (prev && prev.group === group.name ? null : prev))
                onHoverChange?.(null)
              }}
              frustumCulled={false}
            >
              <primitive object={pillGeometry} attach="geometry" />
              <meshBasicMaterial vertexColors />
            </instancedMesh>
          </group>
        )
      })}
    </group>
  )
}

export default Events
