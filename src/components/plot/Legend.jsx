import React from "react"
import { EVENT_TYPES } from "./eventTypes"

function Legend({ marginLeft, marginTop }) {
  return (
    <g>
      {EVENT_TYPES.map((t, i) => (
        <g key={t.key} transform={`translate(${marginLeft + i * 180},${marginTop - 25})`}>
          <circle r="7" fill={t.color} stroke="#fff" strokeWidth="1.5" />
          <text x="15" y="5" fontSize="16" fill="#fff">
            {t.label}
          </text>
        </g>
      ))}
    </g>
  )
}

export default Legend
