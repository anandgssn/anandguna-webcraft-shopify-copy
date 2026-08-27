"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./CountdownSection.module.css";
import FloatingObjects from "./FloatingObjects";

const COUNTDOWN_FROM = 26;
const TICK_SEGMENTS = 221;
const TICK_MIDPOINT = Math.floor(TICK_SEGMENTS / 2);
const TICK_INNER_RADIUS = 49 * 0.9655;
const TICK_OUTER_RADIUS = 49 * 0.976;
const TICK_DRAW_WIDTH = 3.5;
const CLOCK_START_Y = 1.5;
const CLOCK_START_SCALE_VH = 2.5;
const DIGIT_FILL_START = 0.75;

const DIGITS = [
  "M32.28 87.12C14.76 87.12 -1.90735e-05 75.24 -1.90735e-05 43.2C-1.90735e-05 11.76 15 5.72205e-06 32.28 5.72205e-06C49.8 5.72205e-06 64.56 11.76 64.56 43.2C64.56 75.24 49.8 87.12 32.28 87.12ZM32.28 13.08C19.8 13.08 16.2 27.48 16.2 43.2C16.2 59.4 19.8 74.16 32.28 74.16C44.76 74.16 48.12 59.52 48.12 43.2C48.12 27.48 44.76 13.08 32.28 13.08Z",
  "M37.56 -5.72205e-06V84H21.48V25.92H2.6986e-05V15.36C13.92 15 22.2 9.84 23.52 -5.72205e-06H37.56Z",
  "M16.32 30.36H0.959988C0.959988 11.16 12.72 5.72205e-06 30.36 5.72205e-06C47.52 5.72205e-06 58.44 10.08 58.44 25.92C58.44 39.24 51.36 47.52 41.28 54.84L35.64 58.92C29.04 63.72 22.08 68.16 20.64 72.24H59.76V85.56H-1.21891e-05C1.19999 67.08 13.56 57.6 27.6 47.16L29.88 45.36C37.8 39.36 42.6 34.44 42.6 26.28C42.6 18.36 37.56 13.68 29.88 13.68C20.16 13.68 16.32 21.36 16.32 30.36Z",
  "M14.88 57.36C15.48 67.92 21 74.4 31.2 74.4C41.76 74.4 46.92 67.92 46.92 60.24C46.92 51.24 39.48 47.16 28.68 47.16H25.2V35.28H27.96C37.8 35.28 44.28 31.32 44.28 23.16C44.28 17.76 40.56 12.36 31.2 12.36C21.12 12.36 16.92 19.92 16.92 26.64H2.28001C3.00001 10.8 14.04 5.72205e-06 31.92 5.72205e-06C49.2 5.72205e-06 59.64 8.76001 59.64 21.36C59.64 31.92 54.24 36.72 48.48 39.72V39.84C55.92 42.36 62.76 49.08 62.76 60.48C62.76 76.92 49.68 87.12 31.32 87.12C11.76 87.12 0.480014 75.96 1.36495e-05 57.36H14.88Z",
  "M38.64 84V65.88H-4.85778e-06V49.8L37.32 -5.72205e-06H53.64V53.16H65.76V65.88H53.64V84H38.64ZM38.64 53.16V32.88C38.64 26.04 38.76 21.6 38.88 17.76H38.64C36.72 21.12 34.08 25.08 30.12 30.48L20.52 43.44L12.84 53.28V53.4L23.28 53.16H38.64Z",
  "M-6.73532e-06 59.88H14.88C16.44 67.44 22.44 72.48 30.24 72.48C39.24 72.48 45.72 65.52 45.72 55.44C45.72 46.08 39.48 39.12 30.36 39.12C24.84 39.12 20.64 41.52 17.76 45.36H2.15999L9.35999 9.53674e-06H57.12V12.96H20.88L17.64 32.04L17.88 32.28C20.76 29.64 26.16 27 33.84 27C50.16 27 60.48 39.12 60.48 54.96C60.48 71.88 48.72 85.44 30 85.44C12.24 85.44 0.719993 74.16 -6.73532e-06 59.88Z",
  "M60.6 21.36L45.72 21.72C44.52 18.36 40.68 13.2 32.52 13.2C22.08 13.2 15.48 22.92 15.12 36.96L15.24 37.08C17.04 34.2 23.88 28.2 34.56 28.2C51.84 28.2 62.28 41.28 62.28 56.28C62.28 73.08 50.52 87 31.56 87C21.24 87 13.44 82.92 8.04 75.96C2.28 68.52 0 57.72 0 45.6C0 19.32 9.48 9.53674e-07 32.16 9.53674e-07C48.96 9.53674e-07 58.68 9.72 60.6 21.36ZM15.96 57.6C15.96 67.56 22.8 74.16 31.68 74.16C40.68 74.16 47.52 67.56 47.52 57.6C47.52 47.64 40.68 40.92 31.68 40.92C22.8 40.92 15.96 47.64 15.96 57.6Z",
  "M58.2 -5.72205e-06V14.76C41.16 30 28.8 60.48 28.8 84H12C13.32 59.16 25.2 31.44 42.24 13.8L42.12 13.56H1.37091e-06V-5.72205e-06H58.2Z",
  "M32.4 87.24C14.64 87.24 -3.48687e-06 78.24 -3.48687e-06 61.32C-3.48687e-06 49.92 6.24 42.72 14.88 39.84V39.6C7.92 37.08 3.24 31.2 3.24 21.72C3.24 7.80001 16.68 5.72205e-06 32.4 5.72205e-06C48.36 5.72205e-06 61.56 7.92001 61.56 21.72C61.56 31.2 56.64 37.08 49.8 39.6V39.84C58.56 42.72 64.8 49.8 64.8 61.32C64.8 78.24 50.04 87.24 32.4 87.24ZM32.4 12.48C23.28 12.48 18 17.04 18 24C18 31.32 24.48 35.52 32.4 35.52C40.32 35.52 46.8 31.32 46.8 24C46.8 17.04 41.52 12.48 32.4 12.48ZM32.4 46.56C22.56 46.56 15.36 51.72 15.36 60.36C15.36 69 21.96 74.4 32.4 74.4C42.96 74.4 49.44 69 49.44 60.36C49.44 51.72 42.24 46.56 32.4 46.56Z",
  "M1.68001 65.76L16.56 65.4C17.76 68.76 21.6 74.04 29.76 74.04C40.2 74.04 46.8 64.08 47.16 50.04L47.04 49.92C45.24 52.8 38.4 58.8 27.72 58.8C10.44 58.8 7.09295e-06 45.72 7.09295e-06 30.72C7.09295e-06 13.92 11.76 2.38419e-06 30.72 2.38419e-06C41.04 2.38419e-06 48.84 4.08001 54.24 11.04C60 18.48 62.28 29.28 62.28 41.4C62.28 67.68 52.8 87.24 30.12 87.24C13.32 87.24 3.60001 77.4 1.68001 65.76ZM46.32 29.4C46.32 19.44 39.48 12.84 30.6 12.84C21.6 12.84 14.76 19.44 14.76 29.4C14.76 39.36 21.6 46.08 30.6 46.08C39.48 46.08 46.32 39.36 46.32 29.4Z",
];

const tickSegments = Array.from({ length: TICK_SEGMENTS }, (_, index) => {
  const angle = (index / TICK_SEGMENTS) * Math.PI * 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    sweepOrder: (index - TICK_MIDPOINT + TICK_SEGMENTS) % TICK_SEGMENTS,
    outerX: 50 + TICK_OUTER_RADIUS * sin,
    outerY: 50 - TICK_OUTER_RADIUS * cos,
    innerX: 50 + TICK_INNER_RADIUS * sin,
    innerY: 50 - TICK_INNER_RADIUS * cos,
  };
});

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function getViewportHeight(): number {
  return window.visualViewport?.height ?? window.innerHeight;
}

function getScrollY(): number {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

function getTickPath(drawT: number): string {
  const drawEnd = drawT * (TICK_SEGMENTS - 1 + TICK_DRAW_WIDTH);
  const lines: string[] = [];

  for (const tick of tickSegments) {
    if (tick.sweepOrder >= drawEnd) continue;

    const segmentT = Math.min((drawEnd - tick.sweepOrder) / TICK_DRAW_WIDTH, 1);
    const x = tick.outerX + (tick.innerX - tick.outerX) * segmentT;
    const y = tick.outerY + (tick.innerY - tick.outerY) * segmentT;
    lines.push(`M${tick.outerX} ${tick.outerY}L${x} ${y}`);
  }

  return lines.join("");
}

function padNumber(value: number): string {
  return value.toString().padStart(2, "0");
}

export default function CountdownSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);
  const handWrapRef = useRef<HTMLDivElement>(null);
  const handDialRef = useRef<SVGSVGElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const tickPathRef = useRef<SVGPathElement>(null);
  const digitsRef = useRef<HTMLDivElement>(null);
  const tensPathRef = useRef<SVGPathElement>(null);
  const onesPathRef = useRef<SVGPathElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);
  const digitsReadyRef = useRef(false);
  const clockActiveRef = useRef(false);
  const [seconds, setSeconds] = useState(COUNTDOWN_FROM);

  const setDigitFill = useCallback(() => {
    for (const path of [tensPathRef.current, onesPathRef.current]) {
      if (!path) continue;
      path.setAttribute("stroke-dashoffset", "0");
      path.setAttribute("stroke-width", "0.34");
      path.setAttribute("fill", "var(--color-black)");
      path.setAttribute("stroke", "none");
    }
  }, []);

  const handleScroll = useCallback(() => {
    const stage = stageRef.current;
    const sticky = stickyRef.current;
    const clock = clockRef.current;
    const handWrap = handWrapRef.current;
    const ring = ringRef.current;
    const tickPath = tickPathRef.current;
    const manifesto = manifestoRef.current;

    if (!stage || !sticky || !clock || !ring || !tickPath || !manifesto) return;

    const viewportH = getViewportHeight();
    const scrollY = getScrollY();
    const stageTop = stage.getBoundingClientRect().top + scrollY;
    const stageHeight = stage.offsetHeight;
    const stageBottom = stageTop + stageHeight;
    const stickyEnd = stageBottom - viewportH;
    const progress = clamp01((scrollY - stageTop) / Math.max(stickyEnd - stageTop, 1));

    const clockH = clock.offsetHeight;
    const startScale = Math.max(2, (viewportH * CLOCK_START_SCALE_VH) / clockH);
    const centerOffset = (viewportH - clockH) / (2 * viewportH);
    const y = viewportH * (CLOCK_START_Y - (CLOCK_START_Y - centerOffset) * progress);
    const scale = startScale - (startScale - 1) * progress;
    const drawT = 0.25 + 0.75 * progress;
    const scaledClockH = clockH * scale;
    const visible = y > -scaledClockH && y < viewportH + scaledClockH;
    const stickyActive = scrollY >= stageTop && scrollY <= stickyEnd;

    const clockTransform = `translate(-50%, ${y}px) scale(${scale})`;
    clock.style.transform = clockTransform;
    clock.style.visibility = visible ? "visible" : "hidden";

    if (handWrap) {
      handWrap.style.transform = clockTransform;
      handWrap.style.visibility = visible ? "visible" : "hidden";
    }

    sticky.dataset.stickyActive = stickyActive ? "1" : "0";
    ring.setAttribute("stroke-dashoffset", String(1 - drawT));
    tickPath.setAttribute("d", getTickPath(drawT));

    setDigitFill();

    manifesto.style.setProperty("--manifesto-y", `${y + scaledClockH * 0.78}px`);
    manifesto.style.setProperty("--manifesto-vis", visible ? "visible" : "hidden");

    clockActiveRef.current = visible;
  }, [setDigitFill]);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    window.visualViewport?.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.visualViewport?.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    const tickSound = new Audio("/sfx/clock-tick.mp3");
    const tockSound = new Audio("/sfx/clock-tock.mp3");
    tickSound.preload = "auto";
    tockSound.preload = "auto";

    const interval = window.setInterval(() => {
      setSeconds((prev) => {
        const next = prev <= 0 ? COUNTDOWN_FROM : prev - 1;

        // Play tick/tock based on clock visibility
        const clockEl = clockRef.current;
        if (clockEl) {
          const rect = clockEl.getBoundingClientRect();
          const vh = window.innerHeight;
          const centerY = rect.top + rect.height / 2;
          const dist = Math.min(Math.abs(centerY - vh * 0.5) / (vh * 0.75), 1);
          const vol = 0.68 + (0.08 - 0.68) * dist * dist;
          const sample = next % 2 === 0 ? tickSound : tockSound;
          sample.volume = Math.max(0, vol);
          sample.currentTime = 0;
          sample.play().catch(() => {});
        }

        return next;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const value = padNumber(seconds);
    const tens = Number(value[0]);
    const ones = Number(value[1]);

    if (digitsRef.current) {
      digitsRef.current.dataset.text = value;
    }

    tensPathRef.current?.setAttribute("d", DIGITS[tens]);
    onesPathRef.current?.setAttribute("d", DIGITS[ones]);
    if (handDialRef.current) {
      const elapsed = COUNTDOWN_FROM - seconds;
      handDialRef.current.style.transform = `rotate(${(elapsed / COUNTDOWN_FROM) * 360}deg)`;
    }
  }, [seconds]);

  return (
    <section className={styles.section}>
      <div className={styles.stage} ref={stageRef}>
        <div className={styles.sticky} ref={stickyRef}>
          <div className={styles.clockWrap} ref={clockRef}>
            <FloatingObjects />
            <div className={styles.clock} aria-hidden="true" data-layout="shape" data-id="cd-ring" data-depth="-200" data-shape-type="circle" data-outline="true" data-color="FF591D">
              <svg className={styles.clockRing} viewBox="0 0 100 100">
                <circle
                  ref={ringRef}
                  cx="50"
                  cy="50"
                  r="49"
                  fill="none"
                  stroke="#FF591D"
                  strokeWidth="0.12"
                  pathLength="1"
                  strokeDasharray="1.001"
                  strokeDashoffset="1"
                  strokeLinecap="round"
                  transform="rotate(90 50 50)"
                />
                <path
                  ref={tickPathRef}
                  style={{ stroke: "var(--clock-tick)" }}
                  strokeWidth="0.15"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>

              <div className={styles.digits} ref={digitsRef} data-layout="text" data-id="countdown-number" data-depth="-200" data-text="26">
                <div className={styles.digitSlot}>
                  <svg viewBox="0 0 66 88" overflow="visible">
                    <path
                      ref={tensPathRef}
                      d={DIGITS[2]}
                      fill="none"
                      stroke="var(--clock-tick)"
                      strokeWidth="0.34"
                      pathLength="1"
                      strokeDasharray="1.001"
                      strokeDashoffset="1"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className={styles.digitSlot}>
                  <svg viewBox="0 0 66 88" overflow="visible">
                    <path
                      ref={onesPathRef}
                      d={DIGITS[6]}
                      fill="none"
                      stroke="var(--clock-tick)"
                      strokeWidth="0.34"
                      pathLength="1"
                      strokeDasharray="1.001"
                      strokeDashoffset="1"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.handWrap} ref={handWrapRef}>
            <div className={styles.handLayer} aria-hidden="true">
              <svg
                ref={handDialRef}
                className={styles.handDial}
                viewBox="0 0 100 100"
                overflow="visible"
              >
                <image
                  href="/clock/clock-hand-dial.webp"
                  x={50 - (116 / 793) * 75}
                  y={50 - (661 / 793) * 75}
                  width={(652 / 793) * 75}
                  height="75"
                  data-layout="image"
                  data-id="cd-hand"
                  data-depth="-150"
                />
              </svg>
            </div>
          </div>

          <div id="philosophy" className={styles.manifesto} ref={manifestoRef}>
            <div className={styles.manifestoColumns}>
              <div className={styles.manifestoLeft}>
                <h2 className={styles.manifestoHeadline} data-layout="text" data-id="manifesto-headline" data-depth="-300">
                  Make commerce better for everyone.
                </h2>
              </div>
              <div className={styles.manifestoRight}>
                <p className={styles.manifestoBody}>
                  Every 26 seconds, a merchant makes their first sale on Shopify.
                  That kind of scale changes the job and how we approach design.
                </p>
                <div className={styles.ctaGroup}>
                  <a href="#philosophy" className={styles.ctaLabel} data-layout="shape" data-id="manifesto-btn" data-depth="-300" data-shape-type="pill">
                    <img
                      src="/icons/design-mark-white.svg"
                      alt=""
                      width={18}
                      height={18}
                      className={styles.ctaIcon}
                    />
                    Our design philosophy
                  </a>
                  <a
                    href="#philosophy"
                    className={styles.ctaArrow}
                    aria-label="Our design philosophy"
                  >
                    <img src="/icons/arrow-forward-white.svg" alt="" width={20} height={20} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
