import { useState, useRef, useCallback } from "react"
import { useFrame } from "@react-three/fiber"

interface UseZoomAnimationProps {
  targetZoom: React.MutableRefObject<number>
  zoomMultiplier: number
  onZoomChange?: (progress: number, zoomOriginX: number | null) => void
}

interface UseZoomAnimationReturn {
  zoomProgress: number
  zoomOriginX: number | null
  setZoomOriginX: (x: number | null) => void
  isZooming: boolean
}

/**
 * Hook to handle smooth zoom transitions with origin tracking
 * Maintains the screen center as the zoom origin during animations
 */
export const useZoomAnimation = ({
  targetZoom,
  zoomMultiplier,
  onZoomChange,
}: UseZoomAnimationProps): UseZoomAnimationReturn => {
  const [zoomProgress, setZoomProgress] = useState(0)
  const [zoomOriginX, setZoomOriginX] = useState<number | null>(null)

  const zoomProgressRef = useRef(0)
  const zoomOriginXRef = useRef<number | null>(null)
  const cameraXAtZoomStartRef = useRef<number | null>(null)
  const screenCenterXAtZoomStartRef = useRef<number | null>(null)
  const zoomStartProgressRef = useRef(0)

  // Sync ref with state
  const setZoomOriginXWithRef = useCallback((x: number | null) => {
    zoomOriginXRef.current = x
    setZoomOriginX(x)
  }, [])

  useFrame((state, delta) => {
    const speed = 5 // Adjust for faster/slower transitions
    const diff = targetZoom.current - zoomProgressRef.current

    if (Math.abs(diff) > 0.001) {
      // Capture the camera position and screen center when zoom starts
      if (cameraXAtZoomStartRef.current === null) {
        cameraXAtZoomStartRef.current = state.camera.position.x
        screenCenterXAtZoomStartRef.current = state.camera.position.x
        zoomStartProgressRef.current = zoomProgressRef.current

        // Store the zoom origin for use in position calculations
        zoomOriginXRef.current = state.camera.position.x
        setZoomOriginX(state.camera.position.x)
      }

      const prevProgress = zoomProgressRef.current
      zoomProgressRef.current += diff * delta * speed

      // Clamp to avoid overshooting
      zoomProgressRef.current = Math.max(0, Math.min(1, zoomProgressRef.current))

      // Calculate the current and previous scale factors
      const prevScale = 1 + (zoomMultiplier - 1) * prevProgress
      const currentScale = 1 + (zoomMultiplier - 1) * zoomProgressRef.current
      const scaleDelta = currentScale / prevScale

      // Adjust camera to maintain screen center as the zoom origin
      const screenCenterX = screenCenterXAtZoomStartRef.current!
      const offsetFromCenter = state.camera.position.x - screenCenterX
      const scaledOffset = offsetFromCenter * scaleDelta
      state.camera.position.x = screenCenterX + scaledOffset

      // Update state to trigger re-renders
      setZoomProgress(zoomProgressRef.current)
      onZoomChange?.(zoomProgressRef.current, zoomOriginXRef.current)
    } else {
      if (zoomProgressRef.current !== targetZoom.current) {
        zoomProgressRef.current = targetZoom.current
        setZoomProgress(zoomProgressRef.current)
        onZoomChange?.(zoomProgressRef.current, zoomOriginXRef.current)
      }

      // Reset references when zoom animation completes
      if (cameraXAtZoomStartRef.current !== null) {
        cameraXAtZoomStartRef.current = null
        screenCenterXAtZoomStartRef.current = null

        // Clear zoom origin when animation completes and we're back to unzoomed
        if (targetZoom.current === 0) {
          zoomOriginXRef.current = null
          setZoomOriginX(null)
        }
      }
    }
  })

  const isZooming = Math.abs(targetZoom.current - zoomProgressRef.current) > 0.001

  return {
    zoomProgress,
    zoomOriginX,
    setZoomOriginX: setZoomOriginXWithRef,
    isZooming,
  }
}
