# Session State — Shopify.design Replication
# Last updated: 2026-05-06

## What Was Done This Session

### 1. Original Assets Downloaded (Phase 1 — use originals, not AI replicas)
- 19 hero videos (SD-480p) from Shopify CDN → public/videos/hero/
- 19 hero poster images → public/images/hero/
- 5 carousel videos (HD-1080p) → public/videos/carousel/
- 9 carousel stacked photos → public/images/carousel/
- 5 carousel media posters → public/images/carousel/
- Studio image (webp) → public/images/studio.webp
- Marquee icon (gif) → public/icons/marquee-icon.gif
- Clock hand image → public/clock/clock-hand-dial.webp
- 13 favicon color variants → public/favicons/01-13/
- CarouselSection.tsx paths updated from /images/carousel-orig/ to /images/carousel/

### 2. Favicon Cycling Animation
- layout.tsx updated with 13-variant slot-machine favicon cycling script (from original site's root JS)
- Picks random target, cycles through all 13 with accelerating delays, settles

### 3. Countdown/Clock Section — Complete Rewrite
- Reverse-engineered exact algorithm from original JS bundle (_index-DqiyU7W1.js)
- Key constants: Rx=1.5, wG=2.5, Ba=221 ticks, pathLength=1, rotate(90 50 50)
- Clock wrap starts below viewport (translateY 1.5×vh), rises upward with scale shrinking ~2→1
- Ring starts 25% drawn (drawT = 0.25 + 0.75 * progress)
- 221 tick marks sweep in with ring via getTickPath()
- Digits are SVG paths (not text) with stroke-dashoffset draw animation
- Hand is WebP image (/clock/clock-hand-dial.webp)
- Manifesto follows at y + scaledHeight * 0.78
- CSS matches original exactly (from _index-d1PKX52d.css)
- Numbers always black, always counting down, hand always rotating

### 4. Typeface JSON Conversion
- facetype.js failed (unsupported woff2 version)
- Converted via: wawoff2 (decompress woff2→ttf) + opentype.js (parse→typeface JSON)
- Result: public/fonts/AntiqueLegacy-Medium.typeface.json (456 glyphs, UPM 2048)
- npm packages installed: opentype.js, wawoff2 (dev dependencies)

### 5. WebGL 3D Mode — Phase 1 & 2 (IN PROGRESS, NOT WORKING WELL)
#### Phase 1: Layout Instrumentation (DONE)
- data-layout, data-id, data-depth attributes added to all sections:
  - HeroSection: headline lines, tagline, live bar, 19 cards
  - Header: logo, CTA
  - CarouselSection: headline lines, 10 cards
  - RemoteSection: 8 lines, studio image
  - Footer: headline, CTA
  - CountdownSection: manifesto headline, CTA
- LayoutEngine.ts created: measures [data-layout] elements, computes world coords via Fr
- DebugOverlay.tsx created: gated behind ?debugLayout=1, shows bounding boxes + world coords
- Wired into page.tsx

#### Phase 2: MaterialFactory + SceneManager (DONE but needs major work)
- MaterialFactory.ts created: handles text/shape/image/video layout types
- SceneManager.ts rewritten: uses LayoutEngine + MaterialFactory
- CameraController.ts rewritten: orbit + scroll-Y navigation
- WireframeText.ts: still exists, no longer imported by SceneManager (not yet deleted)
- PROBLEM: The 3D mode doesn't feel immersive. User says it's worse than the previous
  wireframe-world implementation. The previous version had: wireframe grid, wireframe text,
  cubes, particles creating an immersive 3D space you could orbit through. Current version
  places flat planes at different Z depths which killed the immersive feel.
- NEEDS: Visual reference from user (Playwright can't launch from sandbox — macOS permissions).
  User needs to take screenshots or screen recording of current state for debugging.

### 6. WebGL Replication Plan
- Comprehensive plan at WEBGL_REPLICATION_PLAN.md (decision-complete, constants verified)
- Key verified constants from original bundle:
  - Camera: lc=800, FOV=50°, Fr=2*lc*tan(FOV/2)/viewportHeight
  - Orbit: ED=800, wD=π/3, AD=500, ux=0.15, lookSpeed=6
  - Transition springs: enter {stiffness:400, damping:28}, exit {stiffness:180, damping:12}
  - Depth levels: CD=-200, RD=-100, PD=-50, DD=0
- TransitionController state machine designed but not yet built
- Phases 0-1 complete, Phase 2 done but broken, Phases 3-6 not started

### 7. Steers Hook
- .claude/settings.local.json created with Stop hook (prompt type)
- Checks each turn for new user decisions/corrections to append to steers.md

## What Needs To Happen Next

### Immediate (WebGL 3D mode is broken)
1. Get visual reference from user (screenshots or screen recording of current 3D mode)
2. Fix the 3D experience to be immersive — the user wants:
   - Click → instantly enter a 3D world with wireframe grid
   - Visible wireframe text "Make the new normal"
   - Can see sections below as if looking into a 3D black hole
   - Mouse orbits, scroll navigates through depth
   - Page elements visible at different depths as you scroll through
3. The previous implementation (before this session's rewrite) was closer to correct
4. Key issue: I can't see what the user sees — need screenshots/recording to debug

### Remaining Plan Phases
- Phase 3: TransitionController state machine, FloatingCapsule as trigger
- Phase 4: Floating 3D clock objects (CSS-positioned, decorative)
- Phase 5: Page load intro explosion
- Phase 6: Mobile responsiveness

### Other Outstanding Items (from PROJECT_STATE.md)
- Mobile responsiveness pass
- Desktop (1440×900) + mobile (390×844) screenshots
- Write PRD.md BY HAND
- Write SETUP.md
- Update site.toml
- Deploy to Vercel
- Transfer to AAI-Web Craft team
- Import at codimango.com

## Key Files Modified This Session
- src/app/layout.tsx — favicon cycling
- src/app/page.tsx — DebugOverlay added
- src/components/CountdownSection.tsx — complete rewrite (clock algorithm)
- src/components/CountdownSection.module.css — complete rewrite (matches original CSS)
- src/components/CarouselSection.tsx — carousel-orig → carousel paths, data attributes
- src/components/HeroSection.tsx — data-layout/data-id/data-depth attributes
- src/components/Header.tsx — data attributes
- src/components/Footer.tsx — data attributes
- src/components/RemoteSection.tsx — data attributes
- src/components/WebGLScene/SceneManager.ts — rewritten (LayoutEngine + MaterialFactory)
- src/components/WebGLScene/CameraController.ts — rewritten (verified constants)
- src/components/WebGLScene/LayoutEngine.ts — NEW
- src/components/WebGLScene/MaterialFactory.ts — NEW
- src/components/WebGLScene/DebugOverlay.tsx — NEW
- WEBGL_REPLICATION_PLAN.md — NEW (comprehensive plan)
- steers.md — updated with session decisions
- public/fonts/AntiqueLegacy-Medium.typeface.json — NEW (converted from woff2)
- public/clock/clock-hand-dial.webp — downloaded from shopify.design
- public/favicons/01-13/ — 13 favicon variant sets
- .claude/settings.local.json — steers hook

## Key Context for Next Session
- Dev server runs on port 3456 (not 3000)
- No git repo initialized — no version control
- Playwright installed but can't launch from Claude sandbox (macOS permissions)
- User has Codex running in parallel providing code review feedback
- Original site's JS bundle cached at /tmp/shopify-index.js (may not persist)
- Original site's CSS cached at /tmp/shopify-page.css (may not persist)
- The user wants exact visual reproduction — not "close enough"
- steers.md is the user direction log — check it for all past decisions
- PROJECT_STATE.md has the full project status from before this session
