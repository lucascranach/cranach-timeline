export interface AtlasImage {
  filename: string
  x: number
  y: number
  width: number
  height: number
  sorting_number?: string
  original_url?: string
  "inventory_number\t"?: string
  entity_type?: string
  title?: string
}

export interface AtlasData {
  atlas: {
    width: number
    height: number
  }
  images: AtlasImage[]
}

export interface SelectionState {
  groupIndex: number
  eventIndex: number
  centerOnSelect?: boolean
}

export interface EventFileConfig {
  file: string
  name: string
  color: string
}
