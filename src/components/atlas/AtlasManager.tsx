import { useState, useEffect, useMemo, useRef } from "react"
import { Canvas, useLoader } from "@react-three/fiber"
import * as THREE from "three"
import { useControls } from "leva"

function AtlasManager({ children }) {
  const [atlasData, setAtlasData] = useState(null)
  const atlasTexture = useLoader(THREE.TextureLoader, "/texture-atlas.webp")

  useEffect(() => {
    fetch("/texture-atlas.json")
      .then((response) => response.json())
      .then((data) => setAtlasData(data))
      .catch((err) => console.error("Failed to load atlas data:", err))
  }, [])

  if (!atlasData || !atlasTexture) return null

  return children({ atlasData, atlasTexture })
}

export default AtlasManager
