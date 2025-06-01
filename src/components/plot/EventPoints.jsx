import React from "react";
import { EVENT_TYPES } from "./eventTypes";

function EventPoints({ allEvents, x, y, transform, setPopup }) {
  return (
    <g>
      {allEvents.map((d, i) => {
        const typeInfo = EVENT_TYPES.find(t => t.key === d.type);
        const yValue = typeInfo?.y ?? 0;
        return (
          <g key={i}>
            <circle
              cx={transform.applyX(x(d.date))}
              cy={y(yValue)}
              r="7"
              fill={typeInfo?.color || "#888"}
              stroke="#fff"
              strokeWidth="1.5"
              style={{ cursor: "pointer" }}
              onClick={e => {
                e.stopPropagation();
                setPopup({
                  ...d,
                  color: typeInfo?.color || "#888",
                  type: d.type
                });
              }}
            />
            <text
              x={transform.applyX(x(d.date))}
              y={y(yValue) - 14}
              textAnchor="middle"
              fontSize="14"
              fill={typeInfo?.color || "#222"}
              style={{
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            >
              {d.date.getFullYear()}
            </text>
            <title>{d.description}</title>
          </g>
        );
      })}
    </g>
  );
}

export default EventPoints;