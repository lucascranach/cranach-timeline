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
const EVENT_GAP = 0.05;

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

function DecadeStripes({ visibleX, marginLeft, marginRight, marginTop, marginBottom, height, onlyShowLabeledStripes, tickYears, startYear, endYear }) {
  const stripes = [];
  for (let year = startYear; year <= endYear; year++) {
    if (onlyShowLabeledStripes && !tickYears.current.includes(year)) continue;
    const date = new Date(year, 0, 1);
    const xPos = visibleX(date);
    if (xPos >= marginLeft && xPos <= window.innerWidth - marginRight) {
      const isDecade = year % 10 === 0;
      stripes.push(
        <line
          key={year}
          x1={xPos}
          y1={marginTop}
          x2={xPos}
          y2={height - marginBottom}
          stroke={isDecade ? "#b0b7c6" : "#e0e7ef"}
          strokeWidth={isDecade ? 3 : 2}
          pointerEvents="none"
        />
      );
    }
  }
  return <g>{stripes}</g>;
}

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

function Legend({ marginLeft, marginTop }) {
  return (
    <g>
      {EVENT_TYPES.map((t, i) => (
        <g key={t.key} transform={`translate(${marginLeft + i * 180},${marginTop - 25})`}>
          <circle r="7" fill={t.color} stroke="#fff" strokeWidth="1.5" />
          <text x="15" y="5" fontSize="16" fill="#222">{t.label}</text>
        </g>
      ))}
    </g>
  );
}

function Popup({ popup, popupPos, popupRef, onClose }) {
  if (!popup || !popupPos) return null;
  return (
    <div
      ref={popupRef}
      style={{
        position: "fixed",
        left: popupPos.x + 20,
        top: popupPos.y,
        background: "#fff",
        border: `2px solid ${popup.color}`,
        borderRadius: 8,
        boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
        padding: "18px 24px 12px 18px",
        zIndex: 1000,
        minWidth: 220,
        maxWidth: 320,
        pointerEvents: "auto"
      }}
    >
      <button
        style={{
          position: "absolute",
          top: 6,
          right: 10,
          background: "transparent",
          border: "none",
          fontSize: 18,
          cursor: "pointer",
          color: "#888"
        }}
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <div style={{ fontWeight: "bold", color: popup.color, marginBottom: 6 }}>
        {popup.type && EVENT_TYPES.find(t => t.key === popup.type)?.label}
      </div>
      <div style={{ fontSize: 13, color: "#222", marginBottom: 4 }}>
        <b>{popup.date.toLocaleDateString()}</b>
      </div>
      <div style={{ fontSize: 14, color: "#444" }}>
        {popup.description}
      </div>
    </div>
  );
}

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

  // Popup state: { ...event, color, index }
  const [popup, setPopup] = useState(null);

  // Scales
  const x = d3.scaleTime(
    d3.extent(allEvents, d => d.date),
    [marginLeft, width - marginRight]
  );
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

  // Popup position calculation
  let popupPos = null;
  if (popup) {
    const typeInfo = EVENT_TYPES.find(t => t.key === popup.type);
    const yValue = typeInfo?.y ?? 0;
    popupPos = {
      x: transform.applyX(x(new Date(popup.startDate))),
      y: y(yValue)
    };
  }

  // Close popup on outside click
  const popupRef = useRef();
  useEffect(() => {
    if (!popup) return;
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopup(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [popup]);

  return (
    <>
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
        <DecadeStripes
          visibleX={visibleX}
          marginLeft={marginLeft}
          marginRight={marginRight}
          marginTop={marginTop}
          marginBottom={marginBottom}
          height={height}
          onlyShowLabeledStripes={onlyShowLabeledStripes}
          tickYears={tickYears}
          startYear={startYear}
          endYear={endYear}
        />
        <g ref={gx} transform={`translate(0,${height - marginBottom})`} />
        <g ref={gy} transform={`translate(${marginLeft},0)`} />
        <EventPoints
          allEvents={allEvents}
          x={x}
          y={y}
          transform={transform}
          setPopup={setPopup}
        />
        <Legend marginLeft={marginLeft} marginTop={marginTop} />
      </svg>
      <Popup popup={popup} popupPos={popupPos} popupRef={popupRef} onClose={() => setPopup(null)} />
    </>
  );
}