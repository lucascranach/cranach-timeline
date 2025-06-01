import React from "react";
import { EVENT_TYPES } from "./eventTypes";

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

export default Popup;