import { useAtom } from "jotai"
import { prefetchProgressAtom } from "@/store/imageCache"
import { useEffect, useState } from "react"

export const ImagePrefetchIndicator = () => {
  const [progress] = useAtom(prefetchProgressAtom)
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (progress.isComplete) {
      // Hide after 3 seconds when complete
      const timer = setTimeout(() => setShow(false), 3000)
      return () => clearTimeout(timer)
    } else {
      setShow(true)
    }
  }, [progress.isComplete])

  if (!show || progress.total === 0) return null

  const percentage = Math.round((progress.loaded / progress.total) * 100)

  return (
    <div
      className={`fixed bottom-4 right-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 z-50 transition-opacity duration-500 ${
        progress.isComplete ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-xs text-white/70">{progress.isComplete ? "Images Cached" : "Caching Images..."}</span>
          <span className="text-sm font-medium text-white">
            {progress.loaded} / {progress.total} ({percentage}%)
          </span>
        </div>
        {!progress.isComplete && (
          <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${percentage}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}
