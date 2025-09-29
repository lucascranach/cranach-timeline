import { useRef, useLayoutEffect, useCallback } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { ProcessedEventGroup } from "../../types/events"
import { ACTIVE_EVENT_SCALE, createEventColors } from "../../utils/eventsUtils"

interface EventPillProps {
  group: ProcessedEventGroup
  eventBaseY: number
  pillWidth: number
  pillGeometry: THREE.ShapeGeometry
  selection: { group: string; instance: number } | null
  hovered: { group: string; instance: number } | null
  onEventClick: (processed: any, groupData: ProcessedEventGroup, instanceId: number) => void
  onHoverChange: (payload: { group: string; instance: number } | null) => void
  setHovered: React.Dispatch<React.SetStateAction<{ group: string; instance: number } | null>>
}

const EventPill = ({
  group,
  eventBaseY,
  pillWidth,
  pillGeometry,
  selection,
  hovered,
  onEventClick,
  onHoverChange,
  setHovered,
}: EventPillProps) => {
  const count = group.processedEvents.length
  const ref = useRef<THREE.InstancedMesh | null>(null)
  const dummy = new THREE.Object3D()

  // Per-instance current scales for smooth animation
  const instanceScalesRef = useRef<Float32Array>(new Float32Array(count).fill(1))
  if (!instanceScalesRef.current || instanceScalesRef.current.length !== count) {
    instanceScalesRef.current = new Float32Array(count).fill(1)
  }

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
        onEventClick(processed, group, instanceId)
      }
    },
    [group, onEventClick]
  )

  const { baseColor, highlightColor } = createEventColors(group.color)

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
  )
}

export default EventPill
