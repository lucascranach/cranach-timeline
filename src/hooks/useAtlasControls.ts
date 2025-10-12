import { useControls } from "leva"

export interface AtlasControlsConfig {
  thumbnailWidth: number
  thumbnailHeight: number
  cropMode: "fit" | "fill" | "custom"
  cropOffsetX: number
  cropOffsetY: number
  cropScale: number
  preserveAspectRatio: boolean
  columnsPerYear: number
  rowSpacing: number
  yearSpacing: number
  instanceLimit: number
  showAxis: boolean
  showAllYearLabels: boolean
  majorTickEvery: number
  eventGap: number
  dashLength: number
  dashGap: number
  dashSpeed: number
  atlasY: number
}

export const useAtlasControls = () => {
  const thumbnailControls = useControls("Thumbnail Settings", {
    thumbnailWidth: { value: 1, min: 0.1, max: 3, step: 0.1, label: "Width" },
    thumbnailHeight: { value: 0.5, min: 0.1, max: 3, step: 0.1, label: "Height" },
    preserveAspectRatio: { value: false, label: "Preserve Aspect Ratio" },

    columnsPerYear: { value: 1, min: 1, max: 20, step: 1, label: "Columns per Year" },
    rowSpacing: { value: 0.01, min: 0.1, max: 5, step: 0.1, label: "Row Spacing" },
    yearSpacing: { value: 2, min: 0.1, max: 10, step: 0.1, label: "Year Spacing" },
    instanceLimit: { value: 0, min: 0, max: 10000, step: 100, label: "Instance Limit (0 = auto)" },

    cropMode: {
      value: "fill" as const,
      options: ["fit", "fill", "custom"] as const,
      label: "Crop Mode",
    },
    cropOffsetX: { value: 0, min: -1, max: 1, step: 0.01, label: "Crop Offset X" },
    cropOffsetY: { value: 0, min: -1, max: 1, step: 0.01, label: "Crop Offset Y" },
    cropScale: { value: 1, min: 0.1, max: 2, step: 0.01, label: "Crop Scale" },
  })

  const timelineControls = useControls("Timeline Settings", {
    showAxis: { value: true, label: "Show Axis" },
    showAllYearLabels: { value: false, label: "Show All Year Labels" },
    majorTickEvery: { value: 10, min: 2, max: 50, step: 1, label: "Major Tick Every" },
    atlasY: { value: -25, min: -200, max: 200, step: 1, label: "Atlas Y Offset" },
  })

  const eventControls = useControls("Event Settings", {
    eventGap: { value: 5.0, min: 0, max: 10, step: 0.05, label: "Gap Between Types" },
  })

  const dashControls = useControls("Decade Line Dashes", {
    dashLength: { value: 0.4, min: 0.1, max: 10, step: 0.1, label: "Dash Length" },
    dashGap: { value: 0.8, min: 0.1, max: 10, step: 0.1, label: "Dash Gap" },
    dashSpeed: { value: 0.0, min: -5, max: 5, step: 0.1, label: "Dash Scroll Speed" },
  })

  return {
    ...thumbnailControls,
    ...timelineControls,
    ...eventControls,
    ...dashControls,
  } as AtlasControlsConfig
}
