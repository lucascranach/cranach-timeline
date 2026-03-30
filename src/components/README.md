# Components Reference

This document describes all components in `src/components`, grouped by domain.

## Events

| File                    | Exports                                                 | What it does                                                                    |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| events/EventGroup.tsx   | EventGroup                                              | Renders one event group with pills, outline, label, and active/hover behavior.  |
| events/EventPill.tsx    | EventPill                                               | Renders instanced event pills with per-instance transforms and scaling updates. |
| events/Events.tsx       | Events                                                  | Orchestrates event preparation, selection, and rendering of all event groups.   |
| events/GroupLabel.tsx   | GroupLabel                                              | Renders the localized label for an event group.                                 |
| events/GroupOutline.tsx | GroupOutline                                            | Draws the rectangle outline around an event group and updates active styling.   |
| events/index.ts         | Events, EventGroup, EventPill, GroupOutline, GroupLabel | Barrel file that re-exports all event components from one import surface.       |

## Layout

| File                     | Exports       | What it does                                                                      |
| ------------------------ | ------------- | --------------------------------------------------------------------------------- |
| layout/app-sidebar.tsx   | AppSidebar    | Hosts the sidebar shell and manages scrolling, formatting, and panel behavior.    |
| layout/ImageCard.tsx     | ImageCard     | Displays one image card with loading state and external link behavior.            |
| layout/MobileBlocker.tsx | MobileBlocker | Blocks small/mobile screens and shows a localized desktop recommendation overlay. |
| layout/YearColumn.tsx    | YearColumn    | Renders year-focused sidebar content: events list and gallery-style imagery.      |

## Timeline

| File                                | Exports                                  | What it does                                                                     |
| ----------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------- |
| timeline/Atlas.tsx                  | Atlas                                    | Main timeline composition component coordinating data, events, zoom, and layers. |
| timeline/DecadeBackgrounds.tsx      | DecadeBackgrounds                        | Renders decade and sub-decade background guides/tick visuals.                    |
| timeline/Experience.tsx             | Experience                               | High-level scene wrapper that mounts the Atlas experience.                       |
| timeline/FallbackUI.tsx             | FallbackUI                               | Renders a lightweight fallback visual when primary scene content is unavailable. |
| timeline/FocusedYearBeam.tsx        | FocusedYearBeam                          | Draws a vertical beam at the currently focused timeline year.                    |
| timeline/ImagePrefetchIndicator.tsx | ImagePrefetchIndicator                   | Shows image-cache prefetch progress and completion status.                       |
| timeline/Scene.tsx                  | TimelineControls (internal), scene setup | Configures the Three.js scene/canvas and interaction controls.                   |
| timeline/ThemeToggle.tsx            | ThemeToggle                              | Toggles light/dark theme from the timeline UI.                                   |
| timeline/ThumbnailMesh.tsx          | ThumbnailMesh                            | Renders the instanced thumbnail mesh and interaction-ready picking updates.      |
| timeline/TimelineAxis.tsx           | TimelineAxis                             | Renders the baseline axis and major/minor tick marks.                            |
| timeline/YearLabels.tsx             | YearLabels                               | Renders year labels with zoom-aware density and visibility.                      |
| timeline/ZoomToggle.tsx             | ZoomToggle                               | Toggles timeline zoom mode with UI feedback.                                     |

## UI Primitives

| File             | Exports                                                  | What it does                                                            |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| ui/button.tsx    | Button, buttonVariants                                   | Variant-based button primitive used across the app.                     |
| ui/input.tsx     | Input                                                    | Styled input primitive with focus and disabled states.                  |
| ui/separator.tsx | Separator                                                | Horizontal/vertical separator primitive.                                |
| ui/sheet.tsx     | Sheet and related subcomponents                          | Sheet/modal primitive set built on Radix dialog components.             |
| ui/sidebar.tsx   | SidebarProvider, useSidebar, sidebar subcomponents       | Complete sidebar primitive system with responsive/collapsible behavior. |
| ui/skeleton.tsx  | Skeleton                                                 | Animated loading placeholder primitive.                                 |
| ui/tooltip.tsx   | TooltipProvider, Tooltip, TooltipTrigger, TooltipContent | Tooltip primitive set built on Radix tooltip components.                |

## Notes

- Domain folders (`events`, `layout`, `timeline`) contain project-specific components.
- The `ui` folder contains reusable primitives and composition helpers.
