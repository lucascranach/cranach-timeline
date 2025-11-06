import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from "@/components/ui/sidebar"
import { useSidebarGallery } from "@/hooks/useSidebarGalleryContext"
import { Separator } from "@/components/ui/separator"
import { useState, useMemo, useCallback } from "react"

export function AppSidebar() {
  const { focusedYearData, allYearSlides } = useSidebarGallery()
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  const handleImageLoad = (identifier: string) => {
    setLoadedImages((prev) => new Set(prev).add(identifier))
  }

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

  // Only render current year and adjacent years (±1) for performance
  const visibleSlides = useMemo(() => {
    if (!focusedYearData || allYearSlides.length === 0) {
      return {
        slides: allYearSlides.slice(0, 3),
        startIndex: 0,
      }
    }

    const currentIndex = allYearSlides.findIndex((slide) => slide.year === focusedYearData.year)
    if (currentIndex === -1) {
      return {
        slides: allYearSlides.slice(0, 3),
        startIndex: 0,
      }
    }

    const start = Math.max(0, currentIndex - 1)
    const end = Math.min(allYearSlides.length, currentIndex + 2)

    return {
      slides: allYearSlides.slice(start, end),
      startIndex: start,
    }
  }, [focusedYearData, allYearSlides])

  const renderYearContent = (year: number, events: any[], images: any[]) => {
    return (
      <div className="min-w-full h-full px-4 py-2 space-y-4">
        {/* All Events for this year */}
        {events.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              Events ({events.reduce((sum, g) => sum + g.processedEvents.length, 0)})
            </div>
            {events.map((eventGroup) => (
              <div key={eventGroup.name} className="space-y-2">
                <div className="text-xs font-semibold text-primary uppercase tracking-wide">{eventGroup.name}</div>
                {eventGroup.processedEvents.map((event: any, index: number) => {
                  const eventId = `${eventGroup.name}-${index}-${year}`
                  return (
                    <div key={eventId} className="border border-white/20 rounded-md p-3 bg-white/5">
                      <div className="text-sm font-medium text-white mb-2">{formatDate(event.event.startDate)}</div>
                      <div
                        className="text-sm leading-relaxed text-white/90 [&_p]:text-white/90 [&_strong]:text-white [&_em]:text-white/90 [&_a]:text-primary [&_a]:underline"
                        dangerouslySetInnerHTML={{ __html: event.event.description }}
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Thumbnails for this year */}
        {images.length > 0 && (
          <>
            {events.length > 0 && <Separator className="my-4" />}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                Artworks ({images.length})
              </div>
              <div className="grid grid-cols-2 gap-2">
                {images.map((image: any, idx: number) => {
                  const identifier = `${image.sorting_number || idx}-${year}`
                  const isLoaded = loadedImages.has(identifier)
                  const inventoryNumber = image["inventory_number\t"]?.trim() || image.sorting_number
                  const url = inventoryNumber ? `https://lucascranach.org/en/${inventoryNumber}` : null
                  return (
                    <div
                      key={identifier}
                      className="relative bg-secondary rounded-lg overflow-hidden border border-white/20 cursor-pointer hover:border-primary transition-colors"
                      onClick={() => url && window.open(url, "_blank")}
                    >
                      <div className="relative aspect-3/4">
                        {!isLoaded && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-pulse bg-muted w-full h-full" />
                          </div>
                        )}
                        {image.original_url ? (
                          <img
                            src={image.original_url}
                            alt={inventoryNumber || image.filename}
                            loading="lazy"
                            className={`w-full h-full object-contain transition-opacity duration-300 ${
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
                      <div className="bg-black/75 px-2 py-1.5">
                        <p className="text-xs font-mono text-white truncate">{inventoryNumber}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {events.length === 0 && images.length === 0 && (
          <div className="text-center py-8 text-white/50">No events or artworks for this year</div>
        )}
      </div>
    )
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-4 py-3 bg-primary/20 border-b border-primary/40">
          <div className="flex items-center justify-center">
            <h2 className="text-2xl font-bold text-white">{focusedYearData ? focusedYearData.year : "Timeline"}</h2>
          </div>
          {focusedYearData && <p className="text-center text-xs text-white/70 mt-1">Currently viewing this year</p>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {allYearSlides.length > 0 && focusedYearData ? (
            <div className="relative overflow-hidden h-full">
              <div
                className="flex h-full transition-transform duration-500 ease-out will-change-transform"
                style={{
                  transform: `translateX(-${allYearSlides.findIndex((s) => s.year === focusedYearData.year) * 100}%)`,
                }}
              >
                {visibleSlides.slides.map((slide, idx) => (
                  <div
                    key={slide.year}
                    className="shrink-0 w-full h-full"
                    style={{
                      marginLeft: idx === 0 ? `${visibleSlides.startIndex * 100}%` : "0",
                    }}
                  >
                    {renderYearContent(slide.year, slide.events, slide.images)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-white/50">Scroll through the timeline to see details</div>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
