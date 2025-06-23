import React from "react"
import { EVENT_TYPES } from "./eventTypes"

function EventPoints({ allEvents, x, y, transform, setPopup, height, marginBottom }) {
  const baseBelow = 24 // px below the x-axis
  const spacing = 24 // px between event types

  return (
    <g>
      {allEvents.map((d, i) => {
        const typeInfo = EVENT_TYPES.find((t) => t.key === d.type)
        // Each type gets its own vertical offset below the axis
        const typeIndex = EVENT_TYPES.findIndex((t) => t.key === d.type)
        const cy = height - marginBottom + baseBelow + typeIndex * spacing
        return (
          <g key={i}>
            <circle
              cx={transform.applyX(x(d.date))}
              cy={cy}
              r="7"
              fill={typeInfo?.color || "#888"}
              stroke="#fff"
              strokeWidth="1.5"
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation()
                setPopup({
                  ...d,
                  color: typeInfo?.color || "#888",
                  type: d.type,
                })
              }}
            />
            <title>{d.description}</title>
          </g>
        )
      })}
    </g>
  )
}

export default EventPoints
