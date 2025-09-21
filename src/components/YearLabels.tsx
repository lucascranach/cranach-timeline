import { Html } from "@react-three/drei"

interface YearLabel {
  x: number
  y: number
  year: string
  key: string
}

interface YearLabelsProps {
  yearLabels: YearLabel[]
  thumbnailHeight: number
  showAllYearLabels: boolean
  majorTickEvery: number
}

const YearLabels = ({ yearLabels, thumbnailHeight, showAllYearLabels, majorTickEvery }: YearLabelsProps) => {
  const filteredLabels = yearLabels.filter((lbl) => showAllYearLabels || parseInt(lbl.year) % majorTickEvery === 0)

  return (
    <>
      {filteredLabels.map((lbl) => (
        <Html key={lbl.key} position={[lbl.x, lbl.y - 2, 0.001]} center style={{ pointerEvents: "none" }}>
          <div
            style={{
              fontSize: `${thumbnailHeight * 32}px`,
              lineHeight: 1,
              fontWeight: 500,
              fontFamily: "system-ui, sans-serif",
              color: "#fff",
              textShadow: "0 0 4px rgba(0,0,0,0.8)",
              whiteSpace: "nowrap",
              transform: "translateY(-2px)",
            }}
          >
            {lbl.year}
          </div>
        </Html>
      ))}
    </>
  )
}

export default YearLabels
