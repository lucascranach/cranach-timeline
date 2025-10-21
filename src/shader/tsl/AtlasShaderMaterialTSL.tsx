import * as THREE from "three/webgpu"
import * as TSL from "three/tsl"

export const AtlasShaderMaterialTSL = (atlasTexture: THREE.Texture, cropSettings = {}) => {
  const atlasTextureNode = TSL.texture(atlasTexture)

  const fragmentUV = TSL.uv()

  const uvOffset = TSL.attribute("uvOffset", "vec4")
  const instanceOpacity = TSL.attribute("instanceOpacity", "float")

  const atlasUV = TSL.mix(
    uvOffset.xy, // Start point in atlas (u1, v1) - already cropped
    uvOffset.zw, // End point in atlas (u2, v2) - already cropped
    fragmentUV // Current fragment position (0-1)
  )

  const sampledColor = atlasTextureNode.sample(atlasUV)

  const alpha = TSL.mul(sampledColor.a, instanceOpacity)
  const finalColor = TSL.vec4(sampledColor.rgb, alpha)

  const material = new THREE.NodeMaterial()
  material.colorNode = finalColor
  material.transparent = true
  material.alphaTest = 0.1
  material.depthWrite = false
  material.side = THREE.DoubleSide

  return material
}
