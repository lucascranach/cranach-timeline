import { useRef, useEffect } from "react"
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
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null)

  // Update geometry and material when they change
  useEffect(() => {
    if (!instancedMeshRef.current) return
    instancedMeshRef.current.geometry = geometry
  }, [geometry])

  useEffect(() => {
    if (!instancedMeshRef.current) return
    instancedMeshRef.current.material = material
  }, [material])

  // Apply transforms to instanced mesh - this updates the matrices without recreating the mesh
  useEffect(() => {
    if (!instancedMeshRef.current || !positions.length) return

    const mesh = instancedMeshRef.current
    const dummy = new THREE.Object3D()
    const count = Math.min(positions.length, mesh.count)

    for (let i = 0; i < count; i++) {
      const pos = positions[i]
      const scl = scales[i]
      dummy.position.set(pos[0], pos[1], pos[2])
      dummy.scale.set(scl[0], scl[1], scl[2])
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [positions, scales])

  // Memoize the click handler to prevent unnecessary re-renders
  const handleClick = useRef((e: any) => {
    e.stopPropagation()
    const index = e.instanceId ?? -1
    if (index >= 0 && sortedImages[index]) {
      onThumbnailClick(index, sortedImages[index])
    }
  })

  // Update the click handler reference when dependencies change
  useEffect(() => {
    handleClick.current = (e: any) => {
      e.stopPropagation()
      const index = e.instanceId ?? -1
      if (index >= 0 && sortedImages[index]) {
        onThumbnailClick(index, sortedImages[index])
      }
    }
  }, [sortedImages, onThumbnailClick])

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[geometry, material, instanceCount]}
      frustumCulled={false}
      onClick={(e) => handleClick.current(e)}
    />
  )
}

export default ThumbnailMesh
