import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from "@/components/ui/sidebar"
import { useSidebarGallery } from "@/hooks/useSidebarGalleryContext"
import { Button } from "@/components/ui/button"
import { Image, List } from "lucide-react"
import { useState, useEffect } from "react"

export function AppSidebar() {
  const { columnData, viewMode, setViewMode } = useSidebarGallery()
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  // Reset loaded images when column data changes
  useEffect(() => {
    setLoadedImages(new Set())
  }, [columnData])

  const handleImageLoad = (sortingNumber: string) => {
    setLoadedImages((prev) => new Set(prev).add(sortingNumber))
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Timeline Gallery</h2>
            {columnData && (
              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === "ids" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("ids")}
                  className="h-7 px-2"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "thumbnails" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("thumbnails")}
                  className="h-7 px-2"
                >
                  <Image className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {columnData ? (
            <div className="px-4 py-2">
              <h3 className="font-medium mb-2">
                Year {columnData.year} - Column {columnData.column + 1}
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {columnData.images.length} work{columnData.images.length !== 1 ? "s" : ""} in this column
                </p>

                {viewMode === "ids" ? (
                  <div className="space-y-1">
                    {columnData.images.map((image, idx) => (
                      <div
                        key={image.sorting_number || idx}
                        className="text-sm font-mono bg-secondary/50 px-2 py-1 rounded"
                      >
                        {image.sorting_number || image.filename}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {columnData.images.map((image, idx) => {
                      const isLoaded = loadedImages.has(image.sorting_number || "")
                      return (
                        <div
                          key={image.sorting_number || idx}
                          className="relative bg-secondary rounded overflow-hidden border border-border aspect-3/4"
                        >
                          {!isLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="animate-pulse bg-muted w-full h-full" />
                            </div>
                          )}
                          {image.original_url ? (
                            <img
                              src={image.original_url}
                              alt={image.sorting_number || image.filename}
                              loading="lazy"
                              className={`w-full h-full object-contain transition-opacity duration-300 ${
                                isLoaded ? "opacity-100" : "opacity-0"
                              }`}
                              onLoad={() => handleImageLoad(image.sorting_number || "")}
                              onError={(e) => {
                                // Fallback to a placeholder or hide on error
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                              No image available
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/75 px-1 py-0.5">
                            <p className="text-xs font-mono text-white truncate">{image.sorting_number}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-muted-foreground">Click a thumbnail to view column details</div>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
