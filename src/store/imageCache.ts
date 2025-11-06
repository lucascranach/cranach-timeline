import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

// Store loaded image URLs with timestamps (for tracking, not actual image data)
export interface ImageCacheEntry {
  url: string
  loadedAt: number
}

// Atom with localStorage persistence for tracking which images have been loaded
export const loadedImagesAtom = atomWithStorage<Record<string, ImageCacheEntry>>("cranach-loaded-images", {})

// Atom for prefetch progress
export const prefetchProgressAtom = atom({
  total: 0,
  loaded: 0,
  isComplete: false,
})
