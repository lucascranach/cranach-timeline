import { useState, useEffect } from "react"

interface EventData {
  startDate: string
  endDate?: string
  description: string
}

interface EventGroup {
  name: string
  color: string
  events: EventData[]
}

interface UseEventsReturn {
  eventGroups: EventGroup[]
  loading: boolean
  error: string | null
}

interface EventFileConfig {
  file: string
  name: string
  color: string
}

export const useEvents = (eventFileConfigs: EventFileConfig[] = []): UseEventsReturn => {
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadEvents = async () => {
      if (eventFileConfigs.length === 0) {
        setEventGroups([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const eventPromises = eventFileConfigs.map(async (config) => {
          const response = await fetch(config.file)
          if (!response.ok) {
            throw new Error(`Failed to load events from ${config.file}`)
          }
          const events = await response.json()

          // Sort events by start date
          events.sort((a: EventData, b: EventData) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

          return {
            name: config.name,
            color: config.color,
            events,
          }
        })

        const loadedEventGroups = await Promise.all(eventPromises)
        setEventGroups(loadedEventGroups)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events")
        setEventGroups([])
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [eventFileConfigs])

  return { eventGroups, loading, error }
}
