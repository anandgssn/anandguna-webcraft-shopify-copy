"use client";

import { useEffect, useRef } from "react";
import styles from "./DarkScene.module.css";

/* Generate particles at build time so positions are stable across renders */
const PARTICLE_COUNT = 25;
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: 2 + Math.random() * 2, // 2-4px
  duration: 3 + Math.random() * 5, // 3-8s
  delay: Math.random() * 4, // 0-4s offset
}));

export default function DarkScene({
  children,
}: {
  children: React.ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(styles.visible);
          observer.unobserve(el);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.scene}>
      {/* Gradient transition from white to black */}
      <div className={styles.gradientOverlay} />

      {/* Perspective grid floor */}
      <div className={styles.gridFloor} />

      {/* Floating particles */}
      <div className={styles.particlesContainer}>
        {particles.map((p) => (
          <div
            key={p.id}
            className={styles.particle}
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Footer / child content rendered on top */}
      <div className={styles.contentLayer}>{children}</div>
    </section>
  );
}
