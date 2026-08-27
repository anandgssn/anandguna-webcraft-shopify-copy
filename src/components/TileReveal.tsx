"use client";

import { useEffect, useRef, useState } from "react";

const PARTICLE_COUNT = 120;
const DURATION = 2200;
const DELAY = 300;

export default function TileReveal() {
  const [visible, setVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;

    const particles = Array.from({ length: PARTICLE_COUNT }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 800;
      const size = 2 + Math.random() * 6;
      const colors = ["#ff5a1f", "#ff9c1a", "#ff2dbd", "#ffe93a", "#12c8ff", "#ffffff", "#7cff2f"];
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.6 + Math.random() * 0.4,
        trail: [] as { x: number; y: number }[],
      };
    });

    // Radial lines burst
    const lines = Array.from({ length: 40 }, () => {
      const angle = Math.random() * Math.PI * 2;
      return {
        angle,
        length: 100 + Math.random() * 400,
        speed: 400 + Math.random() * 600,
        width: 1 + Math.random() * 2,
        color: `rgba(255, 255, 255, ${0.3 + Math.random() * 0.4})`,
      };
    });

    let start = 0;

    function animate(timestamp: number) {
      if (!start) start = timestamp;
      const elapsed = timestamp - start - DELAY;
      if (elapsed < 0) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      const t = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      // Black background fading to transparent
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = `rgba(0, 0, 0, ${1 - eased})`;
      ctx.fillRect(0, 0, w, h);

      // Central flash
      if (t < 0.3) {
        const flashT = t / 0.3;
        const flashR = flashT * Math.max(w, h) * 0.4;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashR);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * (1 - flashT)})`);
        gradient.addColorStop(0.5, `rgba(255, 150, 50, ${0.4 * (1 - flashT)})`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }

      // Radial lines
      for (const line of lines) {
        const dist = eased * line.speed * (DURATION / 1000);
        const endDist = dist + line.length * (1 - eased * 0.5);
        const alpha = Math.max(0, 1 - eased * 1.5);
        if (alpha <= 0) continue;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(line.angle);
        ctx.beginPath();
        ctx.moveTo(dist, 0);
        ctx.lineTo(endDist, 0);
        ctx.strokeStyle = line.color.replace(/[\d.]+\)$/, `${alpha})`);
        ctx.lineWidth = line.width;
        ctx.stroke();
        ctx.restore();
      }

      // Particles
      for (const p of particles) {
        const dt = elapsed / 1000;
        const px = p.x + p.vx * dt * eased;
        const py = p.y + p.vy * dt * eased;
        const alpha = Math.max(0, p.life - eased);
        if (alpha <= 0) continue;

        ctx.beginPath();
        ctx.arc(px, py, p.size * (1 - eased * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setVisible(false);
      }
    }

    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current);
  }, []);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
      }}
    />
  );
}
