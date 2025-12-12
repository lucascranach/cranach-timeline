import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from "@/components/ui/sidebar"
import { useSidebarGallery } from "@/hooks/useSidebarGalleryContext"
import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { getCurrentLanguage } from "@/utils/languageUtils"
import YearColumn from "./YearColumn"

export function AppSidebar() {
  const { focusedYearData, allYearSlides } = useSidebarGallery()
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const scrollContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const currentLanguage = getCurrentLanguage()

  const handleImageLoad = useCallback((identifier: string) => {
    setLoadedImages((prev) => new Set(prev).add(identifier))
  }, [])

  // Reset scroll position to top when focused year changes
  useEffect(() => {
    if (focusedYearData) {
      // Reset the current year's scroll container to top
      const container = scrollContainerRefs.current.get(focusedYearData.year)
      if (container) {
        container.scrollTop = 0
      }
    }
  }, [focusedYearData?.year])

  // Format date nicely - memoized
  const formatDate = useCallback(
    (dateString: string) => {
      try {
        const date = new Date(dateString)
        const locale = currentLanguage === "de" ? "de-DE" : "en-US"
        return date.toLocaleDateString(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      } catch {
        return dateString
      }
    },
    [currentLanguage]
  )

  // Calculate the current slide index
  const currentSlideIndex = useMemo(() => {
    if (!focusedYearData || allYearSlides.length === 0) return 0
    const index = allYearSlides.findIndex((slide) => slide.year === focusedYearData.year)
    return index >= 0 ? index : 0
  }, [focusedYearData, allYearSlides])

  // Only render slides within a window around the current slide for performance
  const visibleRange = useMemo(() => {
    const buffer = 2 // Number of slides to render on each side
    return {
      start: Math.max(0, currentSlideIndex - buffer),
      end: Math.min(allYearSlides.length - 1, currentSlideIndex + buffer),
    }
  }, [currentSlideIndex, allYearSlides.length])

  return (
    <Sidebar side="right">
      <SidebarHeader>
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center justify-start">
            <h2 className="text-3xl font-light tracking-tight text-sidebar-foreground">
              {focusedYearData ? focusedYearData.year : "Timeline"}
            </h2>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="h-full">
          {allYearSlides.length > 0 && focusedYearData ? (
            <div className="relative h-full overflow-hidden">
              {/* Sliding container */}
              <div
                className="relative h-full transition-transform duration-500 ease-out will-change-transform"
                style={{
                  transform: `translateX(-${currentSlideIndex * 100}%)`,
                }}
              >
                {/* Render each year as an independent scrollable column */}
                {allYearSlides.map((slide, idx) => {
                  // Only render slides within the visible range
                  const isInRange = idx >= visibleRange.start && idx <= visibleRange.end

                  return (
                    <div
                      key={slide.year}
                      className="absolute top-0 h-full w-full"
                      style={{
                        left: `${idx * 100}%`,
                        visibility: isInRange ? "visible" : "hidden",
                      }}
                    >
                      {isInRange && (
                        <YearColumn
                          ref={(el) => {
                            if (el) {
                              scrollContainerRefs.current.set(slide.year, el)
                            } else {
                              scrollContainerRefs.current.delete(slide.year)
                            }
                          }}
                          year={slide.year}
                          events={slide.events}
                          images={slide.images}
                          loadedImages={loadedImages}
                          onImageLoad={handleImageLoad}
                          formatDate={formatDate}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-sidebar-foreground/40 font-light">
              {currentLanguage === "de"
                ? "Scrollen Sie durch die Zeitleiste, um Details zu sehen"
                : "Scroll through the timeline to see details"}
            </div>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
