import { useState } from "react"
import { Canvas } from "@react-three/fiber"
import { Image, MapControls, OrthographicCamera } from "@react-three/drei"
import { Perf } from "r3f-perf"

function Thumbnail({ url, position, scale }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  if (error) console.warn("Image failed to load:", url)
  if (!loaded && !error) console.log("Loading image:", url)

  return (
    <group position={position}>
      {!error && (
        <Image
          url={url}
          scale={scale}
          transparent
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          crossOrigin="anonymous"
        />
      )}
    </group>
  )
}

function ResultsThumbnails3D({ results }) {
  const groupedByYear = results.reduce((acc, item) => {
    const sorting_number = item.sorting_number
    if (!sorting_number) return acc
    const year = parseInt(sorting_number.slice(0, 4), 10)
    if (!year) return acc
    if (!acc[year]) acc[year] = []
    acc[year].push(item)
    return acc
  }, {})

  const yearKeys = Object.keys(groupedByYear).sort()
  const yearToX = (year) => (parseInt(year) - parseInt(yearKeys[0])) * 2

  return (
    <group>
      {yearKeys.map((year) => {
        const items = groupedByYear[year]
        return items
          .filter((item) => !!item.img_src)
          .map((item, i) => (
            <Thumbnail
              key={item.img_src || i}
              url={item.img_src}
              scale={[1.2, 1.2, 2]}
              position={[yearToX(year), i * 1.5, i * 0.01]}
            />
          ))
      })}
    </group>
  )
}

export default function Scene({ results = [] }) {
  return (
    <Canvas>
      <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={50} />
      <Perf />
      <ambientLight />
      <MapControls />
      <ResultsThumbnails3D results={results} />
    </Canvas>
  )
}
