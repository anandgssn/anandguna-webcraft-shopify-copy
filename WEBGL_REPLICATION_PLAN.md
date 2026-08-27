# WebGL 3D Mode Replication Plan — Hybrid Faithful Approach

## Context
Replicating shopify.design's signature 3D interaction for the Web Craft hackathon. The original uses a custom Three.js engine with SDF text rendering, per-element depth projection, and WebGL-native materials. A 100% faithful SDF pipeline (~10K+ lines of custom shaders) is out of scope. This plan is a **hybrid approximation**: Three.js TextGeometry for large headlines, native materials for shapes/images/videos, and explicit omission of small body text in 3D mode (acknowledged fidelity tradeoff — CTA labels inside pills are excepted, see decision #7).

## Verified Constants (from original bundle `_index-DqiyU7W1.js`)

```
Camera:
  lc = 800                    // camera Z distance (world units)
  C1 = 50                     // FOV (degrees)
  R1 = 900                    // reference viewport height (px)
  Fr = 2 * lc * tan(FOV/2) / viewportHeight   // MUST be recomputed on resize
      at 900px viewport: Fr ≈ 0.829
      at 1080px viewport: Fr ≈ 0.691
      NEVER hardcode — always compute from current window.innerHeight

Orbit:
  wD = Math.PI / 3  ≈ 1.047  // vertical look sensitivity
  ED = 800                    // horizontal look sensitivity
  AD = 500                    // orbit radius
  ux = 0.15                   // mouse smooth lerp factor
  lookSpeed = 6               // look easing divisor
  PB = 0.28, DB = 0.04, LB = 0.2  // exit damping constants

Mouse mapping:
  mouseX = clientX / innerWidth * 2 - 1    // [-1, 1]
  mouseY = clientY / innerHeight * 2 - 1   // [-1, 1]
  smoothMouseX += (mouseX - smoothMouseX) * ux
  lookPanX += (smoothMouseX * ED * scale * spreadT * lookScale - lookPanX) / lookSpeed
  lookPitch += (smoothMouseY * wD * spreadT * lookScale - lookPitch) / lookSpeed

Camera position:
  cameraZ = lc * scale - AD * scale * cos(lookPitch)
  cameraX = lookPanX
  cameraY = AD * scale * sin(abs(lookPitch)) * sign(lookPitch)

Depth/Scene:
  ja = 2400                   // total scene depth
  kD = ja * 0.45 = 1080      // fade distance
  CD = -200, RD = -100, PD = -50, DD = 0  // named depth levels

Viewport:
  zD = 768                    // mobile breakpoint
  VD = 3840                   // max viewport width

Transition:
  stiffness: 400, damping: 28  // enter spring
  stiffness: 180, damping: 12  // exit spring
  Qr = 0.001                   // epsilon for "at rest" check
```

## Coordinate Mapping (canonical reference)

```
const Fr = 2 * lc * Math.tan((C1 * Math.PI / 180) / 2) / window.innerHeight;

// DOM rect → world position (center of element)
worldX =  (rect.left + rect.width / 2 - window.innerWidth / 2) * Fr;
worldY = -(rect.top + scrollY + rect.height / 2 - window.innerHeight / 2) * Fr;
worldZ = 0;   // flat; lerps to data-depth * Fr when spreadT → 1

// DOM rect → world plane size
worldWidth  = rect.width * Fr;
worldHeight = rect.height * Fr;
```

**Y is negated** because Three.js Y+ is up, but screen Y+ is down. Without this sign flip the entire scene renders upside-down.

## Scroll-Z Semantics (3D mode)

While TransitionController is in **ACTIVE** mode:
- `wheel` event listeners call `e.preventDefault()` (registered as `{ passive: false }`)
- Page scroll is fully locked — no DOM scrolling occurs
- `deltaY` is applied to camera/scene Z velocity only
- Damping: `scrollZVel *= 0.95` per frame
- On EXITING: restore normal scroll, snap page scrollY to the camera's world-Y mapped back to DOM pixels

## Resolved Decisions

| # | Decision | Resolution |
|---|----------|-----------|
| 1 | Text rendering | Large headlines only (hero, carousel, manifesto, remote): Three.js TextGeometry with AntiqueLegacy typeface JSON. **One `[data-layout="text"]` per visual line** — no automatic wrapping. Each line is a separate DOM element and a separate TextGeometry. Letter spacing: TextGeometry has no `letterSpacing` param — implement by creating one geometry per character and spacing them manually, OR accept approximate default spacing. If TextGeometry typography is visibly wrong, **fallback priority: (1) CanvasTexture raster text plane with `ctx.fillText()` using the loaded CSS font, (2) SVG path extraction only if text is already available as SVG paths (e.g. countdown digits). NEVER fall back to blank boxes.** **Hard prerequisite:** `public/fonts/AntiqueLegacy-Medium.typeface.json` must exist. If missing, Phase 2 halts with a console error AND a visible DOM banner. User converts via facetype.js — this is the immediate blocker. |
| 2 | Depth scale | `Fr = 2 * lc * tan(FOV/2) / viewportHeight` — recomputed on every resize. `data-depth` values are multiplied by `Fr` to get world Z. |
| 3 | Camera | FOV = 50°, camera Z = `lc * scale` = 800, near = 0.1, far = 5000. |
| 4 | Mobile 3D | Disabled on `pointer: coarse` devices. FloatingCapsule non-interactive on mobile (aria-disabled, no onClick). |
| 5 | Clock object assets | Try downloading from `shopify.design/clock/` paths. If not found: use AI-generated or static transparent PNG/WebP renders of similar 3D objects (NOT pure CSS gradients — those look too cheap alongside the rest of the site). Decorative — style match matters, exact object match does not. |
| 6 | Video textures | Use actual `<video>` DOM elements as `THREE.VideoTexture` source via `element.querySelector('video')`. Videos must remain `play()`-able during 3D mode — use `visibility: hidden` on parent (not `display: none`) so video stays in DOM. **Caveat:** some browsers throttle hidden media — test this before depending on live VideoTexture. If video is paused/blocked/throttled, fall back to poster image texture. |
| 7 | Body text / CTA labels | Small body text: omitted in 3D mode (accepted tradeoff). **Exception:** CTA button labels inside pill shapes (manifesto CTA, footer CTA, header CTA) — render as raster text planes (`CanvasTexture` with `ctx.fillText()`) so pill buttons don't appear as empty shapes. |
| 8 | Performance budget | See priority order below. Max ~45 objects in v1. DPR capped at 2. All disposed on exit. |
| 9 | Shape rendering | Pills: use `THREE.Shape` with rounded-rect path (`moveTo`, `lineTo`, `quadraticCurveTo` for corners) → `ShapeGeometry` for fill or `EdgesGeometry` for outline. Circles: `THREE.RingGeometry` for outline, `THREE.CircleGeometry` for fill. NOT plain PlaneGeometry. |
| 10 | Image/video source extraction | Images: use `element.currentSrc \|\| element.src \|\| element.querySelector('img')?.currentSrc`. Videos: use `element.querySelector('video')` directly. CSS background images: skip unless explicitly tagged with `data-webgl-src`. |
| 11 | WebGL failure | If `document.createElement('canvas').getContext('webgl2')` returns null on init: hide FloatingCapsule, skip intro animation, show normal DOM immediately. No 3D features. |
| 12 | Intro timeout | If font/image/video readiness hangs for >2.5s, abort intro: set `spreadT = 0`, reveal DOM, log warning. |
| 13 | WireframeText.ts | Delete the file. Reusable logic (FontLoader singleton, EdgesGeometry pattern) moves into MaterialFactory.ts. No archive convention exists. |

## Element Priority Order (for performance budget)

When over 45 items, skip from the bottom:

1. Hero headline lines (2 items) — highest priority
2. Hero grid cards (19 items, but cap at 9 — top 3 per column)
3. Countdown number (1)
4. Countdown ring (1)
5. Carousel headline (2)
6. Carousel cards (10, cap at 5 — visible ones)
7. Remote section lines (8, cap at 4 — first 4)
8. Manifesto headline + CTA (2)
9. Footer headline + CTA (2)
10. Remote studio image (1)
11. Header elements (2) — lowest priority, skip first if over budget
12. Floating capsule (1) — always included (trigger element)

Total at caps: 2+9+1+1+2+5+4+2+2+1+2+1 = 32 items. Well within budget.

## Architecture

```
TransitionController (state machine)
  modes: INTRO → IDLE → ENTERING → ACTIVE → EXITING → IDLE
  ├── INTRO: page load, spreadT 1→0 over 1.5s (ease-out-quint)
  │          2.5s timeout failsafe → force IDLE if readiness hangs
  │          FloatingCapsule disabled (aria-disabled) during INTRO
  ├── IDLE: normal 2D page, spreadT = 0
  ├── ENTERING: capsule clicked, spreadT 0→1 (spring: stiffness 400, damping 28)
  │             FloatingCapsule disabled during transition
  ├── ACTIVE: 3D mode, spreadT ≈ 1, camera orbit + scroll-Z
  └── EXITING: escape/capsule, spreadT 1→0 (spring: stiffness 180, damping 12)
              FloatingCapsule disabled during transition

LayoutEngine
  ├── Queries [data-layout] elements
  ├── Readiness gate:
  │     1. await document.fonts.ready
  │     2. await Promise.all([data-layout="image"] img.decode())
  │     3. await Promise.all([data-layout="video"] video loadedmetadata)
  │     4. Race against 2.5s timeout
  ├── getBoundingClientRect() + scrollY → world coords via Fr
  ├── Fr recomputed on every resize (NOT hardcoded)
  ├── Reads data-depth, data-id, data-layout, data-color, data-shape-type, data-outline
  └── Re-measures on resize, caches results

MaterialFactory
  ├── "text" → TextGeometry (AntiqueLegacy typeface JSON — HARD REQUIREMENT)
  │            Split text by DOM element (one TextGeometry per [data-layout="text"])
  │            fontSize from computedStyle → world size via Fr
  │            letterSpacing approximated in TextGeometry params
  │            Only for elements with computed fontSize >= 20px
  ├── "shape" → THREE.Shape with rounded-rect for pills, RingGeometry for circle outlines
  │            CTA labels inside pills: CanvasTexture with ctx.fillText()
  ├── "image" → PlaneGeometry + TextureLoader(element.currentSrc || element.src)
  ├── "video" → PlaneGeometry + VideoTexture(element.querySelector('video'))
  │            Fallback: poster image if video paused/blocked
  └── Skips elements < 40px in either dimension

SceneManager
  ├── Accepts LayoutItem[] from LayoutEngine
  ├── Creates 3D objects via MaterialFactory (max ~45)
  ├── Positions at (worldX, worldY, 0) when spreadT=0
  ├── Lerps Z to data-depth * Fr when spreadT=1
  ├── InfiniteGrid as background (existing, opacity dimmed to 0.03)
  ├── Particles (existing, count reduced to 80)
  └── Full disposal on exit (geometries, materials, textures)

CameraController
  ├── Uses verified constants (lc=800, FOV=50, ED=800, wD=π/3, AD=500, ux=0.15)
  ├── Mouse → smoothMouse (lerp ux=0.15) → lookPanX/lookPitch (÷lookSpeed=6)
  ├── Orbit multiplied by spreadT (no orbit when flat)
  ├── Scroll → scrollZ velocity with 0.95 damping per frame
  ├── Camera initial Y = current scrollY * Fr (mapped to world)
  └── Exit damping: PB=0.28, DB=0.04, LB=0.2 applied when targetProgress=0

DebugOverlay (permanent, gated behind ?debugLayout=1)
  ├── Shows DOM bounding boxes as colored outlines
  ├── Shows computed world coordinates (worldX, worldY, worldZ) per element
  ├── Shows data-depth value
  ├── Shows Fr value and viewport dimensions
  └── Updates on scroll and resize
```

## Depth Map

| Element | data-id | data-layout | data-depth |
|---------|---------|-------------|-----------|
| Header logo | header-logo | image | 100 |
| Header CTA arrow | header-cta | shape | 100 |
| Hero "Make the" | hero-line-1 | text | -100 |
| Hero "new normal" | hero-line-2 | text | -100 |
| Hero tagline | hero-tagline | text | -150 |
| Hero live bar | hero-live | shape | -80 |
| Hero cards (each) | hero-card-N | video | 0 to -200 (stagger: -N*22) |
| Countdown number | countdown-headline | text | -200 |
| Countdown ring | cd-ring | shape | -200 |
| Manifesto headline | manifesto-headline | text | -300 |
| Manifesto CTA | manifesto-btn | shape | -300 |
| Carousel "Design" | carousel-headline | text | 220 |
| Carousel "in public" | carousel-headline-2 | text | 220 |
| Carousel cards (each) | carousel-card-N | image | 0 to -100 (stagger: -N*20) |
| Remote lines (each) | remote-line-N | text | -50 to -150 (stagger: -N*14) |
| Remote studio image | remote-studio-img | image | -100 |
| Footer headline | footer-headline | text | -100 |
| Footer CTA | footer-btn | shape | -100 |
| Floating capsule | floating-capsule | shape | 300 |

## Implementation Phases

### Phase 0: Verify Prerequisites
Confirm before any code changes:
1. **Typeface JSON**: `public/fonts/AntiqueLegacy-Medium.typeface.json` — user converts from .woff2 via facetype.js. **This is the immediate blocker for Phase 2.** If missing, Phases 0-1 can proceed but Phase 2 halts.
2. **Clock object assets**: Attempt download from `shopify.design/clock/` paths. Document what's available. If not found, source transparent PNG/WebP renders (AI-generated or static 3D renders).
3. **Playwright**: Confirm `npx playwright install` works. If browser launch fails on macOS permissions, use `PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install chromium` or `PW_CHANNEL=chrome` with headed mode as fallback.
4. **WebGL**: Confirm `document.createElement('canvas').getContext('webgl2')` succeeds on dev machine.

**Files:** None modified. Verification only.

### Phase 1: Layout Instrumentation + Debug Overlay
Add `data-layout`, `data-id`, `data-depth` attributes to all section components per the depth map. Build LayoutEngine with font/image/video readiness gate and 2.5s timeout. Build debug overlay gated behind `?debugLayout=1` — shows both DOM bounding boxes AND computed world coordinates/depth so projection math errors are visible.

**Files:**
- Modify: HeroSection.tsx, CountdownSection.tsx, CarouselSection.tsx, RemoteSection.tsx, Footer.tsx, Header.tsx
- Create: `src/components/WebGLScene/LayoutEngine.ts`
- Create: `src/components/WebGLScene/DebugOverlay.tsx`

### Phase 2: MaterialFactory + Scene Projection
Create 3D objects from layout measurements. TextGeometry for headlines — one TextGeometry per `[data-layout="text"]` element (each element = one visual line, no auto-wrapping). `computedStyle.fontSize * Fr` for world size. Letter spacing: per-character geometry placement if needed, or accept default spacing. If TextGeometry output is visibly wrong for a headline, switch that element to CanvasTexture raster text plane (NOT boxes). Shape rendering with `THREE.Shape` rounded-rect for pills. Image/video source extraction rules per decision #10. Position all at measured world coords. `spreadT` drives Z from 0 to `depth * Fr`.

**Hard gate:** If `AntiqueLegacy-Medium.typeface.json` is not found by FontLoader, throw an error and abort scene creation. Do not silently fall back.

**Deletion gate:** `WireframeText.ts` is deleted only AFTER MaterialFactory fully replaces all its imports. Verify build succeeds before deleting.

**Files:**
- Create: `src/components/WebGLScene/MaterialFactory.ts`
- Rewrite: `src/components/WebGLScene/SceneManager.ts`
- Delete: `src/components/WebGLScene/WireframeText.ts` ONLY after MaterialFactory replaces all imports and build passes

### Phase 3: Camera + Transition + Trigger
TransitionController state machine with all 5 modes (INTRO, IDLE, ENTERING, ACTIVE, EXITING) designed together. Camera uses verified constants with `Fr` recomputed on resize. FloatingCapsule becomes a `<button>` with `aria-label="Toggle 3D view"`, disabled during INTRO/ENTERING/EXITING states. Remove headline click trigger from HeroSection.

WebGL failure fallback: if context creation fails, set a `webglSupported = false` flag, hide capsule, skip intro, render normal DOM.

**Files:**
- Rewrite: `src/components/WebGLScene/CameraController.ts`
- Create: `src/components/WebGLScene/TransitionController.ts`
- Modify: `src/components/WebGLScene/WebGLScene.tsx`
- Modify: `src/components/WebGLScene/WebGLScene.module.css`
- Modify: `src/components/FloatingCapsule.tsx` (→ `<button>`, aria-label, disabled states)
- Modify: `src/components/FloatingCapsule.module.css`
- Modify: `src/app/page.tsx` (capsule trigger, webglSupported check)
- Modify: `src/components/HeroSection.tsx` (remove onHeadlineClick)

### Phase 4: Floating 3D Clock Objects
CSS-positioned decorative objects around the clock. Opacity tied to scroll progress (appear when ring ~50% drawn). Float/rotate via CSS keyframes. Fast visual win for fidelity screenshots.

**Files:**
- Modify: `src/components/CountdownSection.tsx`
- Modify: `src/components/CountdownSection.module.css`
- Add: `public/images/clock-objects/` assets

### Phase 5: Page Load Intro Explosion
Uses TransitionController INTRO mode (already built in Phase 3). On mount: measure layout (with readiness gate + 2.5s timeout), create scene at spreadT=1, animate to 0. White overlay fades. DOM starts `visibility: hidden` (NOT `display: none` — videos must stay in DOM for VideoTexture). Revealed when spreadT < 0.1. If readiness times out at 2.5s: abort intro, set spreadT=0, reveal DOM, log warning.

**DOM hiding detail:** Use `visibility: hidden; pointer-events: none` on `<main>` during intro. Videos remain playable for VideoTexture. On intro complete, remove these styles.

**Files:**
- Modify: `src/components/WebGLScene/WebGLScene.tsx` (INTRO activation)
- Create: `src/components/IntroOverlay.tsx` (white overlay that fades)
- Modify: `src/app/page.tsx`

### Phase 6: Mobile Responsiveness
After all WebGL work. Re-run LayoutEngine measurement validation after CSS changes to confirm positions are stable. Disable 3D mode on `pointer: coarse` (capsule gets `aria-disabled`, no onClick). Test at 390×844 and 768×1024.

**Files:**
- Modify: HeroSection.module.css, CarouselSection.module.css, RemoteSection.module.css, Header.module.css, Footer.module.css
- Verify: LayoutEngine measurements still correct after mobile CSS

## Font Readiness Gate
LayoutEngine.measure() must:
1. `await document.fonts.ready`
2. `await Promise.all(imageElements.map(img => img.decode().catch(() => {})))`
3. `await Promise.all(videoElements.map(v => new Promise(r => v.readyState >= 1 ? r() : v.addEventListener('loadedmetadata', r, {once:true}))))`
4. Race all of the above against a **2.5s timeout** — if timeout fires, proceed with current measurements and log a warning

## Performance Budget
- Max ~45 layout items in v1 (per priority order above)
- DPR capped at `Math.min(window.devicePixelRatio, 2)`
- All geometries + materials + textures disposed on mode exit
- TextureLoader and FontLoader: singleton instances, cached across enter/exit cycles
- Skip elements < 40px in either dimension
- `will-change: transform` on transitioning DOM elements only during ENTERING/EXITING
- Videos: pause when exiting 3D mode, resume IntersectionObserver control

## WebGL Failure Fallback
```
On init:
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
  if (!gl) {
    webglSupported = false
    → hide FloatingCapsule
    → skip intro animation
    → show normal DOM immediately
    → no 3D features for this session
  }
```

## Stop Condition: "Faithful Enough"
Desktop screenshots at 1440×900, comparing original vs local at these 6+2 states:
1. Page load explosion mid-animation
2. Hero section at rest (2D)
3. Countdown clock at ~50% draw
4. 3D mode entered — initial spread view
5. 3D mode — orbited ~30° horizontally
6. 3D mode — scrolled deep into page (carousel/remote visible)
7. Mobile 390×844 — hero section
8. Mobile 390×844 — countdown section

Visual parity target: layout and element positions match within ~5%. Text rendering will differ (wireframe edges vs SDF) — accepted tradeoff documented in decision #1. If TextGeometry is visibly wrong, CanvasTexture raster is the fallback, not boxes.

**Intro explosion capture:** Comparing a mid-animation frame of the original is unreliable (timing-dependent). Fallback acceptance: compare local intro subjectively against video recording of original. Only static states (2–8) require pixel-level screenshot comparison.

## Smoke Test: Build Must Pass After Every Phase

After completing each phase, run `npx tsc --noEmit` and verify the dev server renders without errors. Especially critical:
- **After Phase 2:** Verify build passes after WireframeText.ts deletion. Do not delete until MaterialFactory is fully wired and `SceneManager.ts` no longer imports from WireframeText.
- **After Phase 3:** Verify FloatingCapsule, page.tsx, and HeroSection changes don't break non-WebGL page rendering.
- **After Phase 5:** Verify intro doesn't block page rendering if WebGL context fails.
