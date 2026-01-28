import * as THREE from "three/webgpu"
import * as TSL from "three/tsl"

type AtlasTextureInput =
  | THREE.Texture
  | {
      top: THREE.Texture
      bottom: THREE.Texture
      vBoundary: number
    }

export const AtlasShaderMaterialTSL = (atlasTexture: AtlasTextureInput, cropSettings = {}) => {
  const atlasTextureNode = atlasTexture instanceof THREE.Texture ? TSL.texture(atlasTexture) : null
  const atlasTextureTopNode = atlasTexture instanceof THREE.Texture ? null : TSL.texture(atlasTexture.top)
  const atlasTextureBottomNode = atlasTexture instanceof THREE.Texture ? null : TSL.texture(atlasTexture.bottom)

  const fragmentUV = TSL.uv()

  const uvOffset = TSL.attribute("uvOffset", "vec4")
  const instanceOpacity = TSL.attribute("instanceOpacity", "float")

  const atlasUV = TSL.mix(
    uvOffset.xy, // Start point in atlas (u1, v1) - already cropped
    uvOffset.zw, // End point in atlas (u2, v2) - already cropped
    fragmentUV // Current fragment position (0-1)
  )

  const sampledColor = (() => {
    // Default path: single atlas texture
    if (atlasTextureNode) return atlasTextureNode.sample(atlasUV)

    // Fallback path: atlas is vertically sliced into two textures.
    // Global UV space has v=1 at top and v=0 at bottom.
    const v = atlasUV.y
    const u = atlasUV.x
    const vBoundary = TSL.float((atlasTexture as Exclude<AtlasTextureInput, THREE.Texture>).vBoundary)

    // step(edge, x) -> 0 when x < edge, else 1
    const useTop = TSL.step(vBoundary, v)

    const localVTop = TSL.div(TSL.sub(v, vBoundary), TSL.sub(1.0, vBoundary))
    const localVBottom = TSL.div(v, vBoundary)

    const topSample = atlasTextureTopNode!.sample(TSL.vec2(u, localVTop))
    const bottomSample = atlasTextureBottomNode!.sample(TSL.vec2(u, localVBottom))

    return TSL.mix(bottomSample, topSample, useTop)
  })()

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
