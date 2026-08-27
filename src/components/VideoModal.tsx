"use client";

import { useEffect, useRef, useCallback } from "react";
import styles from "./VideoModal.module.css";

interface VideoModalProps {
  src: string;
  poster: string;
  name: string;
  onClose: () => void;
}

export default function VideoModal({ src, poster, name, onClose }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 2;
    v.play().catch(() => {});
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose]
  );

  return (
    <div ref={overlayRef} className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.card}>
        <div className={styles.videoWrap}>
          <video
            ref={videoRef}
            className={styles.video}
            src={src}
            poster={poster}
            muted
            autoPlay
            playsInline
            loop
          />
          <div className={styles.explore}>
            <a className={styles.explorePill} href="#" onClick={(e) => e.preventDefault()}>
              Explore
            </a>
            <a className={styles.arrowBtn} href="#" onClick={(e) => e.preventDefault()} aria-label="Open">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10L10 4M10 4H5M10 4V9" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
