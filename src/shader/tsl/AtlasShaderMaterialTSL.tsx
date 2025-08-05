import * as THREE from "three/webgpu"
import * as TSL from "three/tsl"

/**
 * Creates a TSL shader material for rendering instanced thumbnails from a texture atlas
 * @param {THREE.Texture} atlasTexture - The texture atlas containing all thumbnail images
 * @param {object} cropSettings - Optional crop settings for UV manipulation
 * @returns {THREE.NodeMaterial} - Configured TSL node material for atlas rendering
 */
export const AtlasShaderMaterialTSL = (atlasTexture: THREE.Texture, cropSettings = {}) => {
  // Define the TSL node graph
  const atlasTextureNode = TSL.texture(atlasTexture)

  // Get the current fragment UV coordinates (0-1 range)
  const fragmentUV = TSL.uv()

  // Get the UV offset bounds for this specific thumbnail in the atlas (u1, v1, u2, v2)
  // This will be set per instance via the geometry's instance attribute
  const uvOffset = TSL.attribute("uvOffset", "vec4")

  // Get the aspect ratio for this instance to scale the geometry correctly
  const aspectRatio = TSL.attribute("aspectRatio", "float")

  // Apply UV transformations for cropping
  // The uvOffset already contains the cropped UV coordinates from the geometry
  const atlasUV = TSL.mix(
    uvOffset.xy, // Start point in atlas (u1, v1) - already cropped
    uvOffset.zw, // End point in atlas (u2, v2) - already cropped
    fragmentUV // Current fragment position (0-1)
  )

  // Sample the color from the atlas at the calculated UV coordinates
  const sampledColor = atlasTextureNode.sample(atlasUV)

  // Apply alpha testing to handle transparency properly
  const alpha = sampledColor.a
  const finalColor = TSL.vec4(sampledColor.rgb, alpha)

  // Create the material with TSL nodes
  const material = new THREE.NodeMaterial()
  material.colorNode = finalColor
  material.transparent = true
  material.alphaTest = 0.1 // Discard pixels with alpha < 0.1
  material.depthWrite = false
  material.side = THREE.DoubleSide // Allow viewing from both sides

  return material
}
