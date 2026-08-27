# Steers — User Direction Log for PRD

- Animated splash/loading animation when page first loads (WebGL text reveal)
- Hero grid cards need animated video-like content, not static placeholder images
- Carousel cards should start centered, not flush left
- Carousel cards have real video thumbnails of people talking — need AI-generated lookalike video stills
- Logo: exact Shopify bag icon SVG + "design" in bold lowercase sans-serif, tight spacing, no gap
- Site must work on mobile — video reference provided (shopify1.mp4)
- Cards in hero grid are animated (looping video thumbnails), not static
- Font is bold sans-serif grotesque (not serif) — using Space Grotesk as substitute for AntiqueLegacy
- Footer is on white background, LEFT-aligned headline and CTA
- Remote section has progressive indentation (staircase effect)
- Clock section: massive "26" with tick marks, rotating red hand
- 3D WebGL transition between remote and footer sections (phase 2)
- Floating 3D capsule in bottom-right corner throughout site
- PRD.md will be written by hand — never auto-generate
- Carousel card video thumbnails show people in rounded-corner frames with slight rotation
- Demo Night / Kinference stacked cards show event photography
- "Building Artifact" article card: pink/coral heading on deep blue bg
- Media card thumbnails are smaller than card, floating inside with rotation
- Process: rebuild section by section, verify each against reference frames before moving on
- Match static composition first, then add animation
- Analyze current Claude workflow and change approach if fidelity is drifting
- Try local Playwright for a deterministic capture/diff loop; fall back if machine blocks it
- Use Shopify media only as visual reference; recreate all production assets locally with AI/original work
- KEY INSIGHT: Use the original site's downloaded CSS for exact measurements instead of guessing from video frames
- Original CSS tokens: --hero-fs, --hero-wrap-h, --page-gutter, --hero-live-pad-x — use these exact formulas
- Logo is a single SVG at 120px width total, not two separate icons
- Hero headline wrapper uses 10-column CSS grid with align-content:center
- Tagline uses --text-callout (22px), letter-spacing -0.02em, margin-top 40px
- Live bar margin-top is 112px, uses clip-path reveal animation
- Header starts at top:-40px and animates in with 0.8s delay
- Figma Make for recreating pixel-perfect assets is allowed — creating new assets that match visual style is fine per hackathon rules
- Remote section uses 10-column CSS grid with each line at different grid-column positions (staircase effect)
- Remote font-size: min(160px, 11.111vw) — from original CSS
- Asset strategy: use originals to nail layout first, then replace each with AI-generated version before submission
- Document all asset replacements in SETUP.md
- Fonts: using actual AntiqueLegacy (self-hosted from /public/fonts/) — will need free substitute before final submission
- Icons: using original SVGs from shopify.design (self-hosted) — keep for submission, these are functional elements
- Hero card images: using original poster JPGs (self-hosted) — replace with AI-generated before submission
- DevTools measurements from original site:
  - h1.headline per line: 1457.59 × 154px (at ~1515px viewport)
  - span.wr-text "Make": 517.81 × 154px
  - span.wr "the": 308.88 × 154px  
  - p.hero-tagline: 576 × 24.19px
  - header.site-header: 3029 × 116px (retina)
  - Each word wrapped in span.wr for stepped reveal animation
- Original headline line-height: 0.7 (not 0.88)
- Original headline has side-bearing: margin-left -0.08em
- Original countdown "26" font-size: 1600px (exact)
- Header padding: top=page-pad/2 (24px), bottom=page-pad (48px)
- Replaced 52 assets with AI-replicated versions (19 hero videos, 19 posters auto-generated from videos, 4 fonts, 10 icons, 1 studio image)
- Remaining 24 assets to replace: 5 carousel videos, 9 stacked photos, 5 carousel posters, 2 article bgs, 3 favicons
- Hero card videos now auto-play when visible via IntersectionObserver
- Card order matches original exactly (3 pre-defined columns, not round-robin)
- No column stagger offsets — all columns start at same position (stagger is in animation timing only)
- DO NOT replace fonts and icons with AI-replicated versions — Manus generates placeholder text SVGs, not real icon paths
- Fonts and icons are functional UI elements, keep originals for dev, use free substitutes for submission
- Only videos and photos need AI-replicated alternatives (the creative content)
- Countdown section sticky height should be 600vh (not 220vh) per original CSS
- Manifesto uses 10-column grid: left at grid-column 3/span 3, right at 6/span 3
- Sections below hero should animate up from bottom on first scroll into view, then stay put
- Added ScrollReveal component wrapping CountdownSection, CarouselSection, RemoteSection, Footer
- Uses IntersectionObserver with opacity 0 -> 1, translateY(60px) -> 0, one-shot (stays after reveal)
- Clock behavior: fade in gradually as user scrolls down to it, fade out if user scrolls back up (reversible, not one-shot)
- Clock hand should tick in discrete 1-second intervals (not continuous rotation) — like a real clock second hand
- Clock number should count down from 26 to 0, then reset to 26 — synced with the ticking hand
- Scroll back up should reverse the clock fade-in (clock fades out)
- Video reference for clock behavior provided — extract frames to match exactly
- Fine-tuned replicated video assets (19) provided via replicated-assets-numbered.zip and swapped in
- Poster images auto-generated from replicated videos via ffmpeg first-frame extraction
- Webcraft skill says: use original assets initially, replace before submission
- Do NOT replace fonts/icons with Manus output — they generate text SVG placeholders, not real icons
- Clock transition: left-to-right clip-path reveal on scroll down, reverses right-to-left on scroll up
- Clock must NOT overlap sections above — use overflow:hidden on sticky container
- Clock fade is NOT opacity — it's a clip-path wipe (inset 0 100% 0 0 → inset 0 0 0 0)
- Replaced carousel assets with b-series replicated versions (5 videos + 3 stacked images)
- DO NOT use opacity/scale for clock reveal — use clip-path for left-to-right wipe
- Clock ring starts at 1.8x scale (wide semi-circle), shrinks to 1.0x as scroll progresses
- Both ring draw (stroke-dashoffset) and ring scale are scroll-position-driven
- 650px whitespace between previous section and clock section top
- Number size reduced to clamp(300px, 40vw, 800px) to fit inside ring boundary
- Number decrements immediately when clock enters viewport, not waiting for ring to finish drawing
- Ring scale + draw both reverse when scrolling back up
- CORRECTION: Clock ring has NO scale animation — ring is always the same large size, only stroke-dashoffset draws it
- Clock hand has orange center pivot dot (18px radius circle at center)
- Numbers display as 2-digit zero-padded ("04", "15", "19")
- Number is enormous (1600px font-size), not reduced
- 3D WebGL scene: clicking "Make the new normal" headline opens fullscreen 3D environment
- 3D scene contains: wireframe grid lattice, 3D extruded wireframe text, particles, wireframe cubes
- Mouse movement orbits camera around the wireframe text
- Scroll wheel moves camera forward/backward in the 3D space
- Deep scroll reveals hero grid cards as floating textured planes in 3D
- ESC key closes the 3D scene and returns to normal page
- Implementation: raw Three.js (not R3F), FontLoader + TextGeometry + EdgesGeometry for wireframe text
- Font conversion needed: AntiqueLegacy-Medium.woff2 → typeface JSON via facetype.js (user does this)
- Playwright test script at tests/webgl-scene.spec.ts for visual verification
- Carousel b-series assets replaced (5 videos + 3 stacked images from replicated-b-series.zip)
- Phase 1 strategy: use ALL original shopify.design assets directly (videos, images, fonts, icons) — no AI replication yet. Exact reproduction first, asset replacement later.
- Downloaded all original assets from Shopify CDN: 19 hero videos (SD-480p), 19 posters, 5 carousel videos (HD-1080p), 9 stacked photos, 5 carousel posters, studio image, marquee icon
- Carousel image paths changed from /images/carousel-orig/ to /images/carousel/
- Favicon: 13 color variants cycle on page load (slot-machine animation, settles on random). All 13 sets downloaded from shopify.design/favicons/01-13/
- Clock section: reverse-engineered exact algorithm from original JS bundle. Key: clock wrap starts below viewport (translateY 1.5×vh), rises upward with scale shrinking from ~2 to 1. Ring starts 25% drawn. 221 tick marks. pathLength=1 trick. rotate(90 50 50). Hand is WebP image, not SVG.
- Clock constants from original: Rx=1.5 (initial Y ratio), wG=2.5 (scale const), Ba=221 (ticks), Ex=49*0.9655, Ax=49*0.976, Cx=3.5
- Clock digits are SVG paths (not text) with stroke-dashoffset draw animation
- Countdown numbers always black, always ticking from page load (not gated by visibility)
- 3D WebGL mode: comprehensive plan in WEBGL_REPLICATION_PLAN.md. Hybrid approach: TextGeometry for headlines, native materials for shapes/images/videos. Per-element depth projection matching original's data-layout/data-depth model.
- 3D constants verified from original bundle: lc=800 (camera Z), FOV=50°, Fr=2*lc*tan(FOV/2)/viewportHeight (recomputed on resize), ED=800, wD=π/3, AD=500, ux=0.15, lookSpeed=6
- Typeface JSON: converted AntiqueLegacy-Medium.woff2 → typeface.json via opentype.js + wawoff2 (facetype.js failed on this woff2 version). 456 glyphs, UPM 2048.
- Floating clock objects: not available as static assets on shopify.design. Need AI-generated or static transparent PNG/WebP renders (NOT CSS gradients).
- 3D mode trigger: Headline mousedown (hold-to-explore, mouseup exits) OR FloatingCapsule click (toggle mode, click again or ESC to exit)

## 3D WebGL Mode — Architecture (from original bundle analysis, May 2026)

### Camera System
- Camera is TOP-DOWN: position (0, cameraHeight, scrollZ), up=(0,0,-1), looking down at XZ ground plane
- DOM X → World X, DOM Y → World Z, data-depth → World Y (below camera)
- Camera height 300, orbit radius 180 (scaled down from original's 800/500 for closer feel)
- Orbit achieved by moving lookAt target, not camera position
- Mouse smoothing: ux=0.15, lookSpeed=6
- Scroll moves camera along Z axis with spring physics (stiffness=400, damping=28)

### Projection Blending
- Orthographic↔Perspective projection matrix blend using spreadT^3 (cubic easing)
- At spreadT=0: pure orthographic (flat page replica)
- At spreadT=1: full perspective (3D depth)
- FOV lerps from 50° (flat) to 75° (3D)

### Transition
- Headline mousedown: enter 3D (hold-to-explore, mouseup exits)
- Capsule click: toggle 3D (click to enter, click again to exit, ESC also exits)
- Enter: 700ms easeInOutCubic, Exit: 600ms easeInOutQuint
- Elements start at Y=0, animate to Y=depth*Fr*1.5 via spreadT

### Fog & Atmosphere
- Linear fog: near=lerp(200,30,spreadT), far=lerp(2200,400,spreadT)
- Content materials have fog:false (visible regardless of distance)
- Grid/particles have fog:true (create atmospheric dark envelope)
- Background: black in 3D mode

### Clock in 3D
- "26" rendered as massive 3D wireframe TextGeometry (data-text="26" for explicit text content)
- Clock ring as TorusGeometry (3D tube) in orange (#FF591D) with EdgesGeometry wireframe
- Clock hand image on SVG <image> element, reads CSS rotation each frame to tick in 3D
- Countdown number sizing: worldHeight*1.15 with depth*0.8 (element is already large from CSS)

### Text Rendering
- Headlines: TextGeometry + EdgesGeometry wireframe, fog:false
- Tagline/body: flat 2D CanvasTexture fallback
- Font: AntiqueLegacy-Medium.typeface.json

### Image/Video Rendering
- PlaneGeometry rotated to XZ plane, additive blending, 70% opacity, fog:false

### Grid
- 3D wireframe lattice: floor (XZ), walls (XY at Z intervals), depth lines (YZ at X intervals)
- Fog:true creates atmospheric depth fade

### Headline Burst
- REMOVED: user didn't want the colored circles/particles around headline on page load
- No shapes (squares/circles) behind words during word reveal either — just the text scaling animation

## Intro Animation — Page Load Sequence (May 2026)

### Frame-by-Frame Reference
- Extracted 251 frames at 30fps from screen_load.mov of original shopify.design
- Saved to screenshots/screen-load-frames/ for pixel-accurate comparison
- Reference analysis in reference/INTRO_ANIMATION_ANALYSIS.md

### Phase 1: Word Reveal (0–1.1s from mount)
- CSS step-end keyframes, NOT smooth transitions
- wrText: scale 0.35→0.35→0.65→1.0 with step-end timing (words pop between sizes)
- Words start transparent, become visible at 30% of 1s animation
- Staggered delays: "Make" 0s, "the" 0.12s, "new" 0.24s, "normal" 0.36s
- wrDrift: subtle 0.08em horizontal settle after words reach full scale
- At scale(0.35), words occupy full-size flow space → appear widely spread, then converge as they scale up
- NO shapes (squares/circles) behind words — removed per user feedback
- NO colored burst particles — removed per user feedback

### Phase 2: Hold (1.1–1.3s)
- Text fills viewport at enormous scale, centered vertically
- Brief dramatic pause before explosion (~200ms)
- heroRise hasn't started yet (delay 1.5s)

### Phase 3: Tile Explosion (1.3s, canvas at z-index 9999)
- Canvas-based, NOT WebGL — 2D canvas overlay with pointer-events:none
- Multi-scale tiles: 20 columns, hash-based sizing (1x1, 2x2, 3x3) matching original's GLSL shader
- Hash function: sin-based deterministic hash for tile sizes and spawn order
- Tile size thresholds: 3x3 at hash≥0.85, 2x2 at hash≥0.55, else 1x1
- Instant black background with dot grid (24px spacing, 1.2px dots, 12% opacity)
- Tiles clear radially from center outward — single monotonic curve (easeOutCubic), tiles NEVER go back to black
- Massive white starburst: central flash + radial gradient + 36 sharp ray lines
- Prismatic light streaks: 16 colored streaks from center (cyan, gold, shifting hue) via screen composite
- Prismatic tile edges: cyan/magenta/gold border effects on remaining dark tiles
- Chromatic aberration: RGB split on tile boundaries, offset scales with distance from center
- Late-stage glow: remaining dark tiles get prismatic colored radial gradients before dissolving
- Total canvas duration: 2000ms

### Phase 4: Page Emerge (1.3–3.3s)
- heroRise starts at 1.5s delay (1.9s duration, easeInOutQuint) — hero moves from centered to final position
- Card fly-in: from spread positions, staggered delays per original formula
  - cardDelay = 2 + colIdx * 0.06 + cardIdx * 0.2
  - cardX = ((colIdx / (totalCols-1)) * 2 - 1) * 350
  - cardY = 300 + cardIdx * 100
  - cardDur = 1.5 + ((colIdx * 7 + cardIdx * 13) % 4) * 0.2
- Live bar clip-path reveal: delay 2.6s, 1.6s duration
- Header fade-in: delay 2.7s, 0.8s duration, from top:-40px to top:0
- Canvas unmounts when animation completes (phase="done")

### Timing Alignment
- Explosion start (1300ms) fires 200ms BEFORE heroRise (1500ms) so tiles mask the start of hero movement
- Card animations start at 2000ms+ (during tile dissolve)
- All CSS element delays (header 2.7s, live bar 2.6s, cards 2s+) timed so elements appear as tiles clear above them

### Key Bug Fixes
- Tiles must use single monotonic clearing curve — previous dual build/fade system caused tiles to go back to black (creating a "second explosion")
- IntroScene renders nothing during word phase (no white overlay blocking CSS animations)
- Canvas uses clearRect for transparent tiles so page content shows through

## Card Click → Expanded View (May 2026)

### Behavior (from original shopify.design)
- Clicking a hero grid card opens an expanded view of that project
- URL changes to `#hero-{slug}` (e.g. `#hero-renaissance`) — feels like page navigation, not a popup
- Browser back button closes the expanded view
- ESC key also closes it
- Clicking outside the card (on the backdrop) closes it
- Scroll is locked while card is open (`body overflow: hidden`)

### Visual (from original CSS: ws3-modal-overlay)
- Backdrop: `background: var(--color-white); backdrop-filter: blur(12px)` — white blurred overlay, NOT dark
- Card: `width: fit-content` — video's natural dimensions determine card size
- Video: `max-width: min(1440px, calc(100vw - 16px)); max-height: 85vh; width: auto; height: auto` — responsive, maintains aspect ratio
- Video wrapper: `border-radius: 16px; overflow: hidden; background: #000; box-shadow: 0 8px 32px rgba(0,0,0,0.12)`
- "Explore" pill button + arrow circle at bottom-left of card
- Animation: card scales from 1.05 with 3px blur, 0.612s duration, cubic-bezier(0.22, 1, 0.36, 1)
- Backdrop fades in over 0.576s with 72ms delay

### Implementation
- VideoModal component renders fixed overlay with `display: grid; place-items: center`
- Backdrop is `::before` pseudo-element (avoids click event issues)
- Video starts at `currentTime = 2` to skip dark intros
- Card click handler in page.tsx pushes hash to history, popstate listener closes modal on back
- Both hero cards and carousel cards wired to same modal system

### Asset Quality
- Hero videos upgraded from SD 480p to HD 1080p from Shopify CDN
- Carousel videos upgraded to HD 1080p
- Poster images regenerated from 2 seconds into each video (avoids black first frames)
- CDN base: `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/{id}/{id}.HD-1080p-*.mp4`
