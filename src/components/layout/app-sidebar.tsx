import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from "@/components/ui/sidebar"
import { useSidebarGallery } from "@/hooks/useSidebarGalleryContext"
import { Separator } from "@/components/ui/separator"
import { useState, useMemo, useCallback, useRef, useEffect } from "react"

export function AppSidebar() {
  const { focusedYearData, allYearSlides } = useSidebarGallery()
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const scrollContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [prevFocusedYear, setPrevFocusedYear] = useState<number | null>(null)

  const handleImageLoad = (identifier: string) => {
    setLoadedImages((prev) => new Set(prev).add(identifier))
  }

  // Track year changes with delay for smoother transitions
  useEffect(() => {
    if (focusedYearData?.year !== prevFocusedYear) {
      const timer = setTimeout(() => {
        setPrevFocusedYear(focusedYearData?.year ?? null)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [focusedYearData?.year, prevFocusedYear])

  // Reset scroll position to top when focused year changes with smooth animation
  useEffect(() => {
    if (focusedYearData) {
      const container = scrollContainerRefs.current.get(focusedYearData.year)
      if (container) {
        container.scrollTo({
          top: 0,
          behavior: "smooth",
        })
      }
    }
  }, [focusedYearData?.year])

  // Format date nicely - memoized
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }, [])

  // Keep more adjacent years loaded (±2) to prevent laggy disappearing effect
  const visibleSlides = useMemo(() => {
    if (!focusedYearData || allYearSlides.length === 0) {
      return {
        slides: allYearSlides.slice(0, 5),
        startIndex: 0,
      }
    }

    const currentIndex = allYearSlides.findIndex((slide) => slide.year === focusedYearData.year)
    if (currentIndex === -1) {
      return {
        slides: allYearSlides.slice(0, 5),
        startIndex: 0,
      }
    }

    // Keep 2 years before and 2 years after for smoother scrolling
    const start = Math.max(0, currentIndex - 2)
    const end = Math.min(allYearSlides.length, currentIndex + 3)

    return {
      slides: allYearSlides.slice(start, end),
      startIndex: start,
    }
  }, [focusedYearData, allYearSlides])

  const renderYearContent = (year: number, events: any[], images: any[]) => {
    return (
      <>
        {/* All Events for this year */}
        {events.length > 0 ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Events ({events.reduce((sum, g) => sum + g.processedEvents.length, 0)})
            </div>
            {events.map((eventGroup) => (
              <div key={eventGroup.name} className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgb(250, 204, 21)" }}>
                  {eventGroup.name}
                </div>
                {eventGroup.processedEvents.map((event: any, index: number) => {
                  const eventId = `${eventGroup.name}-${index}-${year}`
                  return (
                    <div
                      key={eventId}
                      className="border-l-2 border-white/10 pl-4 py-1 transition-all duration-200 hover:border-primary/60"
                    >
                      <div className="text-xs font-medium text-white/60 mb-1.5">
                        {formatDate(event.event.startDate)}
                      </div>
                      <div
                        className="text-sm leading-relaxed text-white/85 [&_p]:text-white/85 [&_strong]:text-white [&_em]:text-white/80 [&_a]:text-primary [&_a]:underline"
                        dangerouslySetInnerHTML={{ __html: event.event.description }}
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-2 py-8 text-center">
            <p className="text-sm text-white/40">No events recorded for this year</p>
          </div>
        )}

        {/* Thumbnails for this year */}
        {images.length > 0 ? (
          <>
            {events.length > 0 && <Separator className="my-6 opacity-30" />}
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Artworks ({images.length})
              </div>
              <div className="grid grid-cols-2 gap-3">
                {images.map((image: any, idx: number) => {
                  const identifier = `${image.sorting_number || idx}-${year}`
                  const isLoaded = loadedImages.has(identifier)
                  const inventoryNumber = image["inventory_number\t"]?.trim() || image.sorting_number
                  const url = inventoryNumber ? `https://lucascranach.org/en/${inventoryNumber}` : null
                  const title = image.title || inventoryNumber || "Untitled"
                  return (
                    <div key={identifier} className="space-y-2">
                      <div
                        className="relative overflow-hidden border border-white/8 cursor-pointer hover:border-primary/40 transition-all duration-300 hover:scale-[1.03] group"
                        onClick={() => url && window.open(url, "_blank")}
                      >
                        <div className="relative aspect-3/4 bg-black/20">
                          {!isLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="animate-pulse bg-white/5 w-full h-full" />
                            </div>
                          )}
                          {image.original_url ? (
                            <img
                              src={image.original_url}
                              alt={title}
                              loading="lazy"
                              className={`w-full h-full object-contain transition-all duration-500 group-hover:scale-105 ${
                                isLoaded ? "opacity-100" : "opacity-0"
                              }`}
                              onLoad={() => handleImageLoad(identifier)}
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                              No image available
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-white/70 leading-tight line-clamp-2">{title}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            {events.length > 0 && <Separator className="my-6 opacity-30" />}
            <div className="px-2 py-8 text-center">
              <p className="text-sm text-white/40">No artworks available for this year</p>
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <Sidebar side="right">
      <SidebarHeader>
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center justify-start">
            <h2 className="text-3xl font-light tracking-tight text-white">
              {focusedYearData ? focusedYearData.year : "Timeline"}
            </h2>
          </div>
          {/* {focusedYearData && <p className="text-center text-xs text-white/40 mt-2 font-light">Year in focus</p>} */}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {allYearSlides.length > 0 && focusedYearData ? (
            <div className="relative h-full overflow-hidden">
              <div
                className="flex h-full transition-transform duration-500 ease-out will-change-transform"
                style={{
                  transform: `translateX(-${allYearSlides.findIndex((s) => s.year === focusedYearData.year) * 100}%)`,
                }}
              >
                {visibleSlides.slides.map((slide, idx) => {
                  const isActive = slide.year === focusedYearData.year
                  const distance = Math.abs(
                    allYearSlides.findIndex((s) => s.year === slide.year) -
                      allYearSlides.findIndex((s) => s.year === focusedYearData.year)
                  )

                  return (
                    <div
                      key={slide.year}
                      className="shrink-0 w-full h-full transition-opacity duration-300 flex flex-col"
                      style={{
                        marginLeft: idx === 0 ? `${visibleSlides.startIndex * 100}%` : "0",
                        opacity: distance > 1 ? 0.3 : 1,
                      }}
                    >
                      <div
                        ref={(el) => {
                          if (el) {
                            scrollContainerRefs.current.set(slide.year, el)
                          }
                        }}
                        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-6 py-4 min-h-0"
                      >
                        <div className="space-y-6">{renderYearContent(slide.year, slide.events, slide.images)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-white/40 font-light">
              Scroll through the timeline to see details
            </div>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
