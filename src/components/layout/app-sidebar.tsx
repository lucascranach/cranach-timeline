import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from "@/components/ui/sidebar"
import { useSidebarGallery } from "@/hooks/useSidebarGalleryContext"
import { Button } from "@/components/ui/button"
import { Image, List, Filter } from "lucide-react"
import { useState, useEffect, useMemo } from "react"

export function AppSidebar() {
  const { columnData, viewMode, setViewMode } = useSidebarGallery()
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("ALL")

  // Reset loaded images when column data changes
  useEffect(() => {
    setLoadedImages(new Set())
  }, [columnData])

  const handleImageLoad = (identifier: string) => {
    setLoadedImages((prev) => new Set(prev).add(identifier))
  }

  // Get unique entity types from the column data
  const entityTypes = useMemo(() => {
    if (!columnData) return []
    const types = new Set(columnData.images.map((img) => img.entity_type).filter(Boolean))
    return Array.from(types).sort()
  }, [columnData])

  // Filter images based on selected entity type
  const filteredImages = useMemo(() => {
    if (!columnData) return []
    if (entityTypeFilter === "ALL") return columnData.images
    return columnData.images.filter((img) => img.entity_type === entityTypeFilter)
  }, [columnData, entityTypeFilter])

  // Reset filter when column changes
  useEffect(() => {
    setEntityTypeFilter("ALL")
  }, [columnData])

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
                  {filteredImages.length} work{filteredImages.length !== 1 ? "s" : ""} in this column
                  {entityTypeFilter !== "ALL" && ` (filtered by ${entityTypeFilter})`}
                </p>

                {/* Entity Type Filter */}
                {entityTypes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Filter className="h-4 w-4" />
                      <span>Filter by Type</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant={entityTypeFilter === "ALL" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEntityTypeFilter("ALL")}
                        className="h-7 text-xs"
                      >
                        All ({columnData.images.length})
                      </Button>
                      {entityTypes.map((type) => {
                        const count = columnData.images.filter((img) => img.entity_type === type).length
                        return (
                          <Button
                            key={type}
                            variant={entityTypeFilter === type ? "default" : "outline"}
                            size="sm"
                            onClick={() => setEntityTypeFilter(type)}
                            className="h-7 text-xs"
                          >
                            {type} ({count})
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {viewMode === "ids" ? (
                  <div className="space-y-1">
                    {filteredImages.map((image, idx) => {
                      const inventoryNumber = image["inventory_number\t"]?.trim() || image.sorting_number
                      const url = inventoryNumber ? `https://lucascranach.org/en/${inventoryNumber}` : null
                      return (
                        <div
                          key={image.sorting_number || idx}
                          className="text-sm font-mono bg-secondary/50 px-2 py-1 rounded cursor-pointer hover:bg-secondary transition-colors"
                          onClick={() => url && window.open(url, "_blank")}
                        >
                          {inventoryNumber || image.filename}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {filteredImages.map((image, idx) => {
                      const identifier = image.sorting_number || `${idx}`
                      const isLoaded = loadedImages.has(identifier)
                      const inventoryNumber = image["inventory_number\t"]?.trim() || image.sorting_number
                      const url = inventoryNumber ? `https://lucascranach.org/en/${inventoryNumber}` : null
                      return (
                        <div
                          key={identifier}
                          className="relative bg-secondary rounded overflow-hidden border border-border aspect-3/4 cursor-pointer hover:border-primary transition-colors"
                          onClick={() => url && window.open(url, "_blank")}
                        >
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
                            <p className="text-xs font-mono text-white truncate">{inventoryNumber}</p>
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
