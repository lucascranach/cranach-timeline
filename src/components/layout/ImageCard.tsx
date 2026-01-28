import { memo } from "react"
import { getLocalizedValue } from "@/utils/languageUtils"

// Cache language detection
const CURRENT_LANGUAGE = (() => {
  const path = window.location.pathname
  const match = path.match(/\/(de|en)\/timeline/)
  return match && (match[1] === "de" || match[1] === "en") ? (match[1] as "de" | "en") : "de"
})()

interface ImageCardProps {
  image: any
  idx: number
  year: number
  isLoaded: boolean
  onImageLoad: (identifier: string) => void
}

const ImageCard = memo(
  ({ image, idx, year, isLoaded, onImageLoad }: ImageCardProps) => {
    const uniquePart =
      image.original_url || image.filename || image.img_src || `${image.sorting_number || "img"}-${idx}`
    const identifier = `${year}-${uniquePart}`
    const inventoryNumber = image["inventory_number\t"]?.trim() || image.sorting_number
    const url = inventoryNumber ? `https://lucascranach.org/${CURRENT_LANGUAGE}/${inventoryNumber}` : null
    const title =
      getLocalizedValue(image.title, CURRENT_LANGUAGE) ||
      inventoryNumber ||
      (CURRENT_LANGUAGE === "de" ? "Ohne Titel" : "Untitled")

    return (
      <div className="space-y-2">
        <div
          className="relative overflow-hidden cursor-pointer border-b border-transparent hover:border-[rgb(254,183,1)]"
          onClick={() => url && window.open(url, "_blank")}
        >
          <div className="relative aspect-3/4" style={{ backgroundColor: "#0000001a" }}>
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse dark:bg-white/5 light:bg-black/10 w-full h-full" />
              </div>
            )}
            {image.original_url ? (
              <img
                src={image.original_url}
                alt={title}
                loading="lazy"
                decoding="async"
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  isLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => onImageLoad(identifier)}
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                {CURRENT_LANGUAGE === "de" ? "Kein Bild verfügbar" : "No image available"}
              </div>
            )}
          </div>
        </div>
        <div className="text-xs dark:text-white/70 light:text-black/70 leading-tight line-clamp-2">{title}</div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render if these props change
    return (
      prevProps.isLoaded === nextProps.isLoaded &&
      prevProps.image.original_url === nextProps.image.original_url &&
      prevProps.image.sorting_number === nextProps.image.sorting_number
    )
  }
)

ImageCard.displayName = "ImageCard"

export default ImageCard
