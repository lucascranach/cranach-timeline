import { Html } from "@react-three/drei"
import { GroupLabelProps } from "../../types/events"

const GroupLabel = ({ text, position, color, fontSize = 14, isActive = false }: GroupLabelProps) => {
  return (
    <Html
      position={position}
      zIndexRange={[1000, 0]}
      style={{
        color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.8)",
        fontSize: `${fontSize}px`,
        fontFamily: "Arial, sans-serif",
        fontWeight: isActive ? "900" : "bold",
        textShadow: isActive
          ? "0 0 10px rgba(255, 255, 255, 0.8), 1px 1px 2px rgba(0,0,0,0.8)"
          : "1px 1px 2px rgba(0,0,0,0.8)",
        pointerEvents: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
        textAlign: "right",
        transform: "translate(-100%, -50%)",
        background: isActive ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.2)",
        backdropFilter: isActive ? "blur(15px)" : "blur(5px)",
        WebkitBackdropFilter: isActive ? "blur(15px)" : "blur(5px)",
        border: isActive ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        padding: "6px 12px",
        boxShadow: isActive
          ? "0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.1)"
          : "0 4px 6px rgba(0, 0, 0, 0.1)",
        transition: "all 0.2s ease-in-out",
        zIndex: 1,
      }}
    >
      {text}
    </Html>
  )
}

export default GroupLabel
