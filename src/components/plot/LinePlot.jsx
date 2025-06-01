
import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { useAtomValue } from "jotai";
import {
  cranachElderEvents,
  cranachYoungerEvents,
  lutherEvents,
  historyEvents
} from "../../store/atoms";
import { EVENT_TYPES } from "./eventTypes";
import DecadeStripes from "./DecadeStripes";
import EventPoints from "./EventPoints";
import Legend from "./Legend";
import Popup from "./Popup";

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