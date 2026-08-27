"use client";

import { useEffect, useRef } from "react";
import styles from "./RemoteSection.module.css";

export default function RemoteSection() {
  const linesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    linesRef.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
            }, i * 100);
            obs.unobserve(el);
          }
        },
        { threshold: 0.1 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const setRef = (i: number) => (el: HTMLDivElement | null) => {
    linesRef.current[i] = el;
  };

  const lineStyle = {
    opacity: 0,
    transform: "translateY(32px)",
    transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)",
  };

  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {/* Line 1: Remote */}
        <div ref={setRef(0)} className={styles.line1} style={lineStyle} data-layout="text" data-id="remote-line-0" data-depth="-50">
          <span className={`${styles.displayText} ${styles.colorRed}`}>Remote</span>
        </div>

        {/* Line 2: by design. */}
        <div ref={setRef(1)} className={styles.line2} style={lineStyle} data-layout="text" data-id="remote-line-1" data-depth="-64">
          <span className={`${styles.displayText} ${styles.colorRed}`}>by</span>
          <span className={`${styles.displayText} ${styles.colorRed}`}>design.</span>
        </div>

        {/* Line 3: Together in */}
        <div ref={setRef(2)} className={styles.line3} style={lineStyle} data-layout="text" data-id="remote-line-2" data-depth="-78">
          <span className={`${styles.displayText} ${styles.colorBlack}`}>Together</span>
          <span className={`${styles.displayText} ${styles.colorBlack}`}>in</span>
        </div>

        {/* Line 4: Toronto */}
        <div ref={setRef(3)} className={styles.line4} style={lineStyle} data-layout="text" data-id="remote-line-3" data-depth="-92">
          <span className={`${styles.displayText} ${styles.colorBlack}`}>Toronto</span>
          <span className={styles.locationLabel}>{"ONTARIO,\nCANADA"}</span>
        </div>

        {/* Line 5: Ottawa */}
        <div ref={setRef(4)} className={styles.line5} style={lineStyle} data-layout="text" data-id="remote-line-4" data-depth="-106">
          <span className={styles.locationLabel}>{"ONTARIO,\nCANADA"}</span>
          <span className={`${styles.displayText} ${styles.colorBlack}`}>Ottawa</span>
        </div>

        {/* Line 6: New [studio] York */}
        <div ref={setRef(5)} className={styles.line6} style={lineStyle} data-layout="text" data-id="remote-line-5" data-depth="-120">
          <span className={`${styles.displayText} ${styles.colorBlack}`}>New</span>
          <div className={styles.studioImage} data-layout="image" data-id="remote-studio-img" data-depth="-100">
            <img src="/images/studio.webp" alt="" className={styles.studioImg} />
            <div className={styles.studioOverlay}>
              <img src="/icons/studio-logo.svg" alt="Studio" className={styles.studioLogo} />
              <img src="/icons/expand-icon.svg" alt="" className={styles.studioExpand} />
            </div>
          </div>
          <span className={`${styles.displayText} ${styles.colorBlack}`}>York</span>
          <span className={styles.locationLabel} style={{ marginLeft: "1.5em" }}>{"NEW YORK,\nUSA"}</span>
        </div>

        {/* Line 7: Montreal */}
        <div ref={setRef(6)} className={styles.line7} style={lineStyle} data-layout="text" data-id="remote-line-6" data-depth="-134">
          <span className={styles.locationLabel}>{"QUEBEC,\nCANADA"}</span>
          <span className={`${styles.displayText} ${styles.colorBlack}`}>Montreal</span>
        </div>

        {/* Line 8: Seattle */}
        <div ref={setRef(7)} className={styles.line8} style={lineStyle} data-layout="text" data-id="remote-line-7" data-depth="-148">
          <span className={`${styles.displayText} ${styles.colorBlack}`}>Seattle</span>
          <span className={styles.locationLabel}>{"WASHINGTON,\nUSA"}</span>
        </div>
      </div>
    </section>
  );
}
