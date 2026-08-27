# Shopify.design Bundle Analysis

**Source:** `https://cdn.shopify.com/oxygen-v2/53091/115564/237336/3392373/assets/_index-DqiyU7W1.js`
**Size:** 1,258,322 bytes (~1.2MB), 5280 lines (minified)
**Framework:** React (via Remix/Hydrogen on Shopify Oxygen), Three.js r182, Troika-three-text, GSAP

---

## 1. Core Constants

```js
const lc = 800;           // Camera Y (height above ground plane)
const Dn = 0;             // Base Y position (ground plane)
const C1 = 50;            // FOV degrees (base)
const R1 = 900;           // Reference viewport height for FOV calc
const MD = 75;            // FOV in 3D spread mode
const Fr = 2 * lc * Math.tan(C1 * Math.PI / 180 / 2) / R1;
//   Fr ≈ 0.8284 — world-units per pixel (the DOM→world scale factor)

const wD = Math.PI / 3;   // Vertical look sensitivity (≈1.047 radians, 60°)
const ED = 800;            // Horizontal look sensitivity
const AD = 500;            // Orbit radius
const P1 = 180;            // Image slice spread height
const D1 = 0.15;           // Grid density base (xzDensity lerp start)
const LD = 0.15;           // (same value, possibly duplicate)
const ux = 0.15;           // Mouse lerp factor (smoothing)

const CD = -200;           // Default photo depth offset
const RD = -100;           // Shape depth
const PD = -50;            // Clock shape depth
const DD = 0;              // Pill shape depth
const Qr = 0.001;          // spreadT epsilon (near-zero threshold)

const ja = 2400;           // Base culling distance (half-range)
const FD = 5000;           // Extended culling for 3D mode
const L1 = 0.93;           // Modal scene scale

// Spring physics for scroll-Z:
const _v = { stiffness: 400, damping: 28 };   // Scroll spring
const ID = { stiffness: 180, damping: 12 };   // Cube spin spring
```

---

## 2. Camera Position Calculation

The camera is top-down (Y-up), looking down at the XZ plane. In the animation loop function `_()`:

```js
function _() {
  // Mouse smoothing (lerp toward target)
  n.smoothMouseX += (n.mouseX - n.smoothMouseX) * ux;    // ux = 0.15
  n.smoothMouseY += (n.mouseY - n.smoothMouseY) * ux;

  const L = n.spreadT;

  // Target look offsets (scale by spreadT so no look when flat)
  const C = n.smoothMouseX * ED * n.scale * L * n.lookScale;  // horizontal target
  const I = n.smoothMouseY * wD * L * n.lookScale;            // vertical target

  // Apply look with lag (lookSpeed = 6 in config)
  if (n.cameraLocked || ss) {
    n.lookPanX = 0;
    n.lookPitch = 0;
  } else {
    n.lookPanX += (C - n.lookPanX) / r.lookSpeed;   // lookSpeed=6
    n.lookPitch += (I - n.lookPitch) / r.lookSpeed;
  }

  // Decay look when transitioning out (targetProgress===0)
  if (n.targetProgress === 0) {
    const B = 1 - n.spreadT;
    const J = 1 - Math.min(PB, DB + B * LB);  // PB=0.28, DB=0.04, LB=0.2
    n.lookPanX *= J;
    n.lookPitch *= J;
    n.smoothMouseX *= J;
    n.smoothMouseY *= J;
  }

  // Orbit calculation
  const F = AD * n.scale;          // F = 500 * scale (orbit radius)
  const V = n.lookPanX;            // horizontal pan (lookAt X)
  const G = F * Math.sin(Math.abs(n.lookPitch)) * Math.sign(n.lookPitch);
  // G = vertical orbit offset for lookAt Z

  f = lc * n.scale;                // camera height = 800 * scale
  const X = f - F * Math.cos(n.lookPitch);
  // X = adjusted lookAt Y (drops as pitch increases)

  // Scroll-Z with spring physics
  if (Jh) {  // Jh = isMobile flag
    n.scrollZTarget = n.frameScrollTop * Fr * n.scale;
    n.scrollZ = n.scrollZTarget;
    n.scrollZVel = 0;
  } else {
    const B = 0.016666666666666666;  // 1/60
    n.scrollZVel += (_v.stiffness * (n.scrollZTarget - n.scrollZ) - _v.damping * n.scrollZVel) * B;
    n.scrollZ += n.scrollZVel * B;
  }

  l = n.scrollZ;

  // Snap scrollZ for non-3D mode (prevent sub-pixel jitter)
  const k = Jh || n.extrudedTextActive ? l : Math.round(l);

  // SET CAMERA POSITION AND LOOKAT
  e.position.set(0, f, k);         // camera at (0, 800, scrollZ)
  e.up.set(0, 0, -1);              // up = -Z (so X=right, Z=forward/into screen)
  e.lookAt(V, X, G + k);           // lookAt = (panX, adjustedY, pitchOffset + scrollZ)
  n.cameraZ = k;

  // FOV interpolation: flat FOV → 3D FOV
  const j = _f(window.innerHeight);              // viewport-based FOV
  const Y = Mt.lerp(j, MD, n.spreadT);           // MD = 75 (wider in 3D)
  e.fov = UB(Y, n.modalSceneScale);              // UB adjusts for modal scale
  e.updateProjectionMatrix();

  // Projection matrix blending: orthographic ↔ perspective
  if (n.spreadT > Qr) {
    fx.copy(e.projectionMatrix);
    Bv(e, f, Qo);                                // Bv = makeOrthographic
    const B = n.spreadT * n.spreadT * n.spreadT; // cubic ease
    AL(Qo, fx, B, Qh);                           // AL = matrix lerp (ortho→persp)
    e.projectionMatrix.copy(Qh);
    e.projectionMatrixInverse.copy(Qh).invert();
  } else {
    // Pure orthographic when spreadT ≈ 0
    Bv(e, f, Qo);
    e.projectionMatrix.copy(Qo);
    e.projectionMatrixInverse.copy(Qo).invert();
  }
}
```

**Key insight:** The camera NEVER moves on X. It always stays at `(0, 800, scrollZ)`. The orbit effect is achieved entirely by moving the `lookAt` target. The `lookPanX` moves the lookAt on X, and `lookPitch` creates a vertical orbit by adjusting both the lookAt Y (`f - AD*cos(pitch)`) and lookAt Z offset (`AD*sin(abs(pitch))*sign(pitch)`).

---

## 3. Spread Transition / State Machine

```js
// State:
//   spreadProgress: 0..1 raw animated value
//   spreadT: final spread value (may be overridden by tile intro)
//   transitionStart: performance.now() when transition began
//   transitionFrom: spreadProgress at transition start
//   targetProgress: 0 or 1
//   isPressed: true during mousedown hold
//   isLocked: true for toggled 3D mode

// Transition update (function x):
function x() {
  const L = n.targetProgress === 1;
  const C = L ? r.duration : r.durationOut;  // 700ms in, 600ms out
  const I = L ? easeInOutCubic : easeInOutQuint;

  if (C > 0 && n.transitionStart > 0) {
    const V = o - n.transitionStart;
    const G = Math.min(V / C, 1);
    n.spreadProgress = n.transitionFrom + (n.targetProgress - n.transitionFrom) * I(G);
    n.spreadProgress = Math.max(0, Math.min(1, n.spreadProgress));
  }

  n.spreadT = n.spreadProgress;

  // Tile intro override (site load animation)
  if (ss) {
    n.spreadT = tileProgress * tileSpread;
  }
}
```

**Press (hold) handler:**
```js
const v = () => {
  n.isPressed = true;
  n.transitionFrom = n.spreadProgress;
  n.targetProgress = 1;
  n.transitionStart = performance.now();
};
```

**Release handler:**
```js
const x = (fromTouch = false) => {
  n.isPressed = false;
  if (fromTouch) { n.mouseX = 0; n.mouseY = 0; }
  n.transitionFrom = n.spreadProgress;
  n.targetProgress = 0;
  n.transitionStart = performance.now();
};
```

**Toggle (lock) handler:**
```js
const w = ({ instant, studioOverlay, locked }) => {
  const Z = typeof locked === "boolean" ? locked : !n.isLocked;
  n.isLocked = Z;
  n.isPressed = Z;
  n.mouseX = 0;
  n.mouseY = 0;
  if (Z) {
    n.smoothMouseX = 0; n.smoothMouseY = 0;
    n.lookPanX = 0; n.lookPitch = 0;
  }
  n.targetProgress = Z ? 1 : 0;
  if (instant) {
    n.spreadProgress = Z ? 1 : 0;
    n.spreadT = n.spreadProgress;
  } else {
    n.transitionFrom = n.spreadProgress;
    n.transitionStart = performance.now();
  }
};
```

---

## 4. DOM → World Space Coordinate Mapping

Function `hI(n)` scans all `[data-layout]` elements:

```js
const Fr = 2 * lc * Math.tan(C1 * Math.PI / 180 / 2) / R1;
// Fr ≈ 0.8284 world-units per pixel

function hI(container) {
  const e = window.innerWidth, t = window.innerHeight;
  const r = Fr;                    // scale factor
  const i = e / 2, s = t / 2;     // viewport center
  const a = window.scrollY;

  container.querySelectorAll("[data-layout]").forEach((el, idx) => {
    const rect = el.getBoundingClientRect();
    const worldX = (rect.left + rect.width/2 - viewportCenterX) * Fr;
    const worldZ = (rect.top + scrollY + rect.height/2 - viewportCenterY) * Fr;
    const worldWidth = rect.width * Fr;
    const worldHeight = rect.height * Fr;
    // ...
  });
}
```

**Coordinate system:**
- DOM X → World X (centered on viewport center)
- DOM Y (scrolled) → World Z
- Depth (data-depth attribute) → World Y (below camera)
- Camera looks DOWN from Y=800

---

## 5. Text Rendering

**Two text systems are used:**

### A. SDF Text (Troika-three-text) — for small/body text
```js
function wo({ text, fontSize, color, fontUrl, sdfGlyphSize = 128, ... }) {
  const h = new TroikaText();  // ib = troika Text class
  h.text = text;
  h.font = fontUrl;
  h.fontSize = fontSize;
  h.color = color;
  h.material = new MeshBasicMaterial({ fog: false, depthWrite: true, depthTest: true });
  h.sdfGlyphSize = sdfGlyphSize;  // 128 for high quality
  h.rotation.x = -Math.PI / 2;    // lay flat on XZ plane
  return h;
}
```

Per-frame SDF text update adds stroke effect based on spreadT:
```js
// Stroke increases with spreadT for a glowing outline effect
const u = Math.max(0, (n.spreadT - 0.02) / 0.98);
a.strokeWidth = u * a.fontSize * 0.015 * distanceFade;
a.strokeColor = 0xffffff;
a.strokeOpacity = u;
a.fillOpacity = 1 - u;
```

### B. Extruded 3D Text (Three.js ExtrudeGeometry) — for headlines
```js
function IS({ text, fontSize, extrudeDepth, color, yOffsetRange, noEdges }) {
  // Uses opentype.js to parse font glyphs
  const path = glyph.getPath(char, 0, 0, fontSize);
  const shapes = pathToShapes(path);
  const geometry = new ExtrudeGeometry(shapes, {
    depth: extrudeDepth,
    bevelEnabled: false,
    curveSegments: 10
  });
  const mesh = new Mesh(geometry, [frontMat, sideMat]);
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.y = -1;

  // Optional edge outlines
  if (!noEdges) {
    const edgeGeo = new EdgesGeometry(geometry, 20);
    const edgeLine = new LineSegments(edgeGeo, edgeMaterial);
  }
}
```

**Font files:**
- Headlines: `/fonts/AntiqueLegacy-Medium.woff.txt`
- Regular: `/fonts/AntiqueLegacy-Regular.woff.txt`
- Light: `/fonts/AntiqueLegacy-Light.woff.txt`
- Mono: `/fonts/FragmentMono-Regular.ttf.txt`

---

## 6. Image/Card Rendering

Images are rendered as **sliced planes** using `ShaderMaterial`:

```js
function TL(scene, sliceCount, photos) {
  for (const photo of photos) {
    const group = new Group();
    group.position.set(photo.x, 0.1, photo.z);

    for (let u = 0; u < sliceCount; u++) {
      const sliceLow = u / sliceCount;
      const sliceHigh = (u + 1) / sliceCount;

      const material = new ShaderMaterial({
        uniforms: {
          u_map: { value: null },       // texture
          u_sliceLow: { value: sliceLow },
          u_sliceHigh: { value: sliceHigh },
          u_spreadT: { value: 0 },
          u_time: { value: 0 },
          u_sliceIdx: { value: u },
          u_cornerRadius: { value: 0 },
          u_aspect: { value: 1 },
          u_uvScale: { value: new Vector2(1, 1) },
          u_uvOffset: { value: new Vector2(0, 0) },
          u_parallax: { value: new Vector2(0, 0) },
          u_parallaxZoom: { value: 1 },
          u_opacity: { value: 1 }
        },
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: DoubleSide,
        fog: false
      });

      const plane = new Mesh(new PlaneGeometry(1, 1), material);
      plane.geometry.rotateX(-Math.PI / 2);
      plane.renderOrder = inFront ? 100 + u : -10 + u;
      group.add(plane);
    }
    scene.add(group);
  }
}
```

**Image fragment shader** features:
- Luminance-based slicing: `bandAlpha = smoothstep(sliceLow, l) * (1 - smoothstep(sliceHigh, l))`
- Glitch/mosh effect keyed on `spreadT`: block noise + band shifting
- Chromatic aberration: separate R/G/B UV offsets
- Corner radius via SDF rounded rectangle
- Edge fade in 3D mode

Per-frame slice stacking (function `EB`):
```js
// Each slice is positioned at a different Y height based on spreadT
const sliceProgress = sliceIndex / (photoSlices - 1);
slice.position.y = inFront ? 0 : Math.pow(sliceProgress, exponent) * P1 * scale * spreadT;
// P1 = 180, so slices spread up to 180 units vertically
```

---

## 7. Post-Processing Pipeline

### Render pass order (function `bB` / render loop):
1. **Depth pre-pass** (colorMask off) for text/photos
2. **Main scene render** (dots, lines, shapes, clock)
3. **Electric edge pass** — procedural noise edge detection
4. **Chromatic aberration + radial blur + vignette** — full-screen pass
5. **Reveal mask** — tile-based reveal animation

### Chromatic/Blur Material (function `HB`):
```glsl
// Barrel warp (pulsed during transitions)
float warpT = u_barrelWarp * warpPulse;
vec2 warpedUv = center + delta * (1.0 - warpT * (r2 + u_warpCenter));

// Radial blur (edge-weighted)
float blurMask = smoothstep(u_blurEdgeStart, 1.0, normDist);
float blurAmount = blurMask * u_blurStrength * u_spreadT;

// Vignette
float vigMask = smoothstep(u_vignetteStart, 1.0, normDist);
float vigAlpha = vigMask * u_vignetteDark * u_spreadT;

// Chromatic aberration along radial direction
float chromT = u_chromStrength * warpPulse * normDist;
// Sample R/G/B at offset UVs
```

Config values:
```js
blurStrength: 0.15,
blurEdgeStart: 0.7,
vignetteDark: 0,          // disabled by default!
vignetteStart: 0.7,
vignetteColorShift: 0.8,
chromStrength: 0.024,
barrelWarp: 0.3,
warpCenter: 0.15,
bandWidth: 0.18
```

**No bloom or motion blur** — the glow effect on dots comes from the dot glow layer (separate point sprites with larger, softer particles), not from a bloom post-process.

---

## 8. Mouse/Touch Event Handling

### Mousedown (function `k`):
```js
const k = (event) => {
  if (event.button !== 0) return;
  // Check if clicking the floating capsule → lock/toggle 3D
  if ($o(n, event.clientX, event.clientY)) {
    n.cameraLocked = true;
    S();  // capsule click → toggle
    return;
  }
  // Check if clicking the manifesto area
  if (M(event.clientX, event.clientY)) {
    l = true;  // manifesto click flag
    return;
  }
  // Check if clicking a card
  if (!n.isLocked && !n.reducedMotion && n.spreadT < 0.01) {
    const card = px(n, event.clientX, event.clientY);
    if (card) { o = card; a = true; return; }
  }
  v();  // start press-hold transition
};
```

### Mouseup (function `j`):
```js
const j = () => {
  if (l) { l = false; nc("manifesto"); return; }  // open manifesto
  if (a && o) { openCardModal(o); return; }         // open card modal
  x(false);  // release press-hold
};
```

### Mousemove (function `T`):
```js
const T = (event) => {
  // Normalize mouse to -1..1
  n.mouseX = event.clientX / window.innerWidth * 2 - 1;
  n.mouseY = event.clientY / window.innerHeight * 2 - 1;
};
```

---

## 9. Scroll-Z in 3D Mode

```js
// Scroll event listener:
const p = () => {
  f.scrollZTarget = window.scrollY * Fr * f.scale;
};
window.addEventListener("scroll", p, { passive: true });

// In animation loop, spring physics smooths the transition:
const dt = 1/60;
n.scrollZVel += (_v.stiffness * (n.scrollZTarget - n.scrollZ) - _v.damping * n.scrollZVel) * dt;
n.scrollZ += n.scrollZVel * dt;
// stiffness=400, damping=28 → fast, slightly springy

// Camera Z is set to scrollZ:
camera.position.set(0, cameraHeight, scrollZ);
```

Elements track their DOM positions in real-time via `qm()`:
```js
function qm(layoutId, scrollZ, scale, useTop = false) {
  const el = document.querySelector(`[data-id="${layoutId}"]`);
  const rect = el.getBoundingClientRect();
  const domY = useTop ? rect.top : rect.top + rect.height / 2;
  return scrollZ + (domY - window.innerHeight / 2) * Fr * scale;
}
```

---

## 10. Dot Grid System

Multiple layers of point sprites at different Y levels:

```glsl
// Vertex shader (grid dots):
vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
float perspScale = 300.0 / -mvPosition.z;
float scale = mix(1.0, perspScale, u_sizeAttenuation);
gl_PointSize = a_size * 2.0 * scale * u_dotScale;

// Fragment shader (glow dots):
float core = 1.0 - smoothstep(0.35 - fw, 0.35 + fw, dist);
float halo = exp(-dist * dist * 8.0) * 0.4;
float glow = core + halo;
// Animated energy waves:
float sweep1 = sin(wx * 3.0 + wz * 2.0 - u_time * 4.0);
```

Per-frame dot update:
```js
// Center dot layer visible, others hidden when spreadT near 0
// Dot density increases with spreadT
const V = Mt.lerp(D1, 1, spreadT);  // D1=0.15 → 1.0
dotMaterial.uniforms.u_xzDensity.value = V;
dotMaterial.uniforms.u_dotScale.value = Mt.lerp(1, CB, spreadT);
// CB = 3.5/7.5 ≈ 0.467 (dots get smaller in 3D)
```

---

## 11. Scene Init Summary (function `ZB`)

```js
function ZB(canvas, config, qualityTier, layoutData) {
  const scene = new Scene();
  scene.background = new Color(backgroundColor);
  scene.fog = new Fog(0xffffff, 200, 2200);

  const camera = new PerspectiveCamera(
    _f(canvas.clientHeight),    // FOV from viewport height
    canvas.clientWidth / canvas.clientHeight,
    0.5,
    8000
  );
  camera.position.set(0, lc, 0);    // (0, 800, 0)
  camera.lookAt(0, 0, 0);

  const renderer = new WebGLRenderer({
    canvas, antialias: true, alpha: true, premultipliedAlpha: true
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;

  // Create all scene elements:
  // - dotLayers, dotGlowLayers, lineLayers (grid)
  // - shapeMeshes (pills, circles, clock parts)
  // - photoPlanes (sliced image cards)
  // - textMeshes (3D extruded text)
  // - sdfTextMeshes (troika SDF text)
  // - carousels (card carousel groups)
  // - glowQuads, floatingCapsule, clockModels, alphaVideo
  // - composer (post-processing)
}
```

---

## 12. Quality Tiers

```js
const qualityTiers = {
  high:   { layerCount: 20, photoSlices: 6, electricOctaves: 3, radialBlurSamples: 12, glowEnabled: true,  dprCap: 1.5, sdfGlyphSize: 128 },
  medium: { layerCount: 12, photoSlices: 4, electricOctaves: 2, radialBlurSamples: 8,  glowEnabled: true,  dprCap: 1.2, sdfGlyphSize: 128 },
  low:    { layerCount: 8,  photoSlices: 3, electricOctaves: 0, radialBlurSamples: 6,  glowEnabled: false, dprCap: 1.0, sdfGlyphSize: 128 }
};
```

---

## 13. Animation Loop (function `T`)

```js
function T() {
  n.animationId = requestAnimationFrame(T);
  if (n.contextLost) return;

  o = performance.now();
  if (isMobile) n.frameScrollTop = window.scrollY;

  x();   // update spreadProgress/spreadT
  _();   // update camera (mouse smoothing, orbit, scroll-Z, projection blend)

  if (n.spreadT > Qr || n.revealT < 1) {
    S();   // update text meshes
    b();   // update electric pass
    M();   // update dot layers
    w();   // update fog, culling bounds
    AB();  // update photo planes, carousels
    E();   // update shape meshes
  }

  // Clock, capsule, alpha video updates
  // Reveal mask update (y)
  // Render (bB)
}
```

---

## 14. Fog Settings

```js
// Fog adjusts with spreadT:
fog.near = lerp(200, 30, spreadT);      // closer near plane in 3D
fog.far = lerp(2200, 400, spreadT);     // much closer far plane in 3D
// Background goes black:
const I = lerp(1, 0, spreadT);          // 1=white, 0=black
fog.color.setScalar(I);
scene.background.setScalar(I);
```

---

## 15. Projection Blending (Ortho ↔ Perspective)

```js
// orthographic projection computed from camera height and FOV:
function Bv(camera, height, target) {
  const h = I1(height, camera.fov);  // visible height = 2*h*tan(fov/2)
  const w = h * camera.aspect;
  target.makeOrthographic(-w/2, w/2, h/2, -h/2, camera.near, camera.far);
}

// Matrix lerp between ortho and perspective:
function AL(orthoMat, perspMat, t, result) {
  for (let i = 0; i < 16; i++)
    result.elements[i] = orthoMat.elements[i] + (perspMat.elements[i] - orthoMat.elements[i]) * t;
}

// t = spreadT^3 (cubic easing for the projection blend)
```
