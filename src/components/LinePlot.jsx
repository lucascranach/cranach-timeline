import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { useAtomValue } from "jotai";
import {
  cranachElderEvents,
  cranachYoungerEvents,
  lutherEvents,
  historyEvents
} from "../store/atoms";

// Set this value to control the vertical gap between event types (0 = bottom, 1 = top)
const EVENT_GAP = 0.05; // Adjust this value for more/less spacing

const EVENT_TYPES = [
  { key: "elder", atom: cranachElderEvents, color: "#255982", label: "Cranach Elder" },
  { key: "younger", atom: cranachYoungerEvents, color: "#e67e22", label: "Cranach Younger" },
  { key: "luther", atom: lutherEvents, color: "#27ae60", label: "Luther" },
  { key: "history", atom: historyEvents, color: "#c0392b", label: "History" }
];

// Assign y positions with spacing from bottom up
EVENT_TYPES.forEach((t, i) => {
  t.y = i * EVENT_GAP;
});

export default function LinePlot({
  width = window.innerWidth,
  height = window.innerHeight,
  marginTop = 40,
  marginRight = 40,
  marginBottom = 40,
  marginLeft = 60,
  onlyShowLabeledStripes = true
}) {
  // Load all event data
  const elder = useAtomValue(cranachElderEvents) || [];
  const younger = useAtomValue(cranachYoungerEvents) || [];
  const luther = useAtomValue(lutherEvents) || [];
  const history = useAtomValue(historyEvents) || [];

  // Combine all events with type
  const allEvents = [
    ...elder.map(d => ({ ...d, type: "elder" })),
    ...younger.map(d => ({ ...d, type: "younger" })),
    ...luther.map(d => ({ ...d, type: "luther" })),
    ...history.map(d => ({ ...d, type: "history" }))
  ].map(d => ({
    ...d,
    date: new Date(d.startDate)
  })).sort((a, b) => a.date - b.date);

  const svgRef = useRef();
  const gx = useRef();
  const gy = useRef();

  // State for zoom/pan
  const [transform, setTransform] = useState(d3.zoomIdentity);

  // Scales
  const x = d3.scaleTime(
    d3.extent(allEvents, d => d.date),
    [marginLeft, width - marginRight]
  );
  // y scale: 0..1 mapped to vertical positions
  const y = d3.scaleLinear(
    [0, 1],
    [height - marginBottom, marginTop]
  );

  // Axes
  useEffect(() => {
    d3.select(gx.current).call(d3.axisBottom(x).scale(transform.rescaleX(x)));
  }, [gx, x, transform]);
  useEffect(() => {
    d3.select(gy.current).call(d3.axisLeft(y).ticks(0));
  }, [gy, y, transform]);

  // Zoom behavior
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [width, height]])
      .on("zoom", (event) => {
        setTransform(event.transform);
      });
    svg.call(zoom);
    return () => svg.on(".zoom", null);
  }, [width, height]);

  // Responsive vertical stripes for visible years
  const visibleX = transform.rescaleX(x);
  const [visibleStart, visibleEnd] = visibleX.domain();
  const startYear = visibleStart.getFullYear();
  const endYear = visibleEnd.getFullYear();

  // Get the tick values for the current axis (years shown as labels)
  const tickYears = useRef([]);
  useEffect(() => {
    const axis = d3.axisBottom(x).scale(visibleX);
    const tempG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    d3.select(tempG).call(axis);
    const ticks = Array.from(tempG.querySelectorAll(".tick text")).map(el => {
      const year = Number(el.textContent);
      return isNaN(year) ? null : year;
    }).filter(Boolean);
    tickYears.current = ticks;
  }, [visibleX, x, transform]);

  const stripes = [];
  for (let year = startYear; year <= endYear; year++) {
    if (onlyShowLabeledStripes && !tickYears.current.includes(year)) continue;
    const date = new Date(year, 0, 1);
    const xPos = visibleX(date);
    if (xPos >= marginLeft && xPos <= width - marginRight) {
      stripes.push(
        <line
          key={year}
          x1={xPos}
          y1={marginTop}
          x2={xPos}
          y2={height - marginBottom}
          stroke="#e0e7ef"
          strokeWidth={2}
          pointerEvents="none"
        />
      );
    }
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        cursor: "grab",
        background: "#fff"
      }}
    >
      {/* Vertical stripes */}
      <g>{stripes}</g>
      <g ref={gx} transform={`translate(0,${height - marginBottom})`} />
      <g ref={gy} transform={`translate(${marginLeft},0)`} />
      {/* Plot all events as colored points */}
      <g>
        {allEvents.map((d, i) => {
          const typeInfo = EVENT_TYPES.find(t => t.key === d.type);
          const yValue = typeInfo?.y ?? 0;
          return (
            <g key={i}>
              <circle
                cx={transform.applyX(x(d.date))}
                cy={y(yValue)} // <--- Only use y(yValue), no transform.applyY
                r="7"
                fill={typeInfo?.color || "#888"}
                stroke="#fff"
                strokeWidth="1.5"
              />
              <text
                x={transform.applyX(x(d.date))}
                y={y(yValue) - 14} // <--- Only use y(yValue), no transform.applyY
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
      {/* Legend */}
      <g>
        {EVENT_TYPES.map((t, i) => (
          <g key={t.key} transform={`translate(${marginLeft + i * 180},${marginTop - 25})`}>
            <circle r="7" fill={t.color} stroke="#fff" strokeWidth="1.5" />
            <text x="15" y="5" fontSize="16" fill="#222">{t.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}