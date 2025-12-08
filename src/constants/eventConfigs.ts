import { EventFileConfig } from "@/types/atlas"
import { Language } from "@/utils/languageUtils"

import { path } from "@/store/base"

export const getEventFileConfigs = (language: Language): EventFileConfig[] => [
  {
    file: `${path}/events/cranachElderEvents_${language}.json`,
    name: "Cranach Elder",
    color: "#FEB701",
  },
  {
    file: `${path}/events/cranachYoungerEvents_${language}.json`,
    name: "Cranach Younger",
    color: "#FEB701",
  },
  {
    file: `${path}/events/historyEvents_${language}.json`,
    name: "History",
    color: "#FEB701",
  },
  {
    file: `${path}/events/lutherEvents_${language}.json`,
    name: "Luther",
    color: "#FEB701",
  },
]

// Keep the old export for backward compatibility
export const EVENT_FILE_CONFIGS: EventFileConfig[] = getEventFileConfigs("en")
