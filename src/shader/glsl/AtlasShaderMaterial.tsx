import * as THREE from "three"

/**
 * Creates a shader material for rendering instanced thumbnails from a texture atlas
 * @param {THREE.Texture} atlasTexture - The texture atlas containing all thumbnail images
 * @returns {THREE.ShaderMaterial} - Configured shader material for atlas rendering
 */
export const AtlasShaderMaterial = (atlasTexture) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      // The texture atlas containing all thumbnail images packed together
      map: { value: atlasTexture },
    },

    // VERTEX SHADER
    // Processes each vertex of the instanced geometry
    vertexShader: `
      // Instance-specific UV offset data (u1, v1, u2, v2) for each thumbnail in the atlas
      attribute vec4 uvOffset;
      
      // Pass UV coordinates to fragment shader
      varying vec2 vUv;
      // Pass the UV offset bounds to fragment shader
      varying vec4 vUvOffset;
      
      void main() {
        // Pass through the original UV coordinates (0-1 range for the plane geometry)
        vUv = uv;
        // Pass through the atlas-specific UV bounds for this instance
        vUvOffset = uvOffset;
        
        // Transform vertex position using instance matrix (position, rotation, scale per instance)
        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        // Apply camera projection to get final screen position
        gl_Position = projectionMatrix * mvPosition;
      }
    `,

    // FRAGMENT SHADER
    // Determines the color of each pixel
    fragmentShader: `
      // The texture atlas uniform
      uniform sampler2D map;
      
      // UV coordinates for the current fragment (0-1 range)
      varying vec2 vUv;
      // UV bounds for this specific thumbnail in the atlas (u1, v1, u2, v2)
      varying vec4 vUvOffset;
      
      void main() {
        // Map the fragment's UV coordinates (0-1) to the specific region 
        // in the atlas for this thumbnail
        // vUvOffset.xy = bottom-left corner (u1, v1)
        // vUvOffset.zw = top-right corner (u2, v2)
        vec2 atlasUV = mix(
          vec2(vUvOffset.x, vUvOffset.y), // Start point in atlas
          vec2(vUvOffset.z, vUvOffset.w), // End point in atlas
          vUv                              // Current fragment position (0-1)
        );
        
        // Sample the color from the atlas at the calculated UV coordinates
        vec4 color = texture2D(map, atlasUV);
        
        // Discard transparent or nearly transparent pixels to avoid rendering artifacts
        if (color.a < 0.1) discard;
        
        // Output the final color
        gl_FragColor = color;
      }
    `,

    // Enable transparency support for images with alpha channels
    transparent: true,
  })
}
