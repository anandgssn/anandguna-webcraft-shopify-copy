# Shopify Design Clock: Floating 3D Objects - Recreation Specification

## 1. Overview

The [shopify.design](https://shopify.design/) homepage features a countdown clock section where **15 textured 3D objects** orbit around a central clock face. These objects are high-fidelity 3D scans of real-world commerce-related products (sneakers, bags, decorative items, mechanical objects, etc.) rendered using **Three.js with WebGL**. They float in an elliptical orbit, gently bobbing and rotating, creating a visually rich, immersive experience.

This document provides everything needed to recreate this effect in a local build.

---

## 2. Architecture

The system consists of three layers:

| Layer | Technology | Responsibility |
|-------|-----------|---------------|
| **3D Scene** | Three.js (WebGL) | Renders the 3D models in a full-screen canvas behind the DOM |
| **Model Loading** | GLTFLoader + DRACOLoader | Loads `.glb` files with Draco mesh compression |
| **Animation** | Custom animation loop + GSAP | Orbiting, bobbing, scale intro/outro, rotation wobble |

The 3D canvas is rendered as a **background layer** behind the DOM content. DOM elements like the clock digits and text are rendered on top and synchronized with the 3D scene's camera position.

---

## 3. The 3D Models

### 3.1 Model Files

All 15 models are Draco-compressed GLB files hosted at `/models/`. They are loaded in **two batches of 8** that cycle on each countdown tick.

| Model | File | Vertices | Bounding Box (X, Y, Z) | File Size | Description |
|-------|------|----------|------------------------|-----------|-------------|
| model4 | `/models/model4.glb` | 147,988 | 1.126 x 0.423 x 0.530 | 1,001 KB | Teal/turquoise sneaker with knit fabric and leather |
| model5 | `/models/model5.glb` | 112,761 | 0.959 x 0.814 x 1.003 | 695 KB | Pastel ceramic/glass decorative object |
| model7 | `/models/model7.glb` | 258,214 | 0.747 x 0.801 x 0.766 | 1,516 KB | Mechanical/watch mechanism with gears |
| model8 | `/models/model8.glb` | 145,602 | 0.786 x 0.368 x 0.933 | 852 KB | Elongated fabric/leather object |
| model10 | `/models/model10.glb` | 86,492 | 0.754 x 0.669 x 0.745 | 532 KB | Golden/brass decorative object |
| model11 | `/models/model11.glb` | 120,853 | 0.628 x 0.561 x 0.722 | 748 KB | Detailed product object |
| model12 | `/models/model12.glb` | 74,860 | 0.593 x 0.654 x 0.660 | 489 KB | Small product object |
| model13 | `/models/model13.glb` | 39,911 | 0.632 x 0.623 x 0.581 | 427 KB | Orange embroidered textile/patch |
| model14 | `/models/model14.glb` | 94,365 | 0.748 x 0.677 x 0.660 | 719 KB | Product object |
| model15 | `/models/model15.glb` | 120,847 | 0.459 x 0.453 x 1.118 | 751 KB | Tall/elongated object |
| model16 | `/models/model16.glb` | 134,377 | 0.697 x 0.685 x 0.756 | 827 KB | Roughly cubic product |
| model17 | `/models/model17.glb` | 270,207 | 0.459 x 0.453 x 1.118 | 1,787 KB | Large detailed object |
| model18 | `/models/model18.glb` | 271,722 | 1.033 x 0.458 x 0.738 | 2,663 KB | Leather bag/accessory (beige/charcoal) |
| model19 | `/models/model19.glb` | 269,693 | 1.115 x 0.740 x 0.645 | 1,921 KB | Wide product object |
| model20 | `/models/model20.glb` | 267,827 | 0.975 x 0.974 x 0.758 | 2,032 KB | Roughly cubic product |

### 3.2 Model Properties

All models share these characteristics:

- **Compression**: KHR_draco_mesh_compression (requires DRACOLoader)
- **Textures**: 3 per model (base color, normal map, metallic-roughness) in WebP format
- **Material**: PBR (MeshStandardMaterial) with base color [1,1,1,1], metallic 1.0, roughness 1.0 (overridden by textures)
- **Node rotation**: All have a 90-degree X rotation quaternion [0.707, 0, 0, 0.707]
- **Single mesh**: Each model has exactly 1 mesh with 1 primitive

### 3.3 Default Rotations (Euler angles in radians)

These are the "rest pose" rotations for each model when displayed in the scene:

```javascript
const MODEL_ROTATIONS = {
  "/models/model4.glb":  [-1.309,  3.142,  0.436],
  "/models/model5.glb":  [-1.745, -0.262, -0.611],
  "/models/model7.glb":  [-1.833, -2.531, -0.611],
  "/models/model8.glb":  [-1.745, -0.262, -0.436],
  "/models/model10.glb": [-0.611,  2.007,  0.436],
  "/models/model11.glb": [-1.833,  0.524, -0.175],
  "/models/model12.glb": [-1.658,  0.349,  0.524],
  "/models/model13.glb": [-1.920, -0.873, -0.873],
  "/models/model14.glb": [-2.182, -0.785, -0.436],
  "/models/model15.glb": [-1.309, -0.087,  0.000],
  "/models/model16.glb": [-0.785, -0.611,  0.000],
  "/models/model17.glb": [-1.430,  2.436,  0.430],
  "/models/model18.glb": [-1.453,  0.234, -0.252],
  "/models/model19.glb": [-1.398,  0.523,  0.429],
  "/models/model20.glb": [-1.940,  0.240, -0.221],
};
```

### 3.4 Batch System

Models are split into two batches that alternate on each countdown cycle:

```javascript
const ALL_MODELS = [
  "/models/model4.glb",  "/models/model5.glb",  "/models/model7.glb",
  "/models/model8.glb",  "/models/model10.glb", "/models/model11.glb",
  "/models/model12.glb", "/models/model13.glb", "/models/model14.glb",
  "/models/model15.glb", "/models/model16.glb", "/models/model17.glb",
  "/models/model18.glb", "/models/model19.glb", "/models/model20.glb",
];

const BATCH_SIZE = 8;
const BATCHES = [
  ALL_MODELS.slice(0, BATCH_SIZE),   // Batch 0: model4 through model13
  ALL_MODELS.slice(BATCH_SIZE),       // Batch 1: model14 through model20
];
```

---

## 4. Model Loading

### 4.1 Loader Setup

```javascript
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
```

### 4.2 Model Normalization

After loading, each model is normalized to fit within a unit bounding box and centered at origin:

```javascript
function normalizeModel(gltfScene) {
  const clone = gltfScene.clone(true);
  
  // Convert materials to basic (unlit) for performance
  clone.traverse((child) => {
    if (child.isMesh) {
      const oldMat = child.material;
      const newMat = new THREE.MeshBasicMaterial({
        map: oldMat.map ?? null,
        alphaMap: oldMat.alphaMap ?? null,
        transparent: oldMat.transparent,
        opacity: oldMat.opacity,
        side: oldMat.side,
        depthTest: oldMat.depthTest,
        depthWrite: oldMat.depthWrite,
        fog: false,
        toneMapped: false,
        color: (oldMat.color ?? new THREE.Color(0xffffff)).clone(),
      });
      child.material = newMat;
      child.frustumCulled = false;
    }
  });
  
  // Normalize scale
  const box = new THREE.Box3().setFromObject(clone);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) clone.scale.multiplyScalar(1 / maxDim);
  
  // Center
  const center = box.getCenter(new THREE.Vector3()).multiplyScalar(maxDim > 0 ? 1 / maxDim : 1);
  clone.position.sub(center);
  
  return clone;
}
```

> **Note**: The original Shopify implementation converts PBR materials to `MeshBasicMaterial` (unlit) for performance. The objects rely entirely on their baked textures for visual appearance rather than real-time lighting.

---

## 5. Animation System

### 5.1 Key Constants

```javascript
const ORBIT_RADIUS_FACTOR = 0.72;     // Orbit radius relative to ring radius
const ORBIT_SPREAD_FACTOR = 1.65;     // Scale multiplier when spread
const VERTICAL_OFFSET_FACTOR = 0.35;  // Vertical rise as spread increases
const ORBIT_SPEED = 0.04;             // Radians per second for orbit
const BOB_AMPLITUDE_FACTOR = 0.03;    // Vertical bobbing amplitude
const BOB_SPEED_X = 0.7;              // Bobbing frequency
const SCALE_BASE = 0.3;               // Base scale for models
const SCALE_INTRO_DURATION = 0.3;     // Seconds for scale-in animation
const SCALE_OUTRO_DURATION = 0.3;     // Seconds for scale-out animation
const WOBBLE_FACTOR = 0.45;           // Mouse parallax rotation factor
```

### 5.2 Orbit Positioning (per frame)

Each model is positioned in a circular orbit around the clock center:

```javascript
function updateModelPositions(models, animStates, time, spreadT, baseRingRadius, mouseX, mouseY) {
  const scaleMult = THREE.MathUtils.lerp(1, ORBIT_SPREAD_FACTOR, THREE.MathUtils.clamp(spreadT, 0, 1));
  const verticalOffset = baseRingRadius * VERTICAL_OFFSET_FACTOR * THREE.MathUtils.clamp(spreadT, 0, 1);
  const orbitRadius = baseRingRadius * ORBIT_RADIUS_FACTOR * scaleMult;
  
  const elapsed = time * 0.001; // Convert to seconds
  const activeCount = Math.max(models.filter(m => m.visible).length, 1);
  
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    if (!model.visible) continue;
    
    const state = animStates[i];
    const modelPath = model.userData.path;
    
    // Orbit angle
    const angle = (i / activeCount) * Math.PI * 2 + elapsed * ORBIT_SPEED;
    
    // Random jitter (small per-model offset)
    const jitter = model.userData.jitter || [0, 0, 0];
    
    // Position
    model.position.set(
      Math.cos(angle) * orbitRadius + jitter[0] * baseRingRadius,
      Math.sin(elapsed * BOB_SPEED_X + i * 1.7) * BOB_AMPLITUDE_FACTOR * baseRingRadius + verticalOffset + jitter[1] * baseRingRadius,
      Math.sin(angle) * orbitRadius + jitter[2] * baseRingRadius
    );
    
    // Scale
    const modelScale = baseRingRadius * 0.13 * state.scale;
    model.scale.setScalar(Math.max(modelScale, 0.001));
    
    // Rotation (base + wobble + mouse parallax)
    const baseRot = MODEL_ROTATIONS[modelPath] || [0, 0, 0];
    model.rotation.set(
      baseRot[0] + Math.sin(elapsed * 0.15 + i) * 0.3 - mouseY * WOBBLE_FACTOR,
      baseRot[1] + Math.sin(elapsed * 0.2 + i * 2) * 0.4 + mouseX * WOBBLE_FACTOR,
      baseRot[2] + Math.sin(elapsed * 0.1 + i * 0.5) * 0.15
    );
  }
}
```

### 5.3 Scale Intro/Outro Animation

Models animate in and out with a "back" easing (slight overshoot):

```javascript
// Using GSAP for the scale animations:
// Intro (appear):
gsap.to(animState, {
  scale: 1,
  duration: 0.3,
  ease: "back.out(1.8)",
  delay: staggerDelay, // Each model has a staggered delay
});

// Outro (disappear):
gsap.to(animState, {
  scale: 0,
  duration: 0.3,
  ease: "back.in(1.8)",
  onComplete: () => { animState.visible = false; }
});
```

### 5.4 Random Jitter

Each model gets a small random position offset that changes on each cycle:

```javascript
function generateJitter() {
  const jitterXZ = 0.07;  // XZ jitter range
  const jitterY = 0.26;   // Y jitter range (larger)
  const jitters = {};
  for (const path of ALL_MODELS) {
    jitters[path] = [
      (Math.random() * 2 - 1) * jitterXZ,
      (Math.random() * 2 - 1) * jitterXZ,
      (Math.random() * 2 - 1) * jitterY,
    ];
  }
  return jitters;
}
```

---

## 6. Complete Implementation Example

Below is a self-contained Three.js component that recreates the floating 3D objects system:

```javascript
// FloatingObjects.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import gsap from 'gsap';

// ── Configuration ──────────────────────────────────────────
const ALL_MODEL_PATHS = [
  "/models/model4.glb",  "/models/model5.glb",  "/models/model7.glb",
  "/models/model8.glb",  "/models/model10.glb", "/models/model11.glb",
  "/models/model12.glb", "/models/model13.glb", "/models/model14.glb",
  "/models/model15.glb", "/models/model16.glb", "/models/model17.glb",
  "/models/model18.glb", "/models/model19.glb", "/models/model20.glb",
];

const MODEL_ROTATIONS = {
  "/models/model4.glb":  [-1.309,  3.142,  0.436],
  "/models/model5.glb":  [-1.745, -0.262, -0.611],
  "/models/model7.glb":  [-1.833, -2.531, -0.611],
  "/models/model8.glb":  [-1.745, -0.262, -0.436],
  "/models/model10.glb": [-0.611,  2.007,  0.436],
  "/models/model11.glb": [-1.833,  0.524, -0.175],
  "/models/model12.glb": [-1.658,  0.349,  0.524],
  "/models/model13.glb": [-1.920, -0.873, -0.873],
  "/models/model14.glb": [-2.182, -0.785, -0.436],
  "/models/model15.glb": [-1.309, -0.087,  0.000],
  "/models/model16.glb": [-0.785, -0.611,  0.000],
  "/models/model17.glb": [-1.430,  2.436,  0.430],
  "/models/model18.glb": [-1.453,  0.234, -0.252],
  "/models/model19.glb": [-1.398,  0.523,  0.429],
  "/models/model20.glb": [-1.940,  0.240, -0.221],
};

const BATCH_SIZE = 8;
const BATCHES = [
  ALL_MODEL_PATHS.slice(0, BATCH_SIZE),
  ALL_MODEL_PATHS.slice(BATCH_SIZE),
];

const CONFIG = {
  orbitRadiusFactor: 0.72,
  spreadScale: 1.65,
  verticalOffsetFactor: 0.35,
  orbitSpeed: 0.04,
  bobAmplitude: 0.03,
  bobSpeed: 0.7,
  modelScaleFactor: 0.13,
  baseScale: 0.3,
  jitterXZ: 0.07,
  jitterY: 0.26,
  wobbleFactor: 0.45,
  introOutroDuration: 0.3,
  introEase: "back.out(1.8)",
  outroEase: "back.in(1.8)",
  cycleInterval: 26000, // ms between batch swaps (matches countdown)
};

// ── Floating Objects System ────────────────────────────────
export class FloatingObjectsSystem {
  constructor(parentGroup, ringRadius = 40) {
    this.parent = parentGroup;
    this.ringRadius = ringRadius;
    this.models = [];
    this.animStates = [];
    this.activePaths = [];
    this.activeBatchIndex = 0;
    this.jitters = {};
    this.modelCache = new Map();
    this.materials = [];
    this.mouseX = 0;
    this.mouseY = 0;
    
    // Set up loaders
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(
      'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
    );
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    
    // Create model containers
    const root = new THREE.Group();
    root.visible = false;
    parentGroup.add(root);
    this.root = root;
    
    for (let i = 0; i < BATCH_SIZE; i++) {
      const container = new THREE.Group();
      container.visible = false;
      root.add(container);
      this.models.push(container);
      this.animStates.push({
        visible: false,
        scale: CONFIG.baseScale,
        introTween: null,
        outroTween: null,
      });
    }
    
    // Generate initial jitter
    this._generateJitter();
    
    // Track mouse
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', (e) => {
        this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      });
    }
  }
  
  _generateJitter() {
    for (const path of ALL_MODEL_PATHS) {
      this.jitters[path] = [
        (Math.random() * 2 - 1) * CONFIG.jitterXZ,
        (Math.random() * 2 - 1) * CONFIG.jitterXZ,
        (Math.random() * 2 - 1) * CONFIG.jitterY,
      ];
    }
  }
  
  _normalizeModel(scene) {
    const clone = scene.clone(true);
    const mats = [];
    
    clone.traverse((child) => {
      if (child.isMesh) {
        // Convert to unlit material for performance
        const old = child.material;
        const mat = new THREE.MeshBasicMaterial({
          map: old.map ?? null,
          transparent: old.transparent,
          opacity: old.opacity,
          side: old.side,
          fog: false,
          toneMapped: false,
          color: (old.color ?? new THREE.Color(0xffffff)).clone(),
        });
        mats.push(mat);
        child.material = mat;
        child.frustumCulled = false;
      }
    });
    
    this.materials.push(...mats);
    
    // Normalize to unit bounding box
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) clone.scale.multiplyScalar(1 / maxDim);
    const center = box.getCenter(new THREE.Vector3())
      .multiplyScalar(maxDim > 0 ? 1 / maxDim : 1);
    clone.position.sub(center);
    
    return clone;
  }
  
  async _loadModel(path) {
    if (this.modelCache.has(path)) {
      return this._normalizeModel(this.modelCache.get(path));
    }
    
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        (gltf) => {
          this.modelCache.set(path, gltf.scene);
          resolve(this._normalizeModel(gltf.scene));
        },
        undefined,
        reject
      );
    });
  }
  
  async cycleBatch() {
    const batch = BATCHES[this.activeBatchIndex];
    this.activeBatchIndex = (this.activeBatchIndex + 1) % BATCHES.length;
    this._generateJitter();
    
    // Outro current models
    for (let i = 0; i < this.models.length; i++) {
      const state = this.animStates[i];
      if (state.introTween) state.introTween.kill();
      if (state.outroTween) state.outroTween.kill();
      
      if (state.visible) {
        state.outroTween = gsap.to(state, {
          scale: 0,
          duration: CONFIG.introOutroDuration,
          ease: CONFIG.outroEase,
          onComplete: () => {
            state.visible = false;
            this.models[i].visible = false;
          },
        });
      }
    }
    
    // Wait for outro
    await new Promise(r => setTimeout(r, CONFIG.introOutroDuration * 1000 + 100));
    
    // Shuffle order
    const indices = Array.from({ length: batch.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // Load and intro new models
    this.activePaths = [...batch];
    
    for (let i = 0; i < Math.min(batch.length, this.models.length); i++) {
      const path = batch[i];
      const container = this.models[i];
      
      // Clear old children
      while (container.children.length > 0) {
        container.remove(container.children[0]);
      }
      
      try {
        const model = await this._loadModel(path);
        container.add(model);
        container.userData.path = path;
        container.visible = true;
        
        const state = this.animStates[i];
        state.visible = true;
        state.scale = CONFIG.baseScale;
        
        const delay = (indices[i] / batch.length) * 1 + 1; // Staggered
        state.introTween = gsap.to(state, {
          scale: 1,
          duration: CONFIG.introOutroDuration,
          ease: CONFIG.introEase,
          delay: delay,
        });
      } catch (e) {
        console.warn(`Failed to load ${path}:`, e);
      }
    }
    
    this.root.visible = true;
  }
  
  update(time, spreadT = 1) {
    if (!this.root.visible) return;
    
    const radius = this.ringRadius;
    const scaleMult = THREE.MathUtils.lerp(1, CONFIG.spreadScale, THREE.MathUtils.clamp(spreadT, 0, 1));
    const vOffset = radius * CONFIG.verticalOffsetFactor * THREE.MathUtils.clamp(spreadT, 0, 1);
    const orbitR = radius * CONFIG.orbitRadiusFactor * scaleMult;
    const elapsed = time * 0.001;
    const activeCount = Math.max(this.activePaths.length, 1);
    const modelScaleBase = radius * CONFIG.modelScaleFactor;
    
    for (let i = 0; i < this.models.length; i++) {
      const model = this.models[i];
      if (model.children.length === 0) continue;
      
      const state = this.animStates[i];
      if (!state.visible) {
        model.visible = false;
        continue;
      }
      
      model.visible = true;
      const path = this.activePaths[i] ?? "";
      const jitter = this.jitters[path] ?? [0, 0, 0];
      const baseRot = MODEL_ROTATIONS[path] ?? [0, 0, 0];
      
      // Orbit angle
      const angle = (i / activeCount) * Math.PI * 2 + elapsed * CONFIG.orbitSpeed;
      
      // Position
      model.position.set(
        Math.cos(angle) * orbitR + jitter[0] * radius,
        Math.sin(elapsed * CONFIG.bobSpeed + i * 1.7) * CONFIG.bobAmplitude * radius + vOffset + jitter[1] * radius,
        Math.sin(angle) * orbitR + jitter[2] * radius
      );
      
      // Scale
      model.scale.setScalar(Math.max(modelScaleBase * state.scale, 0.001));
      
      // Rotation with wobble and mouse parallax
      model.rotation.set(
        baseRot[0] + Math.sin(elapsed * 0.15 + i) * 0.3 - this.mouseY * CONFIG.wobbleFactor,
        baseRot[1] + Math.sin(elapsed * 0.2 + i * 2) * 0.4 + this.mouseX * CONFIG.wobbleFactor,
        baseRot[2] + Math.sin(elapsed * 0.1 + i * 0.5) * 0.15
      );
    }
  }
  
  dispose() {
    this.dracoLoader.dispose();
    for (const mat of this.materials) mat.dispose();
    for (const [, scene] of this.modelCache) {
      scene.traverse((child) => {
        if (child.isMesh) child.geometry.dispose();
      });
    }
  }
}
```

---

## 7. Integration Example (React + Three.js)

```jsx
// ClockScene.jsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FloatingObjectsSystem } from './FloatingObjects';

export function ClockScene() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 0.1, 2000
    );
    camera.position.set(0, 0, 200);
    
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Create floating objects system
    const floatingObjects = new FloatingObjectsSystem(scene, 40);
    
    // Start first batch
    floatingObjects.cycleBatch();
    
    // Cycle batches every 26 seconds (matching countdown)
    const cycleInterval = setInterval(() => {
      floatingObjects.cycleBatch();
    }, 26000);
    
    // Animation loop
    let startTime = performance.now();
    function animate() {
      const time = performance.now() - startTime;
      floatingObjects.update(time, 1.0);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
    
    // Resize handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    
    return () => {
      clearInterval(cycleInterval);
      window.removeEventListener('resize', onResize);
      floatingObjects.dispose();
      renderer.dispose();
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}
```

---

## 8. File Structure

Place the model files in your project's public directory:

```
public/
  models/
    model4.glb
    model5.glb
    model7.glb
    model8.glb
    model10.glb
    model11.glb
    model12.glb
    model13.glb
    model14.glb
    model15.glb
    model16.glb
    model17.glb
    model18.glb
    model19.glb
    model20.glb
```

The GLB files are self-contained (textures are embedded), so no additional texture files are needed.

---

## 9. Dependencies

```json
{
  "three": "^0.162.0",
  "gsap": "^3.12.0"
}
```

Install with:
```bash
npm install three gsap
```

---

## 10. Performance Notes

| Optimization | Details |
|-------------|---------|
| **Unlit materials** | Models use `MeshBasicMaterial` instead of `MeshStandardMaterial` to avoid lighting calculations |
| **Draco compression** | All models use Draco mesh compression, reducing file sizes by ~60-80% |
| **Batch loading** | Only 8 models are visible at a time; the other 7 are loaded lazily |
| **Frustum culling disabled** | `frustumCulled = false` since models are always in view when visible |
| **No fog** | `fog: false` on materials for performance |
| **Scale-to-zero** | Invisible models are scaled to 0 rather than removed from scene |

---

## 11. Source URLs for Model Files

The original model files can be downloaded from:

```
https://shopify.design/models/model4.glb
https://shopify.design/models/model5.glb
https://shopify.design/models/model7.glb
https://shopify.design/models/model8.glb
https://shopify.design/models/model10.glb
https://shopify.design/models/model11.glb
https://shopify.design/models/model12.glb
https://shopify.design/models/model13.glb
https://shopify.design/models/model14.glb
https://shopify.design/models/model15.glb
https://shopify.design/models/model16.glb
https://shopify.design/models/model17.glb
https://shopify.design/models/model18.glb
https://shopify.design/models/model19.glb
https://shopify.design/models/model20.glb
```

---

## 12. Clock Ring (Bonus)

The orange ring around the clock is a simple CSS/SVG circle, not a 3D object:

```html
<div data-layout="shape" data-id="cd-ring" data-shape-type="circle"
     data-color="FF591D" data-outline="true" data-depth="-200"
     class="shape cd-ring" aria-hidden="true"></div>
```

In the 3D scene, this corresponds to a flat circle outline at depth -200 with color `#FF591D`.
