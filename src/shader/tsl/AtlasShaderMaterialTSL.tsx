import * as THREE from "three/webgpu"
import * as TSL from "three/tsl"

/**
 * Creates a TSL shader material for rendering instanced thumbnails from a texture atlas
 * @param {THREE.Texture} atlasTexture - The texture atlas containing all thumbnail images
 * @returns {THREE.NodeMaterial} - Configured TSL node material for atlas rendering
 */
export const AtlasShaderMaterialTSL = (atlasTexture: THREE.Texture) => {
  // Define the TSL node graph
  const atlasTextureNode = TSL.texture(atlasTexture)

  // Get the current fragment UV coordinates (0-1 range)
  const fragmentUV = TSL.uv()

  // Get the UV offset bounds for this specific thumbnail in the atlas (u1, v1, u2, v2)
  // This will be set per instance via the geometry's instance attribute
  const uvOffset = TSL.attribute("uvOffset", "vec4")

  // Map the fragment's UV coordinates (0-1) to the specific region in the atlas
  // uvOffset.xy = bottom-left corner (u1, v1)
  // uvOffset.zw = top-right corner (u2, v2)
  const atlasUV = TSL.mix(
    uvOffset.xy, // Start point in atlas (u1, v1)
    uvOffset.zw, // End point in atlas (u2, v2)
    fragmentUV // Current fragment position (0-1)
  )

  // Sample the color from the atlas at the calculated UV coordinates
  const sampledColor = atlasTextureNode.sample(atlasUV)

  // Create the material with TSL nodes
  const material = new THREE.NodeMaterial()
  material.colorNode = sampledColor
  material.transparent = true
  material.alphaTest = 0.1 // Discard pixels with alpha < 0.1
  material.depthWrite = false

  return material
}
