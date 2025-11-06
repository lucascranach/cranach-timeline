import { useRef, useEffect, useMemo } from "react"
import * as THREE from "three"

interface AtlasImage {
  filename: string
  x: number
  y: number
  width: number
  height: number
  sorting_number?: string
}

interface ThumbnailMeshProps {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  instanceCount: number
  positions: [number, number, number][]
  scales: [number, number, number][]
  sortedImages: AtlasImage[]
  onThumbnailClick: (index: number, imageData?: AtlasImage) => void
}

const ThumbnailMesh = ({
  geometry,
  material,
  instanceCount,
  positions,
  scales,
  sortedImages,
  onThumbnailClick,
}: ThumbnailMeshProps) => {
  // Create the mesh once and persist it
  const meshObject = useMemo(() => {
    console.log("🔨 Creating new InstancedMesh object")
    const mesh = new THREE.InstancedMesh(geometry, material, instanceCount)
    mesh.frustumCulled = false
    return mesh
  }, []) // Empty deps - create only once

  // console.log("ThumbnailMesh render, instanceCount:", instanceCount, "positions.length:", positions.length)

  // Track mount/unmount
  useEffect(() => {
    console.log("🟢 ThumbnailMesh MOUNTED")
    return () => {
      console.log("🔴 ThumbnailMesh UNMOUNTED")
    }
  }, [])

  // Update geometry when it changes
  useEffect(() => {
    console.log("Updating geometry reference")
    meshObject.geometry = geometry
    meshObject.geometry.computeBoundingBox()
    meshObject.geometry.computeBoundingSphere()
    meshObject.computeBoundingSphere()
  }, [geometry, meshObject])

  // Update material when it changes
  useEffect(() => {
    console.log("Updating material reference")
    meshObject.material = material
  }, [material, meshObject])

  // Apply transforms to instanced mesh
  useEffect(() => {
    if (!positions.length) return

    const dummy = new THREE.Object3D()
    const count = Math.min(positions.length, meshObject.count)

    for (let i = 0; i < count; i++) {
      const pos = positions[i]
      const scl = scales[i]
      dummy.position.set(pos[0], pos[1], pos[2])
      dummy.scale.set(scl[0], scl[1], scl[2])
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      meshObject.setMatrixAt(i, dummy.matrix)
    }
    meshObject.instanceMatrix.needsUpdate = true

    // CRITICAL: Recompute bounding boxes/spheres for raycasting
    meshObject.geometry.computeBoundingBox()
    meshObject.geometry.computeBoundingSphere()
    meshObject.computeBoundingSphere()

    console.log("✅ Updated instance matrices, count:", count)
  }, [positions, scales, meshObject])

  // Direct click handler
  const handleClick = useMemo(
    () => (e: any) => {
      e.stopPropagation()
      const index = e.instanceId ?? -1
      console.log("👆 Thumbnail clicked - instanceId:", index)
      if (index >= 0 && index < sortedImages.length && sortedImages[index]) {
        onThumbnailClick(index, sortedImages[index])
      } else {
        console.warn("Invalid thumbnail click - no image data found for index:", index)
      }
    },
    [sortedImages, onThumbnailClick]
  )

  const handlePointerDown = useMemo(
    () => (e: any) => {
      console.log("👇 PointerDown on thumbnail mesh, instanceId:", e.instanceId)
    },
    []
  )

  return <primitive object={meshObject} onClick={handleClick} onPointerDown={handlePointerDown} />
}

export default ThumbnailMesh
