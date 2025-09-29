import { Html } from "@react-three/drei"
import { GroupLabelProps } from "../../types/events"

const GroupLabel = ({ text, position, color, fontSize = 14 }: GroupLabelProps) => {
  return (
    <Html
      position={position}
      style={{
        color: "white",
        fontSize: `${fontSize}px`,
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
        textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
        pointerEvents: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
        textAlign: "right",
        transform: "translate(-100%, -50%)",
        background: "rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        padding: "6px 12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      {text}
    </Html>
  )
}

export default GroupLabel
