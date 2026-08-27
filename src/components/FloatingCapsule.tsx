"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "./FloatingCapsule.module.css";

const COLOR_PAIRS = [
  { bg: 0x4e4e4e, fg: 0xcccccc },
  { bg: 0xdfd5cb, fg: 0x1c3b36 },
  { bg: 0xfe432a, fg: 0xffaac7 },
  { bg: 0x4f2730, fg: 0xfe432a },
  { bg: 0x0225ac, fg: 0xffaac7 },
  { bg: 0xbfff04, fg: 0x1c3b36 },
  { bg: 0xb8c4db, fg: 0x4f2730 },
  { bg: 0x1c3b36, fg: 0x6bff91 },
  { bg: 0xdfd5cb, fg: 0xfe432a },
  { bg: 0x4f2730, fg: 0xffaac7 },
  { bg: 0x6b3a99, fg: 0xfe432a },
  { bg: 0x6b3a99, fg: 0xffaac7 },
  { bg: 0xffaac7, fg: 0xfe432a },
  { bg: 0xfe432a, fg: 0xb8c4db },
  { bg: 0x0225ac, fg: 0xfe432a },
  { bg: 0x6bff91, fg: 0x1c3b36 },
];

/* ── Shopify constants ─────────────────────────── */
const SCROLL_VEL_FACTOR = 0.004;   // nF
const BASE_SPIN_SPEED   = 0.15;    // rF
const TILT_X_BASE       = 0.18;    // oF  (multiplied by Math.PI)
const TILT_X_SWING      = 0.21;    // lF
const Y_SPIN_SPEED      = 0.15;    // aF
const BOTTOM_THRESHOLD  = 100;     // mF  (px from page bottom)
const BOTTOM_SCALE      = 4;       // pF — container growth factor
const COLOR_INTERVAL    = 4;       // hF  (seconds between color changes)
const COLOR_LERP_SPEED  = 0.04;    // s_

/* ── Small-state sizes ─────────────────────────── */
const SMALL_W = 56;
const SMALL_H = 80;

export default function FloatingCapsule({ onClick }: { onClick?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;

    /* ── Renderer ────────────────────────────────── */
    const dpr = Math.min(window.devicePixelRatio, 2);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(dpr);
    renderer.setSize(SMALL_W, SMALL_H);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    /* ── Scene + Camera ──────────────────────────── */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(12, SMALL_W / SMALL_H, 0.1, 100);
    camera.position.set(0, 0, 15.6);

    /* ── Procedural environment map ──────────────── */
    const pmrem    = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    const skyGeo   = new THREE.SphereGeometry(50, 32, 32);
    const skyCanvas = document.createElement("canvas");
    skyCanvas.width = 512; skyCanvas.height = 512;
    const sctx = skyCanvas.getContext("2d")!;
    const grad = sctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0,   "#99aadd");
    grad.addColorStop(0.5, "#dddde8");
    grad.addColorStop(1,   "#141420");
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 512, 512);
    const skyMat = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(skyCanvas), side: THREE.BackSide,
    });
    envScene.add(new THREE.Mesh(skyGeo, skyMat));
    const p1 = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    p1.position.set(18, 10, 15); p1.lookAt(0, 0, 0); envScene.add(p1);
    const p2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: 0x4c5980 }));
    p2.position.set(-20, 5, 10); p2.lookAt(0, 0, 0); envScene.add(p2);
    scene.environment = pmrem.fromScene(envScene, 0).texture;
    skyGeo.dispose(); skyMat.dispose(); pmrem.dispose();

    /* ── Lights ───────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const keyL = new THREE.DirectionalLight(0xffffff, 1.0); keyL.position.set(2, 3, 4); scene.add(keyL);
    const fillL = new THREE.DirectionalLight(0xffffff, 0.3); fillL.position.set(-2, 1, 2); scene.add(fillL);

    /* ── Capsule mesh ────────────────────────────── */
    const capsuleGeo = new THREE.CapsuleGeometry(0.54, 1.35, 32, 48);
    const colorBUniform = { value: new THREE.Color(COLOR_PAIRS[0].fg) };
    const currentA = new THREE.Color(COLOR_PAIRS[0].bg);
    const currentB = new THREE.Color(COLOR_PAIRS[0].fg);
    const targetA  = new THREE.Color(COLOR_PAIRS[0].bg);
    const targetB  = new THREE.Color(COLOR_PAIRS[0].fg);

    const mat = new THREE.MeshStandardMaterial({
      color: currentA, roughness: 0.35, metalness: 0.55,
      envMapIntensity: 1.5, side: THREE.FrontSide, fog: false,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.u_colorB = colorBUniform;
      shader.vertexShader = "varying float vLocalY;\n" +
        shader.vertexShader.replace("#include <begin_vertex>",
          "#include <begin_vertex>\nvLocalY = position.y;");
      shader.fragmentShader = "uniform vec3 u_colorB;\nvarying float vLocalY;\n" +
        shader.fragmentShader.replace("#include <color_fragment>",
          `#include <color_fragment>
           float splitMask = smoothstep(-0.04, 0.04, vLocalY);
           diffuseColor.rgb = mix(u_colorB, diffuseColor.rgb, splitMask);`);
    };

    const group = new THREE.Group();
    group.add(new THREE.Mesh(capsuleGeo, mat));

    /* ── Rings ────────────────────────────────────── */
    const ringGeo = new THREE.TorusGeometry(0.541, 0.0025, 8, 64);
    ringGeo.rotateX(Math.PI / 2);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(COLOR_PAIRS[0].bg).multiplyScalar(0.35),
      roughness: 0.4, metalness: 0.5,
      transparent: true, opacity: 0.35, depthWrite: false, fog: false,
    });
    const ring1 = new THREE.Mesh(ringGeo, ring1Mat);
    ring1.position.y = -0.004;
    group.add(ring1);

    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.2, metalness: 0.85,
      transparent: true, opacity: 0.3, depthWrite: false, fog: false,
    });
    const ring2 = new THREE.Mesh(ringGeo, ring2Mat);
    ring2.position.y = 0.004;
    group.add(ring2);

    scene.add(group);

    /* ── Animation state ─────────────────────────── */
    let mounted     = true;
    let rotAngle    = 0;
    let smoothVel   = 0;
    let lastScrollY = window.scrollY;
    let pairIdx     = 0;
    let colorTimer  = 0;
    let bottomT     = 0;
    let targetBottomT = 0;
    let lastW       = SMALL_W;
    let lastH       = SMALL_H;

    /* ── Resize helper: updates canvas + camera when container size changes ── */
    function resizeCanvas(w: number, h: number) {
      if (Math.abs(w - lastW) < 1 && Math.abs(h - lastH) < 1) return;
      lastW = w; lastH = h;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    /* ── Render loop ─────────────────────────────── */
    function animate() {
      if (!mounted || !wrap) return;
      const dt   = 0.016;
      const tSec = performance.now() * 0.001;

      /* Scroll velocity */
      const curScrollY  = window.scrollY;
      const scrollDelta = Math.abs(curScrollY - lastScrollY);
      lastScrollY = curScrollY;
      smoothVel += (scrollDelta - smoothVel) * 0.12;

      // Accumulate Y rotation — always forward, faster when scrolling
      rotAngle += (BASE_SPIN_SPEED + smoothVel * SCROLL_VEL_FACTOR) * dt;

      /* Rotation — Y axis only for vertical spin, slight tilt on X */
      const somersault = bottomT * Math.PI * 6;
      group.rotation.set(
        Math.PI * TILT_X_BASE + Math.sin(tSec * 0.4) * TILT_X_SWING + somersault,
        rotAngle,
        0,
      );

      /* Color cycling */
      colorTimer += dt;
      if (colorTimer > COLOR_INTERVAL) {
        colorTimer = 0;
        pairIdx = (pairIdx + 1) % COLOR_PAIRS.length;
        targetA.set(COLOR_PAIRS[pairIdx].bg);
        targetB.set(COLOR_PAIRS[pairIdx].fg);
      }
      currentA.lerp(targetA, COLOR_LERP_SPEED);
      currentB.lerp(targetB, COLOR_LERP_SPEED);
      mat.color.copy(currentA);
      colorBUniform.value.copy(currentB);

      /* ── Bottom-scroll animation ───────────────── */
      const docH       = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const distBottom  = docH - curScrollY - window.innerHeight;
      const newTarget   = distBottom < BOTTOM_THRESHOLD ? 1 : 0;

      if (newTarget !== targetBottomT) {
        targetBottomT = newTarget;
      }
      // Smooth spring toward target (approximates GSAP power3.out over 0.7s)
      bottomT += (targetBottomT - bottomT) * 0.06;
      if (Math.abs(bottomT - targetBottomT) < 0.001) bottomT = targetBottomT;

      /* Scale the 3D mesh — keep at 1x since container resize handles visual growth */
      group.scale.setScalar(1);

      /* Ring stretch + opacity */
      const ringStretch = 1 + 2 * bottomT;   // 1 → 3
      ring1.scale.set(1, ringStretch, 1);
      ring2.scale.set(1, ringStretch, 1);
      ring1Mat.opacity = 0.35 + 0.30 * bottomT;   // 0.35 → 0.65
      ring2Mat.opacity = 0.30 + 0.25 * bottomT;   // 0.30 → 0.55

      /* ── Container position + size ─────────────── */
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // At bottomT=0: small capsule in corner (56x80)
      // At bottomT=1: large square container so rotated capsule isn't clipped
      const bigSize = SMALL_H * BOTTOM_SCALE;   // square = tallest dimension * scale

      const curW = Math.round(SMALL_W + (bigSize - SMALL_W) * bottomT);
      const curH = Math.round(SMALL_H + (bigSize - SMALL_H) * bottomT);

      // Position: slight move left + up from original corner position
      const origRight  = 37;
      const origBottom = 25;
      const targetRight  = origRight + 165;
      const targetBottom = origBottom + 90;

      const curRight  = origRight  + (targetRight  - origRight)  * bottomT;
      const curBottom = origBottom + (targetBottom - origBottom) * bottomT;

      wrap.style.width  = `${curW}px`;
      wrap.style.height = `${curH}px`;
      wrap.style.right  = `${curRight}px`;
      wrap.style.bottom = `${curBottom}px`;
      // CRITICAL: Do NOT use CSS transform: scale(). It pixelates the canvas.
      // Instead we resize the actual canvas via renderer.setSize().
      wrap.style.transform = "none";

      /* Update canvas resolution to match new container size */
      resizeCanvas(curW, curH);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    return () => {
      mounted = false;
      renderer.dispose();
      capsuleGeo.dispose();
      ringGeo.dispose();
      mat.dispose();
      ring1Mat.dispose();
      ring2Mat.dispose();
    };
  }, []);

  return (
    <button
      ref={wrapRef}
      className={styles.capsule}
      aria-label="Toggle 3D view"
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <canvas ref={canvasRef} className={styles.canvas3d} />
    </button>
  );
}
