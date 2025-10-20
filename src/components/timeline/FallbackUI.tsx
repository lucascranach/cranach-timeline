interface AtlasImage {
  filename: string
  x: number
  y: number
  width: number
  height: number
  sorting_number?: string
}

interface FallbackUIProps {
  sortedImages: AtlasImage[]
  onThumbnailClick: (index: number, imageData?: AtlasImage) => void
}

const FallbackUI = ({ sortedImages, onThumbnailClick }: FallbackUIProps) => {
  return (
    <group>
      {sortedImages.slice(0, 10).map((imageData: AtlasImage, i: number) => (
        <mesh key={imageData.filename || i} position={[i * 1.2, 0, 0]} onClick={() => onThumbnailClick(i, imageData)}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      ))}
    </group>
  )
}

export default FallbackUI
