import React, { useRef, useEffect, useState } from "react"
import * as d3 from "d3"
import { useAtomValue } from "jotai"
import { useControls } from "leva"
import { cranachElderEvents, cranachYoungerEvents, lutherEvents, historyEvents } from "../../store/atoms"
import { EVENT_TYPES } from "./eventTypes"
import DecadeStripes from "./DecadeStripes"
import EventPoints from "./EventPoints"
import Legend from "./Legend"
import Popup from "./Popup"

function ResultsThumbnails({
  results,
  x,
  marginTop,
  height,
  marginBottom,
  transform,
  thumbWidth,
  thumbHeight,
  thumbGap,
  colCount,
  yearGap,
}) {
  if (!results || !results.length) return null

  // Group results by year
  const groupedByYear = results.reduce((acc, item) => {
    const sorting_number = item.sorting_number
    if (!sorting_number) return acc
    const year = parseInt(sorting_number.slice(0, 4), 10)
    if (!year) return acc
    if (!acc[year]) acc[year] = []
    acc[year].push(item)
    return acc
  }, {})

  return (
    <g>
      {Object.entries(groupedByYear).map(([year, items], yearIdx) => {
        const xPos = transform.applyX(x(new Date(Number(year), 0, 1))) + yearIdx * yearGap
        const rows = Math.ceil(items.length / colCount)
        return items.map((item, i) => {
          const col = i % colCount
          const row = Math.floor(i / colCount)
          return (
            <image
              key={item.img_src || i}
              href={item.img_src ? item.img_src.replace(/-s(\.\w+)$/, "-xs$1") : undefined}
              x={xPos - thumbWidth + col * (thumbWidth + thumbGap)}
              y={height - marginBottom - thumbHeight - row * (thumbHeight + thumbGap)}
              width={thumbWidth}
              height={thumbHeight}
              style={{ cursor: "pointer" }}
              preserveAspectRatio="xMidYMid slice"
            >
              <title>{item.title}</title>
            </image>
          )
        })
      })}
    </g>
  )
}

export default function LinePlot({
  width = window.innerWidth,
  height = window.innerHeight,
  marginTop = 40,
  marginRight = 40,
  marginBottom = 120,
  marginLeft = 60,
  onlyShowLabeledStripes = true,
  results = [],
}) {
  // Load all event xPos
  const elder = useAtomValue(cranachElderEvents) || []
  const younger = useAtomValue(cranachYoungerEvents) || []
  const luther = useAtomValue(lutherEvents) || []
  const history = useAtomValue(historyEvents) || []

  // Combine all events with type
  const allEvents = [
    ...elder.map((d) => ({ ...d, type: "elder" })),
    ...younger.map((d) => ({ ...d, type: "younger" })),
    ...luther.map((d) => ({ ...d, type: "luther" })),
    ...history.map((d) => ({ ...d, type: "history" })),
  ]
    .map((d) => ({
      ...d,
      date: new Date(d.startDate),
    }))
    .sort((a, b) => a.date - b.date)

  const svgRef = useRef()
  const gx = useRef()
  const gy = useRef()
  const gyNegative = useRef()

  // State for zoom/pan
  const [transform, setTransform] = useState(d3.zoomIdentity)

  // Popup state: { ...event, color, index }
  const [popup, setPopup] = useState(null)

  // Scales
  const x = d3.scaleTime(
    d3.extent(allEvents, (d) => d.date),
    [marginLeft, width - marginRight]
  )
  const y = d3.scaleLinear([0, 1], [height - marginBottom, marginTop])

  // Axes
  useEffect(() => {
    d3.select(gx.current).call(d3.axisBottom(x).scale(transform.rescaleX(x)))
  }, [gx, x, transform])
  useEffect(() => {
    d3.select(gy.current).call(d3.axisLeft(y).ticks(0))
  }, [gy, y, transform])
  useEffect(() => {
    // Negative y-axis: place it below the x-axis
    d3.select(gyNegative.current).call(d3.axisLeft(y).ticks(0).tickSize(6))
  }, [gyNegative, y, transform])

  // Zoom behavior
  useEffect(() => {
    const svg = d3.select(svgRef.current)
    const zoom = d3
      .zoom()
      .scaleExtent([1, 10])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", (event) => {
        setTransform(event.transform)
      })
    svg.call(zoom)
    return () => svg.on(".zoom", null)
  }, [width, height])

  // Responsive vertical stripes for visible years
  const visibleX = transform.rescaleX(x)
  const [visibleStart, visibleEnd] = visibleX.domain()
  const startYear = visibleStart.getFullYear()
  const endYear = visibleEnd.getFullYear()

  // Get the tick values for the current axis (years shown as labels)
  const tickYears = useRef([])
  useEffect(() => {
    const axis = d3.axisBottom(x).scale(visibleX)
    const tempG = document.createElementNS("http://www.w3.org/2000/svg", "g")
    d3.select(tempG).call(axis)
    const ticks = Array.from(tempG.querySelectorAll(".tick text"))
      .map((el) => {
        const year = Number(el.textContent)
        return isNaN(year) ? null : year
      })
      .filter(Boolean)
    tickYears.current = ticks
  }, [visibleX, x, transform])

  // Popup position calculation
  let popupPos = null
  if (popup) {
    const typeInfo = EVENT_TYPES.find((t) => t.key === popup.type)
    const yValue = typeInfo?.y ?? 0
    popupPos = {
      x: transform.applyX(x(new Date(popup.startDate))),
      y: y(yValue),
    }
  }

  // Close popup on outside click
  const popupRef = useRef()
  useEffect(() => {
    if (!popup) return
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopup(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [popup])

  // Leva controls for adjustable variables
  const { thumbWidth, thumbHeight, thumbGap, colCount, yearGap, eventBaseBelow, eventSpacing } = useControls(
    "Thumbnails & Events",
    {
      thumbWidth: { value: 32, min: 8, max: 64, step: 1, label: " Width" },
      thumbHeight: { value: 16, min: 8, max: 64, step: 1, label: " Height" },
      thumbGap: { value: 2, min: 0, max: 16, step: 1, label: "Thumb Gap" },
      colCount: { value: 3, min: 1, max: 10, step: 1, label: "Thumb Columns" },
      yearGap: { value: 0, min: 0, max: 500, step: 1, label: "Year Gap" },
      eventBaseBelow: { value: 24, min: 0, max: 100, step: 1, label: "Event Base Below" },
      eventSpacing: { value: 24, min: 0, max: 100, step: 1, label: "Event Spacing" },
    }
  )

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
        }}
      >
        {/* <DecadeStripes
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
        /> */}
        <g ref={gx} transform={`translate(0,${height - marginBottom})`} />
        <g ref={gy} transform={`translate(${marginLeft},0)`} />
        <EventPoints
          allEvents={allEvents}
          x={x}
          y={y}
          transform={transform}
          setPopup={setPopup}
          height={height}
          marginBottom={marginBottom}
          baseBelow={eventBaseBelow}
          spacing={eventSpacing}
        />
        <ResultsThumbnails
          results={results}
          x={x}
          marginTop={marginTop}
          height={height}
          marginBottom={marginBottom}
          transform={transform}
          thumbWidth={thumbWidth}
          thumbHeight={thumbHeight}
          thumbGap={thumbGap}
          colCount={colCount}
          yearGap={yearGap}
        />
        <Legend marginLeft={marginLeft} marginTop={marginTop} />
      </svg>
      <Popup popup={popup} popupPos={popupPos} popupRef={popupRef} onClose={() => setPopup(null)} />
    </>
  )
}
