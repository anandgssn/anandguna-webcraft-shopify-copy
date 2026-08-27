# Shopify Design 3D World: Pixel-Perfect Implementation Specification

**Author:** Manus AI | **Date:** May 11, 2026 | **Source:** [shopify.design](https://shopify.design/)

---

## 1. Executive Summary

This document provides a comprehensive, pixel-perfect specification for recreating the full 3D WebGL world seen on shopify.design. It is based on a deep reverse-engineering of the original site's minified JavaScript source code (Three.js r182) and a visual comparison with the local implementation at `localhost:3456`.

The local version currently implements a basic 3D space but has critical visual deficiencies: it uses a **black background** instead of white, lacks the **dense animated dot grid** with cell-noise glow, misses the entire **post-processing pipeline** (chromatic aberration, barrel warp, vignette, electric edge pass), and does not implement the complex **depth-based fog** and **scroll-driven spread animation** correctly.

---

## 2. Core Architecture

### 2.1 Global Constants

Every numeric value below is extracted directly from the minified source. The entire coordinate system depends on these constants working together.

| Constant | Variable | Value | Description |
|----------|----------|-------|-------------|
| Base FOV | `D1` | `50` | Base camera field-of-view in degrees |
| Reference Height | `L1` | `900` | Reference screen height for scaling |
| Pixel-to-World | `Fr` | `0.001036` | `2 * tan(50 * PI/180 / 2) / 900` |
| Camera Distance | `uc` | `800` | Camera Y distance from origin plane |
| Base Y | `Dn` | `0` | Base Y position for all objects |
| View Range | `qa` | `2400` | Half-range of visible Z depth |
| Extended Range | `BD` | `5000` | Extended depth range during spread |
| Fog Near (flat) | `HD` | `9999` | Fog near in flat mode (effectively disabled) |
| Fog Far (flat) | `WD` | `10000` | Fog far in flat mode |
| Rise Multiplier | `XD` | `1.6` | Y-rise multiplier during spread |
| Spread Threshold | `Qr` | `0.001` | Minimum spreadT to activate 3D mode |
| Dot Scale Ratio | `IB` | `3.5 / 7.5` (~0.467) | Dot scale at full spread |
| Camera Scale | `FB` | `1.1` | Camera height multiplier during spread |
| Tick Count | `Ei` | `221` | Number of tick marks on the clock ring |
| Tick Height Ratio | `Hv` | `0.014` | Tick mark height relative to ring radius |
| Tick Width Ratio | `Wv` | `0.003` | Tick mark width relative to ring radius |
| Clock Hand Y | `ju` | `64` | Clock hand Y offset |
| Clock Hand Lift | `xb` | `-10` | Additional Y offset for clock hand |
| FOV Spread | `RD` | `75` | FOV at full spread |
| Fade Start | `GD` | `0.7` | Z-fade start factor |
| Fade End | `zD` | `1.5` | Z-fade end factor |

### 2.2 Quality Tiers

The site dynamically selects a quality tier based on GPU capabilities. Each tier controls the density and complexity of the 3D world.

| Setting | High | Medium | Low |
|---------|------|--------|-----|
| `layerCount` | 20 | 12 | 8 |
| `photoSlices` | 6 | 4 | 3 |
| `electricOctaves` | 3 | 2 | 0 |
| `radialBlurSamples` | 12 | 8 | 6 |
| `glowEnabled` | true | true | false |
| `dprCap` | 1.5 | 1.2 | 1.0 |
| `sdfGlyphSize` | 128 | 128 | 128 |
| `gridPadding` | 6 | 4 | 3 |
| `dotDensity` | 0.5 | 0.4 | 0.3 |
| `texMaxSize` | 256 | 256 | 256 |

### 2.3 Transition Config Defaults

These control the spread/collapse animation timing:

| Parameter | Value | Description |
|-----------|-------|-------------|
| `easeType` | `"easeInOutCubic"` | Easing for spread-in |
| `duration` | `700` (ms) | Duration of spread-in |
| `easeTypeOut` | `"easeOutQuad"` | Easing for collapse-out |
| `durationOut` | `600` (ms) | Duration of collapse-out |
| `lookSpeed` | `6` | Mouse parallax smoothing divisor |
| `electricEdge` | `true` | Enable electric edge pass |
| `blurStrength` | `0.15` | Radial blur strength |
| `blurEdgeStart` | `0.7` | Blur starts at this distance from center |
| `vignetteDark` | `0` | Vignette darkness (0 = off in flat mode) |
| `vignetteStart` | `0.7` | Vignette starts at this distance |
| `vignetteColorShift` | `0.8` | Vignette color shift threshold |
| `chromStrength` | `0.024` | Chromatic aberration strength |
| `barrelWarp` | `0.3` | Barrel distortion strength |
| `warpCenter` | `0.15` | Barrel warp center offset |
| `bandWidth` | `0.18` | Electric pass band width |
| `maskLeadIn` | `225` (ms) | Mask reveal lead-in time |
| `maskTrailOut` | `0` | Mask trail-out time |
| `maskDarkenDelay` | `0.3` | Darken delay factor |
| `maskEase` | `"easeInOutCubic"` | Mask easing function |

### 2.4 Easing Functions

```javascript
const easings = {
  easeInOutCubic: n => n < 0.5 ? 4*n*n*n : (n-1)*(2*n-2)*(2*n-2) + 1,
  easeInQuart: n => n*n*n*n,
  easeOutQuart: n => 1 - (--n)*n*n*n,
  easeInOutQuart: n => n < 0.5 ? 8*n*n*n*n : 1 - 8*(--n)*n*n*n,
  easeInQuint: n => n*n*n*n*n,
  easeOutQuint: n => 1 + (--n)*n*n*n*n,
  easeInOutQuint: n => n < 0.5 ? 16*n*n*n*n*n : 1 + 16*(--n)*n*n*n*n,
  easeOutQuad: n => n * (2 - n)
};
```

---

## 3. Scene Setup

### 3.1 Renderer

```javascript
const renderer = new THREE.WebGLRenderer({
  canvas: canvasElement,
  antialias: true,
  alpha: true,
  premultipliedAlpha: true,
  stencilBuffer: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.dprCap));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
```

### 3.2 Background & Fog

> **Critical Fix for Local Version:** The background must be **white** (`#FFFFFF`), not black. The fog must also be white. Both transition to black as `spreadT` increases.

```javascript
const [r, g, b] = parseHexColor("#FFFFFF"); // [1, 1, 1]
scene.background = new THREE.Color(r, g, b);
scene.fog = new THREE.Fog(0xFFFFFF, 200 * scale, 2200 * scale);
```

**Fog animation during spread:**
```javascript
function updateFog(scene, spreadT, scale) {
  const fogIntensity = spreadT < 0.001 ? 1 : 1 - spreadT; // White to black
  scene.fog.color.setScalar(fogIntensity);
  scene.background.setScalar(fogIntensity);
  scene.fog.near = lerp(200 * scale, 30 * scale, spreadT);
  scene.fog.far = lerp(2200 * scale, 400 * scale, spreadT);
}
```

### 3.3 Camera

The camera uses a **dynamic FOV** that adjusts to the window height so that DOM elements map precisely to 3D coordinates.

```javascript
function calculateFOV(clientHeight) {
  // Fr = 2 * tan(D1 * PI/180 / 2) / L1
  const Fr = 2 * Math.tan(50 * Math.PI / 180 / 2) / 900;
  const val = Fr * clientHeight;
  return 2 * Math.atan(val / (2 * 800)) * (180 / Math.PI);
}

const camera = new THREE.PerspectiveCamera(
  calculateFOV(window.innerHeight),
  window.innerWidth / window.innerHeight,
  0.5,
  8000 * scale
);
camera.position.set(0, 800 * scale, 0); // Y = uc * scale
camera.up.set(0, 0, -1); // IMPORTANT: Camera looks down the Y axis
```

**Camera update per frame:**
```javascript
function updateCamera(camera, state) {
  const { spreadT, smoothMouseX, smoothMouseY, scrollZ, scale } = state;
  
  // Mouse parallax (only active during spread)
  const panLimit = 800 * scale; // DD * scale
  const pitchLimit = Math.PI / 3; // PD
  
  const lookPanX = smoothMouseX * panLimit * spreadT * state.lookScale;
  const lookPitch = smoothMouseY * pitchLimit * spreadT * state.lookScale;
  
  // Smooth the look values
  state.lookPanXSmooth += (lookPanX - state.lookPanXSmooth) / config.lookSpeed;
  state.lookPitchSmooth += (lookPitch - state.lookPitchSmooth) / config.lookSpeed;
  
  const cameraY = 800 * scale; // uc * scale
  const targetX = state.lookPanXSmooth;
  const targetY = cameraY - panLimit * Math.cos(state.lookPitchSmooth);
  const targetZ = panLimit * Math.sin(Math.abs(state.lookPitchSmooth)) 
                  * Math.sign(state.lookPitchSmooth) + scrollZ;
  
  camera.position.set(0, cameraY, scrollZ);
  camera.up.set(0, 0, -1);
  camera.lookAt(targetX, targetY, targetZ);
  
  // Dynamic FOV: lerp between base FOV and spread FOV (75)
  const baseFOV = calculateFOV(window.innerHeight);
  const spreadFOV = 75; // RD
  camera.fov = lerp(baseFOV, spreadFOV, spreadT);
  camera.updateProjectionMatrix();
}
```

---

## 4. Scroll & Spread System

### 4.1 Scroll-to-Z Mapping with Spring Physics

```javascript
// On scroll event (passive listener)
state.scrollZTarget = window.scrollY * Fr * scale;

// In animation loop - spring physics
const springConfig = { stiffness: 400, damping: 28 };
const dt = 1 / 60;

state.scrollZVel += (springConfig.stiffness * (state.scrollZTarget - state.scrollZ) 
                     - springConfig.damping * state.scrollZVel) * dt;
state.scrollZ += state.scrollZVel * dt;
```

### 4.2 Spread Transition

The `spreadT` value drives the entire 3D world transition. It goes from 0 (flat 2D) to 1 (full 3D).

```javascript
function updateSpread(state, config, timestamp) {
  const isOpening = state.targetProgress === 1;
  const duration = isOpening ? config.duration : config.durationOut;
  const easing = isOpening 
    ? easings[config.easeType] || easings.easeInOutQuint
    : easings[config.easeTypeOut] || easings.easeInOutQuint;
  
  if (duration > 0 && state.transitionStart > 0) {
    const elapsed = timestamp - state.transitionStart;
    const progress = Math.min(elapsed / duration, 1);
    state.spreadProgress = state.transitionFrom 
      + (state.targetProgress - state.transitionFrom) * easing(progress);
    state.spreadProgress = clamp(state.spreadProgress, 0, 1);
  }
  
  state.spreadT = state.spreadProgress;
}
```

### 4.3 Mouse Smoothing

```javascript
const MOUSE_SMOOTH = 0.06; // dx constant
state.smoothMouseX += (state.mouseX - state.smoothMouseX) * MOUSE_SMOOTH;
state.smoothMouseY += (state.mouseY - state.smoothMouseY) * MOUSE_SMOOTH;
```

---

## 5. The Grid & Dot System

This is the most visually prominent feature and the area where the local version differs most dramatically.

### 5.1 Grid Configuration

```javascript
const gridConfig = {
  cellSize: 149,        // World units between grid intersections
  normalDotSize: 8,     // Size of regular dots
  cornerDotSize: 8,     // Size of corner dots (at grid intersections)
  layerSpacing: 150,    // Y-distance between dot layers
  sizeAttenuation: true // Dots scale with perspective
};
```

### 5.2 Grid Bounds Calculation

The grid is computed to fill the visible area with padding:

```javascript
function computeGridBounds(viewportWidth, viewportHeight, gridConfig, padding, sceneDepth, scale) {
  const gridUnit = gridConfig.cellSize / 3; // Sub-cell unit
  const aspect = viewportWidth / viewportHeight;
  const baseFOV = calculateFOV(viewportHeight);
  const halfHeight = Math.tan(baseFOV * Math.PI / 360) * 800; // uc
  const halfWidth = halfHeight * aspect;
  const pad = gridConfig.cellSize * padding;
  const totalZ = sceneDepth + halfHeight;
  
  const cols = Math.ceil((halfWidth + pad * 2) / gridUnit) + 1;
  const rows = Math.ceil((totalZ + pad * 2) / gridUnit) + 1;
  const startX = -(halfWidth / 2 + pad);
  const startZ = -(halfHeight / 2 + pad);
  
  return { cols, rows, startX, startZ, gridUnit };
}
```

### 5.3 Dot Layer Creation (20 layers at high quality)

Each dot layer is a `THREE.Points` object with custom attributes:

```javascript
function createDotLayer(gridConfig, layerIndex, totalLayers, bounds, dotDensity) {
  const { cellSize, normalDotSize, cornerDotSize } = gridConfig;
  const dpr = window.devicePixelRatio || 1;
  const gridUnit = cellSize / 3;
  const { cols, rows, startX, startZ } = bounds;
  
  // Sample every 3rd grid point (controlled by v=3)
  const step = 3;
  const dots = [];
  const rng = seededRandom(layerIndex * 9973 + 7);
  
  for (let row = 0; row < rows; row += step) {
    for (let col = 0; col < cols; col += step) {
      const x = startX + col * gridUnit;
      const z = startZ + row * gridUnit;
      const modX = ((x % cellSize) + cellSize) % cellSize;
      const modZ = ((z % cellSize) + cellSize) % cellSize;
      const isCornerX = modX < 0.01 || Math.abs(modX - cellSize) < 0.01;
      const isCornerZ = modZ < 0.01 || Math.abs(modZ - cellSize) < 0.01;
      dots.push({ x, z, corner: isCornerX && isCornerZ });
    }
  }
  
  // Build geometry
  const positions = new Float32Array(dots.length * 3);
  const sizes = new Float32Array(dots.length);
  const axes = new Float32Array(dots.length);
  const signs = new Float32Array(dots.length);
  const speeds = new Float32Array(dots.length);
  const phases = new Float32Array(dots.length);
  
  for (let i = 0; i < dots.length; i++) {
    positions[i * 3] = dots[i].x;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = dots[i].z;
    
    const dotSize = dots[i].corner ? cornerDotSize : normalDotSize;
    sizes[i] = Math.max(1, dotSize * 0.25) * dpr;
    axes[i] = rng() < 0.5 ? 0 : 1;
    signs[i] = rng() < 0.5 ? -1 : 1;
    speeds[i] = 0.28 + rng() * 0.5;
    phases[i] = rng();
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('a_size', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('a_axis', new THREE.Float32BufferAttribute(axes, 1));
  geometry.setAttribute('a_sign', new THREE.Float32BufferAttribute(signs, 1));
  geometry.setAttribute('a_speed', new THREE.Float32BufferAttribute(speeds, 1));
  geometry.setAttribute('a_phase', new THREE.Float32BufferAttribute(phases, 1));
  
  // Material with custom shaders (see Section 5.4)
  const material = new THREE.ShaderMaterial({ /* ... */ });
  
  const points = new THREE.Points(geometry, material);
  // Position each layer at a different Y height
  // Layers are distributed above and below the center
  const centerLayer = Math.round((totalLayers - 1) / 2);
  points.position.y = (layerIndex - centerLayer) * gridConfig.layerSpacing;
  
  return points;
}
```

### 5.4 Dot Layer Vertex Shader

```glsl
attribute float a_size;
attribute float a_axis;
attribute float a_sign;
attribute float a_speed;
attribute float a_phase;
uniform float u_time;
uniform float u_motion;
uniform float u_sizeAttenuation;
uniform float u_dotScale;
uniform float u_startX;
uniform float u_endX;
uniform float u_startZ;
uniform float u_endZ;
uniform float u_riseY;
uniform float u_xzDensity;
uniform float u_zCenter;
varying float v_fogDepth;

void main() {
  vec3 p = position;
  
  // Animate dots along grid lanes
  // a_axis = 0 -> X lanes, a_axis = 1 -> Z lanes
  float t = fract(u_time * a_speed + a_phase);
  float travel = (a_sign < 0.0) ? (1.0 - t) : t;
  if (a_axis < 0.5) {
    p.x = mix(u_startX, u_endX, travel);
  } else {
    p.z = mix(u_startZ, u_endZ, travel);
  }
  p = mix(position, p, u_motion);
  
  // Density compression
  p.x *= u_xzDensity;
  p.z = u_zCenter + (p.z - u_zCenter) * u_xzDensity;
  p.y += u_riseY;
  
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  float perspScale = 300.0 / -mvPosition.z;
  float scale = mix(1.0, perspScale, u_sizeAttenuation);
  gl_PointSize = a_size * 2.0 * scale * u_dotScale;
  v_fogDepth = -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
```

### 5.5 Dot Layer Fragment Shader

```glsl
precision highp float;
uniform vec3 u_color;
uniform float u_layerAlpha;
uniform float u_fogNear;
uniform float u_fogFar;
varying float v_fogDepth;

void main() {
  vec2 coord = gl_PointCoord * 2.0 - 1.0;
  float dist = length(coord);
  float alpha = 1.0 - smoothstep(0.8, 1.0, dist);
  if (alpha < 0.01) discard;
  
  float fogFactor = smoothstep(u_fogNear, u_fogFar, v_fogDepth);
  float fogAlpha = 1.0 - fogFactor;
  if (fogAlpha < 0.01) discard;
  
  gl_FragColor = vec4(u_color, alpha * u_layerAlpha * fogAlpha);
}
```

### 5.6 Dot Glow Layer Shader (Electric Sweep Effect)

Each dot layer has an optional glow layer that creates the animated "electric sweep" effect:

**Vertex Shader:**
```glsl
attribute float a_size;
uniform float u_sizeAttenuation;
uniform float u_dotScale;
varying vec3 v_worldPos;

void main() {
  v_worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float perspScale = 300.0 / -mvPosition.z;
  float scale = mix(1.0, perspScale, u_sizeAttenuation);
  gl_PointSize = a_size * 3.0 * scale * u_dotScale;
  gl_Position = projectionMatrix * mvPosition;
}
```

**Fragment Shader:**
```glsl
precision highp float;
uniform float u_time;
uniform float u_spreadT;
uniform float u_layerAlpha;
uniform float u_sizeAttenuation;
uniform float u_dotScale;
uniform float u_exciteTint;
varying vec3 v_worldPos;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 coord = gl_PointCoord * 2.0 - 1.0;
  float dist = length(coord);
  float fw = fwidth(dist);
  float core = 1.0 - smoothstep(0.35 - fw, 0.35 + fw, dist);
  float halo = exp(-dist * dist * 8.0) * 0.4;
  float glow = core + halo;
  if (glow < 0.01) discard;
  
  float wx = v_worldPos.x * 0.003;
  float wz = v_worldPos.z * 0.003;
  float sweep1 = sin(wx * 3.0 + wz * 2.0 - u_time * 4.0 
                     + hash(floor(v_worldPos.xz * 0.005)) * 6.283);
  float sweep2 = sin(wx * -2.0 + wz * 4.0 - u_time * 5.5 
                     + hash(floor(v_worldPos.xz * 0.008 + 30.0)) * 6.283);
  float sweep3 = sin(wx * 1.0 - wz * 3.0 - u_time * 3.5 
                     + hash(floor(v_worldPos.xz * 0.003 + 70.0)) * 6.283);
  float edge1 = step(0.85, sweep1);
  float edge2 = step(0.85, sweep2);
  float edge3 = step(0.85, sweep3);
  float energy = max(edge1, max(edge2, edge3));
  
  float alpha = glow * energy * u_spreadT * u_layerAlpha * 5.0;
  if (alpha < 0.01) discard;
  
  vec3 warmGold = vec3(1.0, 0.88, 0.5);
  vec3 col = mix(vec3(1.0), warmGold, u_exciteTint);
  gl_FragColor = vec4(col, alpha);
}
```

**Blending mode:** `THREE.AdditiveBlending`

---

## 6. Grid Line System

Grid lines are rendered as `THREE.Points` (not actual lines) that animate along the grid structure.

### 6.1 Line Layer Vertex Shader

```glsl
attribute float a_axis;
attribute float a_speed;
attribute float a_phase;
uniform float u_fogNear;
uniform float u_fogFar;
uniform float u_pointSize;
uniform float u_spreadT;
uniform float u_time;
uniform float u_startX;
uniform float u_endX;
uniform float u_startZ;
uniform float u_endZ;
uniform float u_startY;
uniform float u_endY;
varying float v_depth;
varying vec3 v_worldPos;

void main() {
  vec3 p = position;
  float raw = fract(u_time * a_speed + a_phase);
  float t = raw * raw * (3.0 - 2.0 * raw); // Smooth hermite
  
  if (a_axis < 0.5) {
    p.x = mix(u_startX, u_endX, t);
  } else if (a_axis < 1.5) {
    p.y = mix(u_startY, u_endY, t);
  } else {
    p.z = mix(u_startZ, u_endZ, t);
  }
  p = mix(position, p, u_spreadT);
  
  v_worldPos = (modelMatrix * vec4(p, 1.0)).xyz;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  v_depth = -mvPosition.z;
  float perspScale = 300.0 / -mvPosition.z;
  float scale = mix(1.0, perspScale, u_spreadT);
  gl_PointSize = u_pointSize * scale;
  gl_Position = projectionMatrix * mvPosition;
}
```

### 6.2 Line Layer Fragment Shader

```glsl
precision highp float;
uniform float u_time;
uniform float u_spreadT;
uniform float u_fogNear;
uniform float u_fogFar;
uniform float u_layerAlpha;
uniform vec3 u_color;
varying float v_depth;
varying vec3 v_worldPos;

vec2 rand2(vec2 p) {
  return fract(sin(vec2(
    dot(p, vec2(127.1, 311.7)),
    dot(p, vec2(269.5, 183.3))
  )) * 43758.5453);
}

float cellNoise(vec2 x) {
  vec2 p = floor(x);
  vec2 f = fract(x);
  float minDist = 1.0;
  for (int j = 0; j <= 1; j++) {
    for (int i = 0; i <= 1; i++) {
      vec2 b = vec2(float(i), float(j));
      vec2 r = rand2(p + b);
      vec2 cellPt = 0.5 + 0.5 * sin(u_time * 2.5 + 6.2831 * r);
      float d = length(b - f + cellPt);
      minDist = min(minDist, d);
    }
  }
  return minDist;
}

void main() {
  vec2 coord = gl_PointCoord * 2.0 - 1.0;
  float dist = length(coord);
  if (dist > 1.0) discard;
  
  float core = 1.0 - smoothstep(0.0, 0.3, dist);
  float halo = exp(-dist * dist * 4.0);
  float shape = mix(halo, core + halo, u_spreadT);
  
  float d = cellNoise(v_worldPos.xz * 0.006);
  float xzGlow = exp(-d * d * 25.0);
  float yPulse = 0.5 + 0.5 * sin(v_worldPos.y * 0.04 + u_time * 3.0);
  float yGlow = yPulse * yPulse;
  float glow = max(xzGlow, yGlow * 0.6);
  
  float baseVis = 0.3;
  float visibility = mix(1.0, baseVis + (1.0 - baseVis) * glow, u_spreadT);
  
  float fog = smoothstep(u_fogNear, u_fogFar, v_depth);
  float alpha = shape * visibility * u_layerAlpha * (1.0 - fog);
  if (alpha < 0.01) discard;
  
  vec3 col = u_color * (1.0 + glow * u_spreadT * 2.0);
  gl_FragColor = vec4(col, alpha);
}
```

---

## 7. Clock Ring, Ticks, and Hand

### 7.1 Clock Ring Shader

The clock ring is a flat quad with a custom SDF shader that draws a circle outline:

```glsl
// Vertex
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment
uniform vec3 u_color;
uniform float u_radius;
uniform float u_stroke;    // 0.8
uniform float u_quadSize;
uniform float u_opacity;
uniform float u_drawT;     // 0 to 1, animated arc
varying vec2 vUv;

void main() {
  vec2 p = (vUv - 0.5) * u_quadSize;
  float dist = abs(length(p) - u_radius);
  float aa = fwidth(length(p)) * 1.2;
  float alpha = 1.0 - smoothstep(u_stroke - aa, u_stroke + aa, dist);
  if (alpha < 0.001) discard;
  
  float TWO_PI = 6.2831853;
  float raw = atan(-p.x, -p.y);
  float norm = raw < 0.0 ? raw + TWO_PI : raw;
  float arcEnd = u_drawT * TWO_PI;
  if (norm > arcEnd) discard;
  
  gl_FragColor = vec4(u_color, alpha * u_opacity);
}
```

**Ring parameters:**
- Color: `#FF591D` (Shopify orange)
- Stroke width: `0.8`
- Quad size: `(radius + 0.8 * 3) * 2`
- Depth: `-200`

### 7.2 Tick Marks (221 Instanced Capsules)

Tick marks are rendered using `THREE.InstancedMesh` with 221 instances arranged around the ring:

```javascript
const tickCount = 221; // Ei
const tickHeight = radius * 0.014; // Hv
const tickWidth = radius * 0.003; // Wv

// Each tick is a PlaneGeometry(tickWidth, tickHeight) with rounded caps
// Positioned at: sin(i/221 * 2PI) * (radius - radius*0.028), cos(i/221 * 2PI) * ...
// Rotated to face outward from center
```

**Tick shader (instanced):**
```glsl
// Vertex
attribute float aOpacity;
varying float vOpacity;
varying vec2 vUv;
void main() {
  vOpacity = aOpacity;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}

// Fragment
uniform vec3 u_color;  // #E5E5E5 (15066597 decimal)
varying float vOpacity;
varying vec2 vUv;
void main() {
  if (vOpacity < 0.005) discard;
  float aspect = 0.003 / 0.014; // Wv / Hv
  float r = 0.5 * aspect;
  vec2 p = vec2(vUv.x - 0.5, (vUv.y - 0.5) * (1.0 / aspect));
  float capY = 0.5 / aspect - 0.5;
  float dy = max(abs(p.y) - capY, 0.0);
  float d = length(vec2(p.x, dy));
  if (d > 0.5) discard;
  gl_FragColor = vec4(u_color, vOpacity);
}
```

### 7.3 Clock Hand

The clock hand is an extruded SVG path (the Shopify arrow shape) with a 3D bevel:

```javascript
// SVG path for the clock hand
const handSVG = `<svg width="652" height="793" viewBox="0 0 652 793">
  <path d="M637.211 19.6278C639.609 16.8044 643.824 16.417 646.697 18.7561
    C649.606 21.1253 650.049 25.4021 647.688 28.3178L40.305 778.219
    C34.4578 785.438 24.0107 786.878 16.4279 781.511L15.7123 781.005
    C7.26801 775.027 5.76435 763.096 12.4616 755.211L637.211 19.6278Z" 
    fill="#FF591D"/>
</svg>`;

// Extrude with bevel
const extrudeSettings = {
  depth: halfWidth,
  bevelEnabled: true,
  bevelThickness: halfWidth * 0.45,
  bevelSize: halfWidth * 0.45,
  bevelSegments: 16,
  curveSegments: 200
};
```

### 7.4 Clock Disc

A circle extruded from SVG:

```javascript
const discSVG = `<svg width="111" height="111" viewBox="0 0 111 111">
  <circle cx="55.2841" cy="55.2838" r="55.2691" fill="#FF591D"/>
</svg>`;
```

### 7.5 Clock Material (Shared for Hand and Disc)

```javascript
const clockMaterial = new THREE.ShaderMaterial({
  uniforms: {
    u_color: { value: new THREE.Color(0xFF591D) },
    u_lightDir: { value: new THREE.Vector3(2.9, 5, 0).normalize() },
    u_ambient: { value: 0.4 },
    u_specular: { value: 1.0 },
    u_specPower: { value: 32 },
    u_rimStr: { value: 0.3 },
    u_rimPower: { value: 3.0 }
  },
  // See shader #60/#61 for vertex/fragment
});
```

---

## 8. Shape Materials

### 8.1 Sphere/Circle Material (View-Normal Shading)

Used for circles and spheres:

```glsl
// Vertex (#62)
varying vec3 vViewNormal;
void main() {
  vViewNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment (#63)
precision highp float;
uniform vec3 u_color;
uniform float u_spreadT;
varying vec3 vViewNormal;

void main() {
  float facing = max(0.0, vViewNormal.z);
  float lum = u_color.r * 0.299 + u_color.g * 0.587 + u_color.b * 0.114;
  vec3 shadedColor;
  if (lum < 0.05) {
    // Dark colors get rim lighting
    vec3 sideCol = vec3(0.15);
    vec3 topCol  = vec3(0.25);
    vec3 rimCol  = mix(sideCol, topCol, facing);
    shadedColor  = mix(u_color, rimCol, 1.0 - facing);
  } else {
    float shade = 0.7 + 0.3 * facing;
    shadedColor = u_color * shade;
  }
  vec3 finalColor = mix(u_color, shadedColor, u_spreadT);
  gl_FragColor = vec4(finalColor, 1.0);
}
```

### 8.2 Pill/Capsule Material (Rounded Rectangle with Corner Radius)

```glsl
// Fragment (#65)
precision highp float;
uniform vec3 u_color;
uniform float u_cornerRadius;
uniform float u_aspect;
uniform float u_alpha;
uniform vec3 u_bgColor;
uniform sampler2D u_bgMap;
uniform float u_hasBgMap;
varying vec2 vUv;

void main() {
  vec3 col = u_color;
  if (u_hasBgMap > 0.5) {
    col = texture2D(u_bgMap, vUv).rgb;
  }
  if (u_cornerRadius > 0.0) {
    vec2 size = vec2(1.0, u_aspect);
    vec2 center = size * 0.5;
    float r = u_cornerRadius;
    vec2 p = abs(vUv * size - center) - (center - r);
    float d = length(max(p, 0.0)) - r;
    float aa = fwidth(d);
    float edge = 1.0 - smoothstep(-aa, aa, d);
    if (edge < 0.005) discard;
    if (u_alpha > 0.999) {
      col = mix(u_bgColor, col, edge);
    } else if (edge < 0.5) {
      discard;
    }
  }
  gl_FragColor = vec4(col, u_alpha);
}
```

---

## 9. Image/Photo Planes

### 9.1 Photo Slice Shader

Images are rendered with a "datamosh" glitch effect during spread:

```glsl
// Fragment (#59) - Key excerpt
precision highp float;
uniform sampler2D u_map;
uniform float u_sliceLow;
uniform float u_sliceHigh;
uniform float u_spreadT;
uniform float u_time;
uniform float u_sliceIdx;
uniform float u_cornerRadius;
uniform float u_aspect;
uniform vec2 u_uvScale;
uniform vec2 u_uvOffset;
uniform vec2 u_parallax;
uniform float u_parallaxZoom;
uniform float u_opacity;
varying vec2 vUv;

void main() {
  // Corner radius clipping (same SDF approach)
  // ...
  
  // Parallax zoom
  vec2 centered = vUv - 0.5;
  vec2 zoomed = centered / u_parallaxZoom + 0.5;
  vec2 texUv = zoomed * u_uvScale + u_uvOffset + u_parallax;
  
  // Datamosh effect (increases with spreadT)
  float moshAmount = u_spreadT * u_spreadT * 0.12;
  // Block shift + band shift + chroma shift
  // ... (see full shader in extracted code)
  
  // Luminance-based slice visibility
  float bandAlpha = smoothstep(u_sliceLow - 0.05, u_sliceLow + 0.02, luma)
                  * (1.0 - smoothstep(u_sliceHigh - 0.02, u_sliceHigh + 0.05, luma));
  float alpha = mix(1.0, bandAlpha, u_spreadT) * texAlpha;
  
  gl_FragColor = vec4(col, alpha);
}
```

---

## 10. Post-Processing Pipeline

### 10.1 Pipeline Order

1. **RenderPass** - Renders the main scene to a render target
2. **ElectricPass** - Adds edge-detection based electric glow effect
3. **RevealMaskPass** - Handles the circular wipe reveal animation
4. **ChromaticPass** - Chromatic aberration, barrel warp, vignette, and radial blur

### 10.2 Electric Pass Fragment Shader

```glsl
precision highp float;
uniform sampler2D tDiffuse;
uniform float u_progress;
uniform float u_darkness;
uniform float u_time;
uniform float u_aspect;
uniform vec2 u_resolution;
uniform float u_reverse;
uniform float u_bandWidth;
varying vec2 vUv;

// FBM noise functions (hash, noise, fbm with 3 octaves)
// ... (see qS function output)

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

float crossEdge(vec2 uv, vec2 texel) {
  float t = luma(texture2D(tDiffuse, uv + vec2(0.0, texel.y)).rgb);
  float b = luma(texture2D(tDiffuse, uv - vec2(0.0, texel.y)).rgb);
  float r = luma(texture2D(tDiffuse, uv + vec2(texel.x, 0.0)).rgb);
  float l = luma(texture2D(tDiffuse, uv - vec2(texel.x, 0.0)).rgb);
  return length(vec2(r - l, t - b));
}

void main() {
  vec4 texel = texture2D(tDiffuse, vUv);
  vec2 px = 1.0 / u_resolution;
  float edge = crossEdge(vUv, px);
  float edge2 = crossEdge(vUv, px * 2.0);
  edge = max(edge, edge2);
  edge = smoothstep(0.005, 0.04, edge);
  
  // Circular wipe with noise distortion
  vec2 center = vUv - 0.5;
  center.x *= u_aspect;
  float rawDist = length(center);
  float maxDist = 0.5 * sqrt(u_aspect * u_aspect + 1.0);
  float angle = center.y / (abs(center.x) + 0.0001);
  float warpNoise = fbm(vec2(angle * 2.0, rawDist * 3.0) + u_time * 2.5);
  float dist = rawDist + (warpNoise - 0.5) * 0.25;
  
  float wipeT = mix(u_progress, 1.0 - u_progress, u_reverse);
  float collapseT = mix(wipeT, wipeT * wipeT * wipeT, u_reverse);
  float wipeRadius = collapseT * (maxDist + 0.4);
  float wipeMask = smoothstep(wipeRadius, wipeRadius - 0.4, dist);
  
  // Electric crackling
  float crackle = fbm(vUv * 12.0 + u_time * 2.0);
  float electricMask = 0.5 + 0.5 * crackle;
  
  float distFromFront = abs(dist - wipeRadius);
  float bw2 = u_bandWidth * u_bandWidth * 0.15;
  float bloomBand = exp(-distFromFront * distFromFront / bw2);
  
  float fadeOut = 1.0 - smoothstep(0.6, 0.9, u_progress);
  float electricIntensity = exp(-pow(u_progress - 0.35, 2.0) / 0.08) * fadeOut;
  electricIntensity *= mix(1.0, collapseT, u_reverse);
  
  float activeEdge = edge * wipeMask;
  float behindFactor = smoothstep(wipeRadius - 0.35, wipeRadius - 0.05, dist);
  float behindGlow = activeEdge * (1.0 - behindFactor) * 4.0 * electricIntensity;
  float frontGlow = activeEdge * bloomBand * electricMask
                  * (60.0 + 20.0 * sin(u_time * 8.0 + dist * 25.0));
  float sweepRing = bloomBand * 5.0 * electricMask
                  * (8.0 + 4.0 * sin(u_time * 6.0 + dist * 20.0));
  
  const vec3 hotWhite = vec3(1.0, 1.0, 1.0);
  const vec3 sweepColor = vec3(0.5, 0.7, 1.0);
  
  // Preserve photos and colored elements
  float texMax = max(texel.r, max(texel.g, texel.b));
  float texMin = min(texel.r, min(texel.g, texel.b));
  float saturation = texMax > 0.01 ? (texMax - texMin) / texMax : 0.0;
  float isPhoto = smoothstep(0.20, 0.35, saturation) * (1.0 - smoothstep(0.85, 0.95, saturation));
  float isCardBg = step(0.4, texel.a) * step(texel.a, 0.6);
  float isSolidColor = smoothstep(0.85, 0.95, saturation);
  float preserve = max(max(isPhoto, isCardBg), isSolidColor);
  
  float darkenAmount = u_darkness * (1.0 - preserve);
  vec3 darkScene = mix(texel.rgb, vec3(0.0), darkenAmount);
  
  vec3 result = darkScene;
  float bloomMask = 1.0 - isPhoto;
  result += vec3(0.6, 0.8, 1.0) * behindGlow * bloomMask;
  result += hotWhite * frontGlow * electricIntensity * bloomMask;
  result += sweepColor * sweepRing * electricIntensity * bloomMask;
  result = min(result, vec3(5.0));
  
  gl_FragColor = vec4(result, 1.0);
}
```

### 10.3 Chromatic Aberration & Vignette Shader

(See Section 5.2 of the previous spec - included here for completeness)

```glsl
precision highp float;
uniform sampler2D tDiffuse;
uniform float u_spreadT;
uniform float u_revealT;
uniform float u_blurStrength;
uniform float u_blurEdgeStart;
uniform float u_vignetteDark;
uniform float u_vignetteStart;
uniform float u_vignetteColorShift;
uniform float u_chromStrength;
uniform float u_barrelWarp;
uniform float u_warpCenter;
varying vec2 vUv;

#define SAMPLES 12

void main() {
  vec2 center = vec2(0.5);
  vec2 delta = vUv - center;
  float normDist = length(delta * 2.0);

  float spreadPulse = smoothstep(0.0, 0.35, u_spreadT) 
                    * (1.0 - smoothstep(0.45, 0.95, u_spreadT));
  float revealPulse = smoothstep(0.0, 0.4, u_revealT) 
                    * (1.0 - smoothstep(0.7, 1.0, u_revealT));
  float warpPulse = max(spreadPulse, revealPulse);

  float warpT = u_barrelWarp * warpPulse;
  vec2 warpedUv = vUv;
  if (warpT > 0.0001) {
    float r2 = dot(delta, delta) * 4.0;
    warpedUv = center + delta * (1.0 - warpT * (r2 + u_warpCenter));
  }

  float blurMask = smoothstep(u_blurEdgeStart, 1.0, normDist);
  float blurAmount = blurMask * u_blurStrength * u_spreadT;

  float vigMask = smoothstep(u_vignetteStart, 1.0, normDist);
  float vigAlpha = vigMask * u_vignetteDark * u_spreadT;
  vec3 vigColor = vec3(1.0 - smoothstep(u_vignetteColorShift, 1.0, u_spreadT));

  float chromT = u_chromStrength * warpPulse * normDist;
  vec2 chromDir = delta * (chromT / (normDist * 0.5 + 0.0001));

  if (blurAmount < 0.0001 && chromT < 0.0001) {
    vec3 col = texture2D(tDiffuse, warpedUv).rgb;
    col = mix(col, vigColor, vigAlpha);
    gl_FragColor = vec4(col, 1.0);
    return;
  }

  if (blurAmount < 0.0001) {
    float r = texture2D(tDiffuse, warpedUv + chromDir).r;
    float g = texture2D(tDiffuse, warpedUv).g;
    float b = texture2D(tDiffuse, warpedUv - chromDir).b;
    vec3 col = mix(vec3(r, g, b), vigColor, vigAlpha);
    gl_FragColor = vec4(col, 1.0);
    return;
  }

  vec2 blurDir = delta * blurAmount;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < SAMPLES; i++) {
    float t = float(i) / float(SAMPLES - 1);
    vec2 sampleUv = warpedUv + blurDir * t;
    acc.r += texture2D(tDiffuse, sampleUv + chromDir).r;
    acc.g += texture2D(tDiffuse, sampleUv).g;
    acc.b += texture2D(tDiffuse, sampleUv - chromDir).b;
  }
  vec3 col = acc / float(SAMPLES);
  col = mix(col, vigColor, vigAlpha);
  gl_FragColor = vec4(col, 1.0);
}
```

### 10.4 Reveal Mask Shader

The reveal mask handles the circular wipe animation with FBM noise distortion:

```glsl
precision highp float;
uniform sampler2D tDiffuse;
uniform float u_revealT;
uniform float u_time;
uniform float u_aspect;
uniform vec2 u_center;
uniform float u_tileActive;
uniform float u_tileSeed;
uniform float u_tileProgress;
uniform float u_tileDensity;
varying vec2 vUv;

// FBM noise (2 octaves)
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 2; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  float maxDist = 0.5 * sqrt(u_aspect * u_aspect + 1.0);

  if (u_tileActive > 0.5) {
    // Tile-based reveal (used for initial page load)
    // ... (multi-scale tile lookup with hash-based timing)
  } else {
    // Circular wipe reveal
    vec2 center = vUv - u_center;
    center.x *= u_aspect;
    float rawDist = length(center);
    float angle = center.y / (abs(center.x) + 0.0001);
    float warpNoise = fbm(vec2(angle * 2.0, rawDist * 3.0) + u_time * 2.5);
    float dist = rawDist + (warpNoise - 0.5) * 0.2;
    float wipeRadius = u_revealT * (maxDist + 0.2);
    float mask = smoothstep(wipeRadius, wipeRadius - 0.15, dist);
    gl_FragColor = vec4(color.rgb * mask, mask);
  }
}
```

---

## 11. Floating Capsule (Bottom-Right Corner)

The floating capsule is a separate mini-scene rendered in its own viewport:

### 11.1 Geometry

```javascript
const capsuleRadius = 0.54;  // i_
const capsuleLength = 1.35;  // sF
const capsule = new THREE.CapsuleGeometry(capsuleRadius, capsuleLength, 32, 48);
```

### 11.2 Material (Two-Tone PBR with Split)

```javascript
const material = new THREE.MeshPhysicalMaterial({
  color: colorA,
  roughness: 0.35,
  metalness: 0.55,
  envMapIntensity: 1,
  side: THREE.DoubleSide,
  fog: false,
  toneMapped: true
});

// Custom shader injection for two-tone split
material.onBeforeCompile = (shader) => {
  shader.uniforms.u_colorB = { value: new THREE.Color(colorB) };
  shader.vertexShader = `varying float vLocalY;\n` + 
    shader.vertexShader.replace('#include <begin_vertex>', 
      `#include <begin_vertex>\nvLocalY = position.y;`);
  shader.fragmentShader = `uniform vec3 u_colorB;\nvarying float vLocalY;\n` +
    shader.fragmentShader.replace('#include <color_fragment>',
      `#include <color_fragment>
       float splitMask = smoothstep(-0.04, 0.04, vLocalY);
       diffuseColor.rgb = mix(u_colorB, diffuseColor.rgb, splitMask);`);
};
```

### 11.3 Color Palette (16 Pairs)

The capsule cycles through these color pairs:

| Name | Background (A) | Foreground (B) |
|------|----------------|----------------|
| grey/light-grey | `#4E4E4E` | `#CCCCCC` |
| sand/forest-green | `#DFD5CB` | `#1C3B36` |
| red/pink | `#FE432A` | `#FFAAC7` |
| maroon/red | `#4F2730` | `#FE432A` |
| royal-blue/pink | `#0225AC` | `#FFAAC7` |
| lime-green/forest-green | `#BFFF04` | `#1C3B36` |
| pale-blue/maroon | `#B8C4DB` | `#4F2730` |
| forest-green/neon-green | `#1C3B36` | `#6BFF91` |
| sand/red | `#DFD5CB` | `#FE432A` |
| maroon/pink | `#4F2730` | `#FFAAC7` |
| violet/red | `#6B3A99` | `#FE432A` |
| violet/pink | `#6B3A99` | `#FFAAC7` |
| pink/red | `#FFAAC7` | `#FE432A` |
| red/pale-blue | `#FE432A` | `#B8C4DB` |
| royal-blue/red | `#0225AC` | `#FE432A` |
| neon-green/forest-green | `#6BFF91` | `#1C3B36` |

### 11.4 Capsule Rings

Two transparent rings orbit the capsule:

```javascript
const ringGeometry = new THREE.TorusGeometry(capsuleRadius + 0.001, 0.0025, 8, 64);
ringGeometry.rotateX(Math.PI / 2);

// Bottom ring
const bottomRing = new THREE.MeshPhysicalMaterial({
  color: colorA.clone().multiplyScalar(0.35),
  roughness: 0.4, metalness: 0.5,
  envMapIntensity: 1.2,
  transparent: true, opacity: 0.35,
  depthWrite: false
});

// Top ring
const topRing = new THREE.MeshPhysicalMaterial({
  color: colorA.clone().lerp(someColor, 0.55),
  roughness: 0.2, metalness: 0.85,
  envMapIntensity: 2.8,
  transparent: true, opacity: 0.3,
  depthWrite: false
});
```

---

## 12. Alpha Video Plane

A video plane positioned in the scene that plays alpha-composited videos:

```javascript
const videoSize = 480 * Fr; // Nb * Fr
const videoPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(videoSize, videoSize),
  new THREE.ShaderMaterial({
    uniforms: {
      u_map: { value: new THREE.Texture() },
      u_opacity: { value: 1 },
      u_puffT: { value: 0 }
    },
    // Shader #66/#67
    transparent: true,
    depthWrite: true,
    depthTest: true,
    fog: false
  })
);
videoPlane.position.set(650 * Fr, 0, sceneDepth * 0.9);
```

---

## 13. DOM-to-3D Layout Mapping

### 13.1 Layout Parsing

The site reads `data-layout` attributes from DOM elements and converts them to 3D positions:

```javascript
function parseLayouts(container) {
  const elements = container.querySelectorAll('[data-layout]');
  const Fr = 0.001036; // Pixel-to-world factor
  const halfW = window.innerWidth / 2;
  const halfH = window.innerHeight / 2;
  
  return Array.from(elements).map(el => {
    const rect = el.getBoundingClientRect();
    const scrollY = window.scrollY;
    
    return {
      type: el.dataset.layout,
      id: el.dataset.id,
      depth: parseInt(el.dataset.depth || 0),
      worldX: (rect.left + rect.width / 2 - halfW) * Fr,
      worldZ: (rect.top + scrollY + rect.height / 2 - halfH) * Fr,
      worldWidth: rect.width * Fr,
      worldHeight: rect.height * Fr,
      // Additional attributes...
    };
  });
}
```

### 13.2 Depth Values from shopify.design

| Element ID | Type | Depth | Description |
|------------|------|-------|-------------|
| site-logo | image | -300 | Shopify logo |
| hero-headline-1 | text | -200 | "Make the" |
| hero-headline-2 | text | -200 | "new normal" |
| hero-tagline | text | -300 | Tagline text |
| cd-ring | shape | -200 | Clock ring |
| hero-renaissance-img | image | -545 | Renaissance image |
| hero-racing-img | image | -510 | Racing image |
| hero-tinker-img | image | -548 | Tinker image |
| hero-sidekick-img | image | -340 | Sidekick image |
| hero-artifact-img | image | -442 | Artifact image |
| manifesto-headline | text | -300 | Manifesto section |
| carousel | carousel | -385 | Video carousel |
| remote-studio-img | image | -200 | Remote studio |
| footer-btn-label-pill | shape | -400 | Footer button |

---

## 14. Critical Differences: Local vs. shopify.design

| Feature | shopify.design | localhost:3456 | Fix Required |
|---------|---------------|----------------|--------------|
| Background | White (#FFFFFF) | Black (#000000) | Change scene.background and fog color |
| Fog | White linear fog, animated | Missing or wrong | Implement THREE.Fog with animated near/far |
| Dot Grid | 20 layers, dense, animated glow | Sparse, static | Rebuild with custom shaders from Section 5 |
| Dot Glow | Cell-noise sweep effect | Missing | Add glow layers with additive blending |
| Grid Lines | Animated points along grid | Thin static lines | Replace with Points + custom shader |
| Post-Processing | 3-pass pipeline | None | Add EffectComposer with all passes |
| Electric Pass | Edge-detect + glow wipe | None | Implement from Section 10.2 |
| Chromatic Aberration | Barrel warp + chroma split | None | Implement from Section 10.3 |
| Reveal Mask | FBM-distorted circular wipe | None | Implement from Section 10.4 |
| Camera FOV | Dynamic based on window height | Possibly static | Use calculateFOV() function |
| Camera Up | (0, 0, -1) | Possibly (0, 1, 0) | Set camera.up correctly |
| Scroll Physics | Spring (stiffness=400, damping=28) | Unknown | Implement spring system |
| Mouse Parallax | Smooth with lookSpeed=6 | Unknown | Implement parallax system |
| Shape Materials | Custom view-normal shading | Unknown | Use shaders from Section 8 |
| Clock Ring | SDF circle with animated arc | Unknown | Implement from Section 7 |
| Clock Ticks | 221 instanced capsules | Unknown | Implement from Section 7.2 |
| Floating Capsule | Two-tone PBR with rings | Unknown | Implement from Section 11 |
| Photo Slicing | Luminance-band datamosh | Unknown | Implement from Section 9 |

---

## 15. Implementation Priority Order

For the coding agent, the recommended implementation order (highest visual impact first):

1. **Background + Fog** (Section 3.2) - Fixes the most obvious visual difference
2. **Camera System** (Section 3.3) - Ensures correct perspective and DOM alignment
3. **Dot Grid System** (Section 5) - The core visual identity of the 3D world
4. **Grid Lines** (Section 6) - Completes the grid structure
5. **Post-Processing: Chromatic Pass** (Section 10.3) - Adds visual polish
6. **Post-Processing: Electric Pass** (Section 10.2) - Adds the spread transition effect
7. **Post-Processing: Reveal Mask** (Section 10.4) - Adds the entry animation
8. **Scroll Spring Physics** (Section 4.1) - Smooth scroll feel
9. **Mouse Parallax** (Section 4.3) - Interactive depth
10. **Clock Components** (Section 7) - Ring, ticks, hand, disc
11. **Shape Materials** (Section 8) - Correct shading on shapes
12. **Photo Slicing** (Section 9) - Image effects during spread
13. **Floating Capsule** (Section 11) - Corner decoration
14. **Alpha Video** (Section 12) - Video plane

---

*This specification was generated by analyzing the minified source code of shopify.design (Three.js r182, accessed May 11, 2026) and comparing it with the local implementation at localhost:3456.*
