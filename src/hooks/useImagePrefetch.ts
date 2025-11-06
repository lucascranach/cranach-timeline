import { useEffect } from "react"
import { useAtom } from "jotai"
import { loadedImagesAtom, prefetchProgressAtom } from "@/store/imageCache"
import { AtlasImage } from "@/types/atlas"

/**
 * Hook to prefetch images in the background and cache them in browser cache + localStorage tracking
 */
export const useImagePrefetch = (images: AtlasImage[]) => {
  const [loadedImages, setLoadedImages] = useAtom(loadedImagesAtom)
  const [progress, setProgress] = useAtom(prefetchProgressAtom)

  useEffect(() => {
    if (!images || images.length === 0) return

    // Filter images that have URLs and aren't already loaded
    const imagesToLoad = images.filter((img) => img.original_url && !loadedImages[img.original_url])

    if (imagesToLoad.length === 0) {
      setProgress({
        total: images.length,
        loaded: images.length,
        isComplete: true,
      })
      return
    }

    setProgress({
      total: images.length,
      loaded: Object.keys(loadedImages).length,
      isComplete: false,
    })

    let mounted = true
    let loadedCount = Object.keys(loadedImages).length

    // Prefetch images with rate limiting
    const prefetchImage = (url: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          if (!mounted) return

          loadedCount++
          setLoadedImages((prev) => ({
            ...prev,
            [url]: {
              url,
              loadedAt: Date.now(),
            },
          }))

          setProgress({
            total: images.length,
            loaded: loadedCount,
            isComplete: loadedCount === images.length,
          })

          resolve()
        }
        img.onerror = () => {
          // Still resolve on error to continue loading other images
          resolve()
        }
        img.src = url
      })
    }

    // Load images in batches to avoid overwhelming the browser
    const batchSize = 5
    const loadBatch = async (startIndex: number) => {
      const batch = imagesToLoad.slice(startIndex, startIndex + batchSize)
      await Promise.all(batch.map((img) => prefetchImage(img.original_url!)))

      if (mounted && startIndex + batchSize < imagesToLoad.length) {
        // Small delay between batches
        setTimeout(() => loadBatch(startIndex + batchSize), 100)
      }
    }

    // Start prefetching
    loadBatch(0)

    return () => {
      mounted = false
    }
  }, [images, loadedImages, setLoadedImages, setProgress])

  return progress
}
