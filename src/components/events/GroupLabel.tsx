import { Html } from "@react-three/drei"
import { useState, useEffect } from "react"
import { GroupLabelProps } from "../../types/events"
import { getCurrentLanguage } from "../../utils/languageUtils"

const eventNameTranslations: Record<string, { de: string; en: string }> = {
  "Cranach Elder": { de: "Cranach der Ältere", en: "Cranach Elder" },
  "Cranach Younger": { de: "Cranach der Jüngere", en: "Cranach Younger" },
  History: { de: "Geschichte", en: "History" },
  Luther: { de: "Luther", en: "Luther" },
}

const GroupLabel = ({ text, position, color, fontSize = 12, isActive = false }: GroupLabelProps) => {
  const [textColor, setTextColor] = useState("var(--canvas-text)")
  const currentLanguage = getCurrentLanguage()

  useEffect(() => {
    const updateColors = () => {
      const styles = getComputedStyle(document.documentElement)
      setTextColor(styles.getPropertyValue("--canvas-text").trim())
    }

    updateColors()

    const observer = new MutationObserver(updateColors)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const translatedText = eventNameTranslations[text]?.[currentLanguage] || text

  return (
    <Html
      position={position}
      zIndexRange={[1000, 0]}
      style={{
        color: textColor,
        fontSize: `${fontSize}px`,
        fontFamily: "IBMPlexSans, sans-serif",
        fontWeight: 500,
        pointerEvents: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
        textAlign: "right",
        transform: "translate(-100%, -50%)",
        opacity: 0.8,
      }}
    >
      {translatedText}
    </Html>
  )
}

export default GroupLabel
