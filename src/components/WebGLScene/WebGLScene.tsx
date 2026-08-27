"use client";

import { useEffect, useRef, useCallback } from "react";
import styles from "./WebGLScene.module.css";
import { SceneManager } from "./SceneManager";
import { AmbientEngine } from "../../audio/AmbientEngine";

const tickAudio = typeof window !== "undefined" ? new Audio("/sfx/clock-tick.mp3") : null;
const tockAudio = typeof window !== "undefined" ? new Audio("/sfx/clock-tock.mp3") : null;
if (tickAudio) tickAudio.preload = "auto";
if (tockAudio) tockAudio.preload = "auto";

interface WebGLSceneProps {
  isActive: boolean;
  onClose: () => void;
  onEscClose: () => void;
  locked?: boolean;
}

export default function WebGLScene({ isActive, onClose, onEscClose, locked }: WebGLSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<SceneManager | null>(null);
  const audioRef = useRef<AmbientEngine | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscClose();
    },
    [onEscClose]
  );

  const handleMouseUp = useCallback(() => {
    if (!locked) {
      onClose();
    }
  }, [locked, onClose]);

  // Initialize scene ONCE on mount, regardless of isActive
  useEffect(() => {
    if (containerRef.current && !managerRef.current) {
      const mgr = new SceneManager(containerRef.current);
      managerRef.current = mgr;

      const engine = new AmbientEngine();
      engine.init();
      audioRef.current = engine;
      mgr.setAudioEngine(engine);
    }
    return () => {
      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }
      audioRef.current?.stop();
    };
  }, []);

  // Trigger spread transition when isActive changes
  useEffect(() => {
    if (!managerRef.current) return;

    if (isActive) {
      managerRef.current.startSpread();
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("mouseup", handleMouseUp);
      audioRef.current?.start();
    } else {
      managerRef.current.stopSpread();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mouseup", handleMouseUp);
      audioRef.current?.stop();
      setTimeout(() => {
        document.body.style.overflow = "";
      }, 700);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isActive, handleKeyDown, handleMouseUp]);

  return (
    <div
      className={styles.overlay}
      ref={containerRef}
      data-testid="webgl-overlay"
      style={{
        pointerEvents: isActive ? "auto" : "none",
        visibility: isActive ? "visible" : "hidden",
      }}
    />
  );
}
