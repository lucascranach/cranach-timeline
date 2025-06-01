import React from "react";

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

export default DecadeStripes;