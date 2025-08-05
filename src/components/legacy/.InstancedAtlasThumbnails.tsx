import { useState, useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useControls } from "leva"

import { useInstanceData } from "@/hooks/useInstanceData"
import { AtlasShaderMaterial } from "@/shader/glsl/AtlasShaderMaterial"

function InstancedAtlasThumbnails({ results, atlasData, atlasTexture }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const {
    yearSpacing,
    verticalSpacing,
    depthSpacing,
    scale,
    columnsPerYear,
    rowSpacing,
    thumbnailWidth,
    thumbnailHeight,
  } = useControls("Thumbnail Layout", {
    yearSpacing: { value: 2, min: 0.5, max: 10, step: 0.1, label: "Year Spacing" },
    verticalSpacing: { value: -1.5, min: -5, max: 5, step: 0.1, label: "Vertical Spacing" },
    depthSpacing: { value: 0.01, min: 0, max: 0.1, step: 0.001, label: "Depth Spacing" },
    scale: { value: 1.2, min: 0.1, max: 3, step: 0.1, label: "Thumbnail Scale" },
    columnsPerYear: { value: 1, min: 1, max: 10, step: 1, label: "Columns per Year" },
    rowSpacing: { value: 0.2, min: 0, max: 2, step: 0.1, label: "Row Spacing" },
    thumbnailWidth: { value: 1, min: 0.1, max: 3, step: 0.1, label: "Thumbnail Width" },
    thumbnailHeight: { value: 0.5, min: 0.1, max: 3, step: 0.1, label: "Thumbnail Height" },
  })

  const instanceData = useInstanceData(
    results,
    atlasData,
    yearSpacing,
    verticalSpacing,
    depthSpacing,
    scale,
    columnsPerYear,
    rowSpacing
  )

  const { geometry, material } = useMemo(() => {
    if (!atlasData || !atlasTexture || !instanceData.length) {
      return { geometry: null, material: null }
    }

    const geo = new THREE.PlaneGeometry(thumbnailWidth, thumbnailHeight)
    const uvOffsets = new Float32Array(instanceData.length * 4)

    instanceData.forEach((instance, i) => {
      uvOffsets[i * 4 + 0] = instance.uv[0]
      uvOffsets[i * 4 + 1] = instance.uv[1]
      uvOffsets[i * 4 + 2] = instance.uv[2]
      uvOffsets[i * 4 + 3] = instance.uv[3]
    })

    geo.setAttribute("uvOffset", new THREE.InstancedBufferAttribute(uvOffsets, 4))
    const mat = AtlasShaderMaterial(atlasTexture)

    return { geometry: geo, material: mat }
  }, [atlasData, atlasTexture, instanceData, thumbnailWidth, thumbnailHeight])

  useEffect(() => {
    if (!meshRef.current || !instanceData.length) return

    const mesh = meshRef.current
    mesh.count = instanceData.length

    instanceData.forEach((instance, i) => {
      const matrix = new THREE.Matrix4()
      matrix.compose(
        new THREE.Vector3(...instance.position),
        new THREE.Quaternion(),
        new THREE.Vector3(...instance.scale)
      )
      mesh.setMatrixAt(i, matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
  }, [instanceData])

  if (!geometry || !material || !instanceData.length) return null

  return <instancedMesh ref={meshRef} args={[geometry, material, instanceData.length]} />
}

export default InstancedAtlasThumbnails
