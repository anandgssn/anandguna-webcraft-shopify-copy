"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { gsap } from "gsap";
import styles from "./FloatingObjects.module.css";

const ALL_MODEL_PATHS = [
  "/models/model4.glb", "/models/model5.glb", "/models/model7.glb",
  "/models/model8.glb", "/models/model10.glb", "/models/model11.glb",
  "/models/model12.glb", "/models/model13.glb", "/models/model14.glb",
  "/models/model15.glb", "/models/model16.glb", "/models/model17.glb",
  "/models/model18.glb", "/models/model19.glb", "/models/model20.glb",
];

const MODEL_ROTATIONS: Record<string, [number, number, number]> = {
  "/models/model4.glb": [-1.309, 3.142, 0.436],
  "/models/model5.glb": [-1.745, -0.262, -0.611],
  "/models/model7.glb": [-1.833, -2.531, -0.611],
  "/models/model8.glb": [-1.745, -0.262, -0.436],
  "/models/model10.glb": [-0.611, 2.007, 0.436],
  "/models/model11.glb": [-1.833, 0.524, -0.175],
  "/models/model12.glb": [-1.658, 0.349, 0.524],
  "/models/model13.glb": [-1.92, -0.873, -0.873],
  "/models/model14.glb": [-2.182, -0.785, -0.436],
  "/models/model15.glb": [-1.309, -0.087, 0],
  "/models/model16.glb": [-0.785, -0.611, 0],
  "/models/model17.glb": [-1.43, 2.436, 0.43],
  "/models/model18.glb": [-1.453, 0.234, -0.252],
  "/models/model19.glb": [-1.398, 0.523, 0.429],
  "/models/model20.glb": [-1.94, 0.24, -0.221],
};

const SLOT_COUNT = 8;

const CFG = {
  orbitRadiusFactor: 0.72,
  spreadScale: 1.65,
  verticalOffsetFactor: 0.35,
  orbitSpeed: 0.04,
  bobAmplitude: 0.03,
  bobSpeed: 0.7,
  modelScaleFactor: 0.13,
  wobbleFactor: 0.45,
  introDuration: 0.3,
  outroDuration: 0.3,
  jitterXZ: 0.07,
  jitterY: 0.26,
  minLifetime: 4000,
  maxLifetime: 10000,
};

export default function FloatingObjects() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
    camera.position.set(0, 0, 80);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    const modelCache = new Map<string, THREE.Group>();
    let mouseX = 0;
    let mouseY = 0;
    let mounted = true;

    interface Slot {
      container: THREE.Group;
      path: string;
      visible: boolean;
      scale: number;
      angle: number;
      jitter: [number, number, number];
      timer: ReturnType<typeof setTimeout> | null;
    }

    const slots: Slot[] = [];
    const root = new THREE.Group();
    scene.add(root);

    for (let i = 0; i < SLOT_COUNT; i++) {
      const c = new THREE.Group();
      c.visible = false;
      root.add(c);
      slots.push({
        container: c,
        path: "",
        visible: false,
        scale: 0,
        angle: (i / SLOT_COUNT) * Math.PI * 2,
        jitter: [0, 0, 0],
        timer: null,
      });
    }

    function normalizeModel(gltfScene: THREE.Group): THREE.Group {
      const clone = gltfScene.clone(true);
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const old = mesh.material as THREE.MeshStandardMaterial;
          mesh.material = new THREE.MeshBasicMaterial({
            map: old.map ?? null,
            transparent: old.transparent,
            opacity: old.opacity,
            side: old.side,
            fog: false,
            toneMapped: false,
            color: (old.color ?? new THREE.Color(0xffffff)).clone(),
          });
          mesh.frustumCulled = false;
        }
      });
      const box = new THREE.Box3().setFromObject(clone);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) clone.scale.multiplyScalar(1 / maxDim);
      const center = box.getCenter(new THREE.Vector3()).multiplyScalar(maxDim > 0 ? 1 / maxDim : 1);
      clone.position.sub(center);
      return clone;
    }

    async function loadModel(path: string): Promise<THREE.Group> {
      if (modelCache.has(path)) return normalizeModel(modelCache.get(path)!);
      return new Promise((resolve, reject) => {
        gltfLoader.load(path, (gltf) => {
          modelCache.set(path, gltf.scene);
          resolve(normalizeModel(gltf.scene));
        }, undefined, reject);
      });
    }

    function pickRandomPath(exclude: string[]): string {
      const available = ALL_MODEL_PATHS.filter((p) => !exclude.includes(p));
      if (available.length === 0) return ALL_MODEL_PATHS[Math.floor(Math.random() * ALL_MODEL_PATHS.length)];
      return available[Math.floor(Math.random() * available.length)];
    }

    async function spawnInSlot(slot: Slot) {
      if (!mounted) return;
      const activePaths = slots.filter((s) => s.visible).map((s) => s.path);
      const path = pickRandomPath(activePaths);
      slot.path = path;
      slot.jitter = [
        (Math.random() * 2 - 1) * CFG.jitterXZ,
        (Math.random() * 2 - 1) * CFG.jitterXZ,
        (Math.random() * 2 - 1) * CFG.jitterY,
      ];

      const c = slot.container;
      while (c.children.length > 0) c.remove(c.children[0]);

      try {
        const model = await loadModel(path);
        if (!mounted) return;
        c.add(model);
        c.visible = true;
        slot.visible = true;
        slot.scale = 0;
        gsap.to(slot, { scale: 1, duration: CFG.introDuration, ease: "back.out(1.8)" });

        const lifetime = CFG.minLifetime + Math.random() * (CFG.maxLifetime - CFG.minLifetime);
        slot.timer = setTimeout(() => despawnSlot(slot), lifetime);
      } catch (e) {
        console.warn(`Failed to load ${path}`, e);
      }
    }

    function despawnSlot(slot: Slot) {
      if (!mounted) return;
      gsap.to(slot, {
        scale: 0,
        duration: CFG.outroDuration,
        ease: "back.in(1.8)",
        onComplete: () => {
          slot.visible = false;
          slot.container.visible = false;
          const delay = 500 + Math.random() * 2000;
          slot.timer = setTimeout(() => spawnInSlot(slot), delay);
        },
      });
    }

    // Stagger initial spawns
    slots.forEach((slot, i) => {
      slot.timer = setTimeout(() => spawnInSlot(slot), i * 400 + Math.random() * 800);
    });
    root.visible = true;

    function resize() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    const ringRadius = 40;
    const startTime = performance.now();

    function animate() {
      if (!mounted) return;
      const elapsed = (performance.now() - startTime) * 0.001;
      const activeCount = Math.max(slots.filter((s) => s.visible).length, 1);
      const orbitR = ringRadius * CFG.orbitRadiusFactor * CFG.spreadScale;
      const vOffset = ringRadius * CFG.verticalOffsetFactor;
      const modelScaleBase = ringRadius * CFG.modelScaleFactor;

      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        const model = slot.container;
        if (!slot.visible || model.children.length === 0) {
          model.visible = false;
          continue;
        }
        model.visible = true;
        const baseRot = MODEL_ROTATIONS[slot.path] ?? [0, 0, 0];
        const angle = slot.angle + elapsed * CFG.orbitSpeed;

        model.position.set(
          Math.cos(angle) * orbitR + slot.jitter[0] * ringRadius,
          Math.sin(elapsed * CFG.bobSpeed + i * 1.7) * CFG.bobAmplitude * ringRadius + vOffset + slot.jitter[1] * ringRadius,
          Math.sin(angle) * orbitR + slot.jitter[2] * ringRadius,
        );
        model.scale.setScalar(Math.max(modelScaleBase * slot.scale, 0.001));
        model.rotation.set(
          baseRot[0] + Math.sin(elapsed * 0.15 + i) * 0.3 - mouseY * CFG.wobbleFactor,
          baseRot[1] + Math.sin(elapsed * 0.2 + i * 2) * 0.4 + mouseX * CFG.wobbleFactor,
          baseRot[2] + Math.sin(elapsed * 0.1 + i * 0.5) * 0.15,
        );
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    const onMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    resize();
    requestAnimationFrame(animate);

    return () => {
      mounted = false;
      for (const slot of slots) {
        if (slot.timer) clearTimeout(slot.timer);
      }
      window.removeEventListener("mousemove", onMouse);
      ro.disconnect();
      dracoLoader.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
