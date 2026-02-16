import { forwardRef, memo } from "react"
import { Separator } from "@/components/ui/separator"
import { getCurrentLanguage, getLocalizedValue } from "@/utils/languageUtils"

const eventNameTranslations: Record<string, { de: string; en: string }> = {
  "Cranach Elder": { de: "Cranach der Ältere", en: "Cranach Elder" },
  "Cranach Younger": { de: "Cranach der Jüngere", en: "Cranach Younger" },
  History: { de: "Geschichte", en: "History" },
  Luther: { de: "Luther", en: "Luther" },
}

interface YearColumnProps {
  year: number
  events: any[]
  images: any[]
  loadedImages: Set<string>
  onImageLoad: (identifier: string) => void
  formatDate: (dateString: string) => string
}

const YearColumn = forwardRef<HTMLDivElement, YearColumnProps>(
  ({ year, events, images, loadedImages, onImageLoad, formatDate }, ref) => {
    const currentLanguage = getCurrentLanguage()

    return (
      <div ref={ref} className="absolute inset-0 overflow-y-auto overflow-x-hidden px-6 py-4">
        <div className="space-y-6">
          {/* Events Section */}
          {events.length > 0 ? (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                {currentLanguage === "de" ? "Ereignisse" : "Events"} (
                {events.reduce((sum: number, g: any) => sum + g.processedEvents.length, 0)})
              </div>
              {events.map((eventGroup: any) => {
                const translatedGroupName = eventNameTranslations[eventGroup.name]?.[currentLanguage] || eventGroup.name
                return (
                  <div key={eventGroup.name} className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgb(250, 204, 21)" }}>
                      {translatedGroupName}
                    </div>
                    {eventGroup.processedEvents.map((event: any, index: number) => {
                      const eventId = `${eventGroup.name}-${index}-${year}`
                      return (
                        <div key={eventId} className="py-1">
                          <div className="text-xs font-medium text-sidebar-foreground/60 mb-1.5">
                            {formatDate(event.event.startDate)}
                          </div>
                          <div
                            className="text-sm leading-relaxed text-sidebar-foreground/85 [&_p]:text-sidebar-foreground/85 [&_strong]:text-sidebar-foreground [&_em]:text-sidebar-foreground/80 [&_a]:text-primary [&_a]:underline"
                            dangerouslySetInnerHTML={{ __html: event.event.description }}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="px-2 py-8 text-center">
              <p className="text-sm text-sidebar-foreground/40">
                {currentLanguage === "de" ? "Keine Ereignisse für dieses Jahr" : "No events recorded for this year"}
              </p>
            </div>
          )}

          {/* Images Section */}
          {images.length > 0 ? (
            <>
              {events.length > 0 && <Separator className="my-6 opacity-30" />}
              <div className="space-y-4">
                <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                  {currentLanguage === "de" ? "Kunstwerke" : "Artworks"} ({images.length})
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {images.map((image: any, idx: number) => {
                    const uniquePart =
                      image.original_url || image.filename || image.img_src || `${image.sorting_number || "img"}-${idx}`
                    const identifier = `${year}-${uniquePart}`
                    const isLoaded = loadedImages.has(identifier)
                    const inventoryNumber = image["inventory_number\t"]?.trim() || image.sorting_number
                    const url = inventoryNumber
                      ? `https://lucascranach.org/${currentLanguage}/${inventoryNumber}`
                      : null
                    const title =
                      getLocalizedValue(image.title, currentLanguage) ||
                      inventoryNumber ||
                      (currentLanguage === "de" ? "Ohne Titel" : "Untitled")

                    return (
                      <div key={identifier} className="space-y-2">
                        <div className="relative overflow-hidden border border-white/8">
                          <div className="relative aspect-square bg-[#0000001a]">
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
                                className={`w-full h-full object-contain ${isLoaded ? "opacity-100" : "opacity-0"}`}
                                onLoad={() => onImageLoad(identifier)}
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
                        <div className="text-xs text-sidebar-foreground/70 leading-tight line-clamp-2">{title}</div>
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
                <p className="text-sm text-sidebar-foreground/40">
                  {currentLanguage === "de"
                    ? "Keine Kunstwerke für dieses Jahr"
                    : "No artworks available for this year"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }
)

YearColumn.displayName = "YearColumn"

export default memo(YearColumn)
