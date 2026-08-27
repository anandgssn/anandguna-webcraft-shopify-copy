"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { measureLayout, computeFr, type LayoutItem } from "./LayoutEngine";

export default function DebugOverlay() {
  const [items, setItems] = useState<LayoutItem[]>([]);
  const [fr, setFr] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setEnabled(params.has("debugLayout"));
  }, []);

  const update = useCallback(() => {
    if (!enabled) return;
    const measured = measureLayout();
    setItems(measured);
    setFr(computeFr(window.innerHeight));
    rafRef.current = requestAnimationFrame(update);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, update]);

  if (!enabled) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Info bar */}
      <div
        style={{
          position: "fixed",
          top: 8,
          right: 8,
          background: "rgba(0,0,0,0.85)",
          color: "#0f0",
          fontSize: 11,
          fontFamily: "monospace",
          padding: "6px 10px",
          borderRadius: 6,
          zIndex: 100000,
          pointerEvents: "auto",
        }}
      >
        Fr={fr.toFixed(4)} | {window.innerWidth}×{window.innerHeight} | {items.length} items
      </div>

      {/* Bounding boxes */}
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            position: "absolute",
            left: item.rect.left,
            top: item.rect.top,
            width: item.rect.width,
            height: item.rect.height,
            border: `1px solid ${
              item.layout === "text"
                ? "#0ff"
                : item.layout === "shape"
                ? "#f0f"
                : item.layout === "image"
                ? "#ff0"
                : "#0f0"
            }`,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -14,
              left: 0,
              fontSize: 9,
              fontFamily: "monospace",
              color: "#fff",
              background: "rgba(0,0,0,0.8)",
              padding: "1px 4px",
              borderRadius: 2,
              whiteSpace: "nowrap",
            }}
          >
            {item.id} z={item.depth} ({item.worldX.toFixed(0)}, {item.worldY.toFixed(0)})
          </span>
        </div>
      ))}
    </div>
  );
}
