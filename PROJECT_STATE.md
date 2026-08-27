# Project State — Shopify.design Replication
# Last updated: 2026-05-04

## What This Is
Web Craft hackathon submission — replicating shopify.design. Private repo in codimango org.
Tech stack: Next.js 16, TypeScript, Tailwind v4, Three.js, GSAP, Lenis, Embla Carousel.

## What's Done

### Hero Section (mostly complete)
- Headline "Make the new normal" with AntiqueLegacy font (self-hosted woff2)
- Original Shopify bag logo SVG at 120px
- Demo Night marquee pill with animated GIF icon
- 3-column card grid with 19 video cards (auto-play via IntersectionObserver)
- Card order matches original exactly (3 pre-defined columns COL1/COL2/COL3)
- Hero rise animation (translateY, 2.4s ease-in-out-quint)
- Header slide-in from top:-40px, 2s delay
- Live bar clip-path reveal from left, 3s delay
- All hero videos replaced with AI-replicated versions (replicated-assets-numbered.zip)
- Poster images auto-generated from replicated videos via ffmpeg

### Clock/Countdown Section (needs refinement)
- Massive "26" (1600px font-size) with decrementing countdown (26→0→26)
- SVG ring draws progressively via stroke-dashoffset tied to scroll position
- Ring starts from bottom (rotate 90), draws clockwise as user scrolls
- Gray tick marks (#E5E5E5), orange ring + hand (#FF591D)
- Orange center pivot dot (18px radius)
- Hand ticks discretely at 1-second intervals
- Ring size: max(1400px, min(1800px, 98vw))
- 2-digit zero-padded display ("04", "15" etc.)
- 650px whitespace above section
- Manifesto below: "Make commerce better for everyone." + body text + dark CTA button
- Manifesto uses 10-column grid: left at grid-column 3/span 3, right at 6/span 3
- ISSUE: clock ring behavior still not matching original perfectly — user wants ring to start wider and settle

### Carousel Section (mostly complete)
- "Design in public" headline at --text-display size, centered
- 10 cards: 5 media (video), 3 stacked (photos), 2 article
- Embla carousel with dragFree, center alignment
- Card dimensions: 415×558px, 24px radius
- Media cards have auto-playing video thumbnails with play label
- Stacked cards have 3 overlapping images
- Article cards: "Building Artifact" (blue bg, pink heading), "Deciding to move faster" (pink bg)
- Carousel videos replaced with b-series replicated versions
- Card gap: 24px, bleed padding: 220px

### Remote Section (mostly complete)
- 10-column CSS grid with staircase indentation per line
- Line positions from original CSS (grid-column 3/span 5, 4/span 6, etc.)
- Font: min(160px, 11.111vw)
- Studio image placeholder between "New" and "York"
- IntersectionObserver staggered reveal (80ms per line)

### Footer (mostly complete)
- White background, left-aligned
- "SHOPIFY DESIGN" + "2026" top bar in mono font
- Horizontal rule
- "Help shape what comes next" headline (--text-heading, left-aligned)
- "Join Shopify" pill CTA with bag icon
- Padding: 0 page-gutter 164px bottom

### 3D WebGL Scene (Phase 1-2 implemented, needs Phase 3-4)
- Click "Make the new normal" → fullscreen black 3D overlay (z-index 100)
- Three.js SceneManager with camera, renderer, animation loop, disposal
- InfiniteGrid: 3D wireframe lattice (floor + walls + depth lines)
- WireframeText: loads typeface JSON → TextGeometry → EdgesGeometry → LineSegments
- CameraController: mouse orbit (±28° H, ±17° V, lerp 0.05) + scroll Z movement
- SceneObjects: 5 wireframe cubes + 150 floating particles
- ESC to close, body overflow hidden when active
- NEEDS: Font conversion (AntiqueLegacy-Medium.woff2 → typeface JSON via facetype.js)
- NEEDS: Phase 3 (scroll-to-move-camera fine-tuning)
- NEEDS: Phase 4 (hero cards as textured planes on deep scroll, post-processing)

### Other Components
- FloatingCapsule: 3D pill shape fixed bottom-right, float + rotation animation
- ScrollReveal: IntersectionObserver wrapper for section entrance animations
- SmoothScroll: Lenis + GSAP ScrollTrigger integration
- DarkScene: exists but NOT currently used (was removed from page.tsx)

## Assets Status

### Fully Replaced with AI-Generated
- 19 hero card videos (from replicated-assets-numbered.zip)
- 19 hero poster images (auto-extracted from videos)
- 5 carousel videos (from replicated-b-series.zip)
- 3 carousel stacked images (from replicated-b-series.zip)
- 1 studio image

### Using Originals (keep per updated guidance — can reuse directly)
- 4 fonts (AntiqueLegacy 3 weights + FragmentMono)
- 10 icons/SVGs (logo, arrows, marks, etc.)
- 3 favicons
- 5 carousel video poster images
- 2 carousel article background PNGs

## Key Files
- src/app/page.tsx — main page composition
- src/app/layout.tsx — root layout with font preloads
- src/app/globals.css — design system tokens + @font-face
- src/components/HeroSection.tsx + .module.css
- src/components/CountdownSection.tsx + .module.css
- src/components/CarouselSection.tsx + .module.css
- src/components/RemoteSection.tsx + .module.css
- src/components/Footer.tsx + .module.css
- src/components/Header.tsx + .module.css
- src/components/WebGLScene/ (SceneManager, CameraController, InfiniteGrid, WireframeText, SceneObjects)
- reference/NOTES.md — detailed section-by-section reference notes
- reference/assets-to-replicate.md — full asset inventory
- reference/reference2.md — carousel + favicon assets
- steers.md — user direction log for PRD writing
- tests/webgl-scene.spec.ts — Playwright test script

## CSS Values from Original Site (cached at /tmp/)
- /tmp/shopify-design-source.html — full HTML source
- /tmp/shopify-design-index.css — page-specific CSS
- /tmp/shopify-design-global.css — global CSS with design tokens

## What Needs to Happen Next

### Immediate
1. Font conversion: AntiqueLegacy-Medium.woff2 → typeface JSON (user does via facetype.js)
2. Fix clock ring behavior — currently not perfectly matching original
3. Complete 3D scene Phase 3-4 (scroll camera, floating cards, post-processing)

### Before Submission
4. Mobile responsiveness pass (reference: shopify1.mp4 — user needs to copy this in)
5. Take desktop (1440×900) + mobile (390×844) screenshots
6. Write PRD.md BY HAND (use steers.md as reference — never auto-generate)
7. Write SETUP.md documenting replication process and asset sources
8. Update site.toml with live URL, tech stack, hosting
9. Deploy to Vercel: `npx vercel --prod`
10. Transfer Vercel project to AAI-Web Craft team
11. Import at codimango.com/admin/aai-hackathons/tasks

### Guidance Update (2026-05-04)
- Can reuse ALL original assets directly for first pass (no need to replace yet)
- Asset transformation/replacement is a NEXT STEP after 100% reproduction
- This means we can use original videos, images, fonts, icons as-is for now
