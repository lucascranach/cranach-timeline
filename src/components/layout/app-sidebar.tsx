import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from "@/components/ui/sidebar"
import { useSidebarGallery } from "@/hooks/useSidebarGalleryContext"

export function AppSidebar() {
  const { columnData } = useSidebarGallery()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-4 py-2">
          <h2 className="text-lg font-semibold">Timeline Gallery</h2>
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
