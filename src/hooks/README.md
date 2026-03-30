# Hooks Reference

This document describes every hook and hook-related context provider in `src/hooks`.

## Hooks and Providers

| File                         | Exports                                   | What it does                                                                      |
| ---------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| use-mobile.ts                | useIsMobile                               | Detects mobile viewport state using a media query breakpoint.                     |
| useAtlasControls.ts          | useAtlasControls                          | Exposes Leva controls for timeline layout, crop mode, and zoom settings.          |
| useAtlasData.ts              | useAtlasData                              | Loads atlas metadata and builds grouped/sorted image collections by year.         |
| useAtlasGeometry.ts          | useAtlasGeometry                          | Builds geometry-ready arrays (UVs and opacity) for instanced thumbnail rendering. |
| useAtlasTransforms.ts        | useAtlasTransforms                        | Computes thumbnail positions and scales for timeline layout and zoom state.       |
| useEventAutoSelection.ts     | useEventAutoSelection                     | Automatically selects the closest event to camera position during movement.       |
| useEventSelection.ts         | useEventSelection                         | Manages selected event state with support for controlled or internal state.       |
| useEvents.ts                 | useEvents                                 | Fetches event groups from configured JSON files with loading/error handling.      |
| useEventsData.ts             | useEventProcessing, usePillControls       | Shapes event data for rendering and provides pill geometry controls.              |
| useFocusedYear.ts            | useFocusedYear                            | Tracks focused year from camera position and updates sidebar-focused content.     |
| useImagePrefetch.ts          | useImagePrefetch                          | Prefetches timeline images and tracks cache progress via atoms and persistence.   |
| useKeyboardNavigation.ts     | useKeyboardNavigation                     | Enables keyboard navigation between events (horizontal and vertical movement).    |
| useSelectedEventContext.tsx  | SelectedEventProvider, useSelectedEvent   | Provides and consumes selected-event context state and position tracking.         |
| useSidebarGalleryContext.tsx | SidebarGalleryProvider, useSidebarGallery | Provides sidebar mode, focused-year data, view mode, and scroll-direction state.  |
| useThemeContext.tsx          | ThemeProvider, useTheme                   | Provides theme mode (light/dark), persists it, and syncs document classes.        |
| useZoomAnimation.ts          | useZoomAnimation                          | Handles smooth zoom transitions and zoom-origin behavior during camera moves.     |
| useZoomContext.tsx           | ZoomProvider, useZoomContext              | Provides shared zoom-enabled state and mutable target zoom level.                 |

## Notes

- Context provider files in this folder are kept alongside hooks because they expose hook-based access APIs.
- Data hooks in this folder generally return memoized values suitable for render-loop-heavy components.
