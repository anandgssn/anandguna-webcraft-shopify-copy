"use client";

import { useEffect, useRef, useState } from "react";

const TILE_COLS = 20;
const SEED = 322;

function hash(x: number, y: number, seed: number): number {
  return ((Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453) % 1 + 1) % 1;
}

function getTileSize(col: number, row: number, seed: number): number {
  for (let s = 3; s >= 2; s--) {
    const cx = Math.floor(col / s) * s;
    const cy = Math.floor(row / s) * s;
    const h = hash(cx, cy, seed + 7.31);
    if (s === 3 && h >= 0.85) return s;
    if (s === 2 && h >= 0.55) return s;
  }
  return 1;
}

interface TileData {
  col: number;
  row: number;
  size: number;
  dist: number;
  hue: number;
  prismaticAngle: number;
}

export default function IntroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"words" | "explosion" | "done">("words");
  const animRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setPhase("explosion"), 1300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== "explosion") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const aspect = w / h;
    const rows = Math.ceil(TILE_COLS / aspect);
    const tileW = w / TILE_COLS;
    const tileH = h / rows;
    const maxDist = Math.sqrt(0.25 * aspect * aspect + 0.25);

    const tiles: TileData[] = [];
    const visited = new Set<string>();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < TILE_COLS; c++) {
        const key = `${c},${r}`;
        if (visited.has(key)) continue;
        const size = getTileSize(c, r, SEED);
        for (let dy = 0; dy < size; dy++) {
          for (let dx = 0; dx < size; dx++) {
            visited.add(`${c + dx},${r + dy}`);
          }
        }
        const tcx = (c + size * 0.5) / TILE_COLS;
        const tcy = (r + size * 0.5) / rows;
        const ddx = (tcx - 0.5) * aspect;
        const ddy = tcy - 0.5;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy) / maxDist;
        const hue = (Math.atan2(ddy, ddx) * 180 / Math.PI + 360) % 360;
        const prismaticAngle = Math.atan2(ddy, ddx);
        tiles.push({ col: c, row: r, size, dist, hue, prismaticAngle });
      }
    }

    const dotSpacing = 24;
    const dotSize = 1.2;
    const RAY_COUNT = 36;
    const rayAngles = Array.from({ length: RAY_COUNT }, (_, i) => (i / RAY_COUNT) * Math.PI * 2);
    const rayLengths = rayAngles.map((_, i) => 0.6 + hash(i, 0, SEED + 50) * 0.4);

    let start = 0;
    const TOTAL_MS = 2000;

    function animate(timestamp: number) {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const t = Math.min(elapsed / TOTAL_MS, 1);

      ctx.clearRect(0, 0, w, h);

      // --- Easing curves ---
      const easeOutCubic = 1 - Math.pow(1 - t, 3);
      const easeOutQuart = 1 - Math.pow(1 - t, 4);

      // Single monotonic clear curve: tiles clear from center outward
      const clearT = easeOutCubic;

      // --- 1. Black background ---
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      // --- 2. Dot grid (subtle, fades out) ---
      const dotAlpha = Math.max(0, 0.12 * (1 - clearT * 1.5));
      if (dotAlpha > 0.001) {
        ctx.fillStyle = `rgba(255, 255, 255, ${dotAlpha})`;
        for (let x = 0; x < w; x += dotSpacing) {
          for (let y = 0; y < h; y += dotSpacing) {
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // --- 3. Prismatic light streaks in dark tiles ---
      // These create the colorful glitch effect visible in frames 160-175
      if (t > 0.15) {
        const streakAlpha = t < 0.5
          ? Math.min((t - 0.15) / 0.2, 1) * 0.7
          : Math.max(0, 1 - (t - 0.5) / 0.4) * 0.7;

        if (streakAlpha > 0.01) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";

          // Radial light streaks from center
          const streakCount = 16;
          for (let i = 0; i < streakCount; i++) {
            const angle = (i / streakCount) * Math.PI * 2 + t * 0.5;
            const len = Math.max(w, h) * (0.3 + easeOutQuart * 0.7);
            const spread = 0.015 + 0.01 * Math.sin(i * 2.1);

            const hueShift = (i / streakCount) * 360;
            const colors = [
              `hsla(${(190 + hueShift) % 360}, 100%, 70%, ${streakAlpha * 0.6})`,
              `hsla(${(40 + hueShift) % 360}, 100%, 60%, ${streakAlpha * 0.4})`,
            ];

            for (const color of colors) {
              ctx.beginPath();
              ctx.moveTo(w / 2, h / 2);
              ctx.lineTo(
                w / 2 + Math.cos(angle - spread) * len,
                h / 2 + Math.sin(angle - spread) * len
              );
              ctx.lineTo(
                w / 2 + Math.cos(angle + spread) * len,
                h / 2 + Math.sin(angle + spread) * len
              );
              ctx.closePath();
              ctx.fillStyle = color;
              ctx.fill();
            }
          }
          ctx.restore();
        }
      }

      // --- 4. Clear tiles (transparent, showing page beneath) ---
      // Tiles clear radially from center outward, never go back to black
      for (const tile of tiles) {
        const threshold = tile.dist * 0.6 + hash(tile.col, tile.row, SEED) * 0.4;
        if (threshold <= clearT) {
          ctx.clearRect(
            tile.col * tileW,
            tile.row * tileH,
            tile.size * tileW,
            tile.size * tileH
          );
        }
      }

      // --- 5. Prismatic tile edges (glitch borders on remaining dark tiles) ---
      if (t > 0.2 && t < 0.85) {
        const edgeAlpha = Math.sin(Math.min((t - 0.2) / 0.3, 1) * Math.PI) * 0.5;
        if (edgeAlpha > 0.01) {
          for (const tile of tiles) {
            const threshold = tile.dist * 0.6 + hash(tile.col, tile.row, SEED) * 0.4;
            if (threshold <= clearT) continue;

            const tx = tile.col * tileW;
            const ty = tile.row * tileH;
            const tw = tile.size * tileW;
            const th = tile.size * tileH;

            // Cyan edge
            ctx.strokeStyle = `rgba(0, 220, 255, ${edgeAlpha})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(tx - 2, ty - 1, tw + 4, th + 2);

            // Red/magenta opposite edge
            ctx.strokeStyle = `rgba(255, 30, 80, ${edgeAlpha * 0.7})`;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(tx + 2, ty + 1, tw - 4, th - 2);

            // Gold accent on larger tiles
            if (tile.size >= 2) {
              ctx.strokeStyle = `rgba(255, 200, 0, ${edgeAlpha * 0.5})`;
              ctx.lineWidth = 1;
              ctx.strokeRect(tx + 1, ty, tw - 2, th);
            }
          }
        }
      }

      // --- 6. Starburst from center ---
      if (t < 0.65) {
        const burstT = t / 0.65;
        const burstEase = 1 - Math.pow(1 - burstT, 3);
        const burstRadius = burstEase * Math.max(w, h) * 0.9;
        const burstAlpha = Math.max(0, 1 - burstT * 1.1);

        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        // Central white flash (very bright at start)
        const flashAlpha = Math.max(0, 1 - burstT * 2) * 0.95;
        if (flashAlpha > 0.01) {
          const flashGrad = ctx.createRadialGradient(
            w / 2, h / 2, 0,
            w / 2, h / 2, burstRadius * 0.4
          );
          flashGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
          flashGrad.addColorStop(0.4, `rgba(255, 255, 255, ${flashAlpha * 0.8})`);
          flashGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = flashGrad;
          ctx.fillRect(0, 0, w, h);
        }

        // Main radial gradient burst
        const gradient = ctx.createRadialGradient(
          w / 2, h / 2, 0,
          w / 2, h / 2, burstRadius
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${burstAlpha * 0.9})`);
        gradient.addColorStop(0.15, `rgba(255, 255, 255, ${burstAlpha * 0.7})`);
        gradient.addColorStop(0.35, `rgba(220, 240, 255, ${burstAlpha * 0.5})`);
        gradient.addColorStop(0.6, `rgba(180, 220, 255, ${burstAlpha * 0.25})`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Sharp radial rays
        if (burstAlpha > 0.05) {
          ctx.lineWidth = 1.5;
          for (let i = 0; i < RAY_COUNT; i++) {
            const angle = rayAngles[i];
            const rayLen = burstRadius * rayLengths[i];
            const rayAlpha = burstAlpha * (0.3 + hash(i, 1, SEED + 30) * 0.3);

            ctx.strokeStyle = `rgba(255, 255, 255, ${rayAlpha})`;
            ctx.beginPath();
            ctx.moveTo(w / 2, h / 2);
            ctx.lineTo(
              w / 2 + Math.cos(angle) * rayLen,
              h / 2 + Math.sin(angle) * rayLen
            );
            ctx.stroke();

            // Thicker secondary ray slightly offset
            if (i % 3 === 0) {
              ctx.lineWidth = 3;
              ctx.strokeStyle = `rgba(255, 255, 255, ${rayAlpha * 0.5})`;
              ctx.beginPath();
              ctx.moveTo(w / 2, h / 2);
              ctx.lineTo(
                w / 2 + Math.cos(angle + 0.02) * rayLen * 0.8,
                h / 2 + Math.sin(angle + 0.02) * rayLen * 0.8
              );
              ctx.stroke();
              ctx.lineWidth = 1.5;
            }
          }
        }

        ctx.restore();
      }

      // --- 7. Chromatic aberration on cleared tile edges ---
      if (t > 0.25 && t < 0.75) {
        const chromT = Math.sin((t - 0.25) / 0.5 * Math.PI);
        const chromStrength = chromT * 3;
        if (chromStrength > 0.3) {
          for (const tile of tiles) {
            const threshold = tile.dist * 0.6 + hash(tile.col, tile.row, SEED) * 0.4;
            if (threshold <= clearT) continue;

            const tx = tile.col * tileW;
            const ty = tile.row * tileH;
            const tw = tile.size * tileW;
            const th = tile.size * tileH;

            // RGB split on boundary
            const dx = (tile.col + tile.size * 0.5) / TILE_COLS - 0.5;
            const dy = (tile.row + tile.size * 0.5) / rows - 0.5;
            const offX = dx * chromStrength;
            const offY = dy * chromStrength;

            ctx.strokeStyle = `rgba(255, 0, 0, ${chromT * 0.12})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(tx - offX, ty - offY, tw, th);

            ctx.strokeStyle = `rgba(0, 255, 0, ${chromT * 0.08})`;
            ctx.strokeRect(tx, ty, tw, th);

            ctx.strokeStyle = `rgba(0, 100, 255, ${chromT * 0.12})`;
            ctx.strokeRect(tx + offX, ty + offY, tw, th);
          }
        }
      }

      // --- 8. Late-stage prismatic glow on remaining tiles ---
      // Frames 165-175: remaining tiles glow with prismatic colors
      if (t > 0.5 && t < 0.95) {
        const glowT = Math.min((t - 0.5) / 0.15, 1) * Math.max(0, 1 - (t - 0.7) / 0.25);
        if (glowT > 0.01) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          for (const tile of tiles) {
            const threshold = tile.dist * 0.6 + hash(tile.col, tile.row, SEED) * 0.4;
            if (threshold <= clearT) continue;

            const tx = tile.col * tileW;
            const ty = tile.row * tileH;
            const tw = tile.size * tileW;
            const th = tile.size * tileH;
            const cx = tx + tw / 2;
            const cy = ty + th / 2;

            // Each remaining tile gets a prismatic colored glow
            const tileHue = tile.hue + t * 120;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(tw, th));
            grad.addColorStop(0, `hsla(${tileHue}, 100%, 60%, ${glowT * 0.6})`);
            grad.addColorStop(0.5, `hsla(${tileHue + 60}, 100%, 50%, ${glowT * 0.3})`);
            grad.addColorStop(1, `hsla(${tileHue + 120}, 100%, 40%, 0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(tx, ty, tw, th);
          }
          ctx.restore();
        }
      }

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPhase("done");
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  if (phase === "done" || phase === "words") return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
      }}
    />
  );
}
