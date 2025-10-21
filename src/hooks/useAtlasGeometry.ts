import { useMemo } from "react"
import * as THREE from "three"

interface AtlasImage {
  filename: string
  x: number
  y: number
  width: number
  height: number
  sorting_number?: string
}

interface AtlasData {
  atlas: {
    width: number
    height: number
  }
  images: AtlasImage[]
}

interface CropSettings {
  mode: "fit" | "fill" | "custom"
  offsetX: number
  offsetY: number
  scale: number
}

interface SelectedColumnInfo {
  year: string
  column: number
}

export const useAtlasGeometry = (
  atlasData: AtlasData | null,
  sortedImages: AtlasImage[],
  thumbnailWidth: number,
  thumbnailHeight: number,
  cropSettings: CropSettings,
  selectedColumnInfo: SelectedColumnInfo | null = null,
  columnsPerYear: number = 3,
  groupedByYear: Record<string, AtlasImage[]> = {}
) => {
  return useMemo(() => {
    if (!atlasData || !sortedImages.length) return null

    // Create UV offset data for each instance
    const uvOffsets = new Float32Array(sortedImages.length * 4) // 4 values per instance (u1, v1, u2, v2)
    const opacities = new Float32Array(sortedImages.length) // 1 value per instance (opacity)

    sortedImages.forEach((imageData, i) => {
      const atlasWidth = atlasData.atlas.width
      const atlasHeight = atlasData.atlas.height

      // Calculate actual image dimensions and aspect ratio
      const imageWidth = imageData.width || 100 // fallback if width missing
      const imageHeight = imageData.height || 100 // fallback if height missing
      const aspectRatio = imageWidth / imageHeight

      // Calculate base UV coordinates
      let u1 = imageData.x / atlasWidth
      let v1 = 1 - (imageData.y + imageData.height) / atlasHeight
      let u2 = (imageData.x + imageData.width) / atlasWidth
      let v2 = 1 - imageData.y / atlasHeight

      // Apply cropping based on crop mode
      if (cropSettings.mode === "fit") {
        // Fit mode: show entire image, preserve aspect ratio
        // No UV cropping needed - the geometry scaling handles aspect ratio
      } else if (cropSettings.mode === "fill") {
        // Fill mode: crop to fill specified thumbnail dimensions
        const thumbAspect = thumbnailWidth / thumbnailHeight

        if (aspectRatio > thumbAspect) {
          // Image is wider, crop horizontally
          const cropAmount = (1 - thumbAspect / aspectRatio) * 0.5
          const uvWidth = u2 - u1
          u1 += cropAmount * uvWidth
          u2 -= cropAmount * uvWidth
        } else {
          // Image is taller, crop vertically
          const cropAmount = (1 - aspectRatio / thumbAspect) * 0.5
          const uvHeight = v2 - v1
          v1 += cropAmount * uvHeight
          v2 -= cropAmount * uvHeight
        }
      } else if (cropSettings.mode === "custom") {
        // Custom mode: use manual crop controls
        const centerU = (u1 + u2) * 0.5
        const centerV = (v1 + v2) * 0.5
        const uvWidth = (u2 - u1) * cropSettings.scale
        const uvHeight = (v2 - v1) * cropSettings.scale

        u1 = centerU - uvWidth * 0.5 + cropSettings.offsetX * uvWidth * 0.5
        u2 = centerU + uvWidth * 0.5 + cropSettings.offsetX * uvWidth * 0.5
        v1 = centerV - uvHeight * 0.5 + cropSettings.offsetY * uvHeight * 0.5
        v2 = centerV + uvHeight * 0.5 + cropSettings.offsetY * uvHeight * 0.5

        // Clamp to original image bounds within the atlas
        const imageU1 = imageData.x / atlasWidth
        const imageU2 = (imageData.x + imageData.width) / atlasWidth
        const imageV1 = 1 - (imageData.y + imageData.height) / atlasHeight
        const imageV2 = 1 - imageData.y / atlasHeight

        u1 = Math.max(imageU1, Math.min(u1, imageU2))
        u2 = Math.max(imageU1, Math.min(u2, imageU2))
        v1 = Math.max(imageV1, Math.min(v1, imageV2))
        v2 = Math.max(imageV1, Math.min(v2, imageV2))
      }

      uvOffsets[i * 4 + 0] = u1
      uvOffsets[i * 4 + 1] = v1
      uvOffsets[i * 4 + 2] = u2
      uvOffsets[i * 4 + 3] = v2

      // Calculate opacity based on selected column
      if (selectedColumnInfo) {
        const sortingNumber = imageData.sorting_number || ""
        const year = sortingNumber.split("-")[0]

        if (year === selectedColumnInfo.year) {
          const yearItems = groupedByYear[year] || []
          const indexInYear = yearItems.findIndex((img) => img.sorting_number === imageData.sorting_number)

          if (indexInYear !== -1) {
            const column = indexInYear % columnsPerYear
            // Full opacity for selected column, reduced for others in the same year
            opacities[i] = column === selectedColumnInfo.column ? 1.0 : 0.2
          } else {
            opacities[i] = 0.2 // Grey out if not found
          }
        } else {
          opacities[i] = 0.2 // Grey out other years
        }
      } else {
        opacities[i] = 1.0 // Full opacity when nothing is selected
      }
    })

    // Create base geometry (unit plane that will be scaled per instance)
    const geometry = new THREE.PlaneGeometry(1, 1)
    geometry.setAttribute("uvOffset", new THREE.InstancedBufferAttribute(uvOffsets, 4))
    geometry.setAttribute("instanceOpacity", new THREE.InstancedBufferAttribute(opacities, 1))

    return geometry
  }, [
    atlasData,
    sortedImages,
    cropSettings.mode,
    cropSettings.offsetX,
    cropSettings.offsetY,
    cropSettings.scale,
    thumbnailWidth,
    thumbnailHeight,
    selectedColumnInfo,
    columnsPerYear,
    groupedByYear,
  ])
}
