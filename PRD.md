# Artifact Design — Product Requirements Document

## 1. Product Overview

Artifact Design is the portfolio and culture site for Artifact, a distributed design collective crafting tools for independent commerce. The site presents Artifact’s philosophy, people, and work to attract design talent, demonstrate craft, and share the collective’s design culture with the community.

The experience is a single-page editorial and cinematic scroll. It opens with a dramatic intro sequence that reveals the brand statement `Make the new normal`, followed by a hero with oversized serif headline and a grid of 23 featured project videos. Scrolling reveals a sticky countdown clock, a draggable carousel of culture cards, a remote-office staircase, and a hiring footer. An optional fullscreen black wireframe 3D mode lets visitors explore the portfolio in depth. The entire product is a single route `/` with no subpages; the modal for a project uses a hash overlay on the same route.

The product qualities are confident, editorial, cinematic, and crafted. Typography is large and expressive, color is high-contrast with saturated accents, motion is smooth and purposeful, and the layout balances generous whitespace with dense information.

## 2. Audience and Core Experience

### Primary Audience

- Design talent evaluating Artifact as a potential employer and seeking to understand the collective’s philosophy and craft.
- Independent commerce merchants and partners discovering Artifact’s work and design culture.
- Design community peers seeking inspiration from Artifact’s process and public sharing.

### Main User Goals

- Understand what Artifact does and why it exists in one continuous read.
- Browse featured projects and watch project videos without leaving the page.
- Experience the collective’s craft through motion, 3D, and editorial pacing.

### Core User Flows

- **First sight:**
  - 4-word intro sequence (`Make` → `the` → `new` → `normal`) with popping scale and converging tracking
  - Radial tile explosion that clears to reveal hero
  - Hero content rises into place as tiles dissolve
  - Total intro ~3.3 seconds. No blank frame between intro and hero.
- **Browse projects:**
  - Hero headline `Make the new normal`
  - Tagline `How we work is changing shape. So is what's possible.`
  - Live indicator pulsing green dot `From Artifact`
  - Grid of 23 video cards (3 columns desktop, 2 columns mobile) with mixed landscape/portrait ratios
  - Cards animate in from offset positions
- **Watch a project:** Visitor clicks a card to open a fullscreen modal with the project video and native controls, white blurred backdrop, URL hash (e.g. `#hero-renaissance`), and locked background scroll. Backdrop click, `ESC`, or browser back closes the modal.
- **Follow the clock:**
  - 600vh sticky section
  - 1600px `26` stays centered
  - Orange ring draws progressively with 221 tick marks
  - Number counts `26` → `0` → `26`
  - Manifesto `Make commerce better for everyone`
  - Body `Every 26 seconds, a merchant makes their first sale`
  - Wipe reveal
- **Explore culture:** Visitor drags a horizontal row of 14 culture cards (8 media, 4 stacked, 2 article) centered in viewport, with momentum after release and auto-play when centered.
- **See remote:** Visitor sees `Remote by design` staircase with 5 locations (Toronto, Ottawa, New York, Montreal, Seattle) at staggered horizontal offsets, studio photo in New York line.
- **Finish:** Visitor reaches white footer `Help shape what comes next` with `Join Artifact` pill and hiring affordance.

### Emotional and Usability Qualities

- Confident, editorial, cinematic, and crafted with smooth, momentum-based scroll.
- Clear hierarchy: oversized display type, generous whitespace, and focused actions.
- Resilient: modal and scroll states restore without losing position; 3D mode is opt-in and disabled on mobile.

## 3. Global Design System

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| Black | `#000000` | Primary text, UI elements, footer button |
| White | `#FFFFFF` | Backgrounds, modal backdrop |
| Red | `#fe432a` | Remote headline, accents |
| Green | `#6bff91` | Live indicator pulsing dot |
| Orange | `#FF591D` | Clock ring and hand |
| Gray 200 | `#e5e5e5` | Borders, tick marks |
| Gray 500 | `#737373` | Secondary text |

### Typography

| Role | Font | Size | Weight | Style |
|------|------|------|--------|-------|
| Display Large (hero) | `DM Serif Display` | `clamp(64px, 11vw, 164px)` | `400` | Serif, generous tracking |
| Display (section) | `Space Grotesk` | `clamp(40px, 6vw, 56px)` | `500` | Sans, uppercase or title case |
| Heading | `Space Grotesk` | `40px` | `500` | Sans |
| Body | `Space Grotesk` | `20px` | `400` | Sans, comfortable leading |
| Callout | `Space Grotesk` | `22px` | `400` | Sans |
| Mono | `Fragment Mono` | `12px` to `14px` | `400` | Monospace, uppercase labels |

- Hero `Make the new normal` uses `DM Serif Display` at 164px desktop scaling to 64px mobile.
- Body and callout use `Space Grotesk` with comfortable leading.
- Mono labels use `Fragment Mono` for live indicator, state labels, and footer meta.

### Spacing and Layout

| Token | Desktop | Mobile |
|-------|---------|--------|
| Page gutter | `48px` | `16px` |
| Section spacing | `120px` | `64px` |
| Max width | `1440px` | `100%` |
| Card gap | `16px` | `16px` |

- Page is full-viewport width with centered max-width `1440px` and responsive gutters.
- Sections stack vertically with consistent spacing; hero grid uses 3 columns desktop, 2 columns mobile.
- Header is fixed top with navigation and Demo Night pill; footer is white with bottom padding `164px`.

### Shared Component Styles

- **Header pill `Demo Night`**: Black pill with white text, marquee text animation inside, fixed header.
- **Video card**: Rounded `24px`, 415×558px, rotated `-2deg` to `+2.5deg`, mixed aspect ratios, auto-play when centered in carousel or visible in grid.
- **Modal**: Fullscreen white blurred backdrop, centered video with native controls, hash URL, locked scroll, close via backdrop/`ESC`/back.
- **Clock ring**: Orange circular progress with 221 tick marks, hand ticks once per second, number `26` at `1600px`.
- **Carousel card**: Three variants — media (video + play button), stacked (3 overlapping photos), article (gradient + heading) — all draggable with momentum.
- **Remote staircase**: 5 location lines at staggered offsets, mono state labels, studio photo integrated into New York line, sequenced fade+slide.

### Motion and Transition System

- **Intro**: 4 words appear sequentially with popping scale (words start widely spaced and converge), then radial tile explosion from center with prismatic light, hero rises as tiles dissolve — total ~3.3s.
- **Card grid**: Cards animate in from offset positions on load with stagger.
- **Clock**: Number sticks for `600vh`, ring draws progressively, hand ticks per second, `26` → `0` → `26` countdown, wipe reveal left-to-right on scroll down (reverses on scroll up).
- **Carousel**: Drag with momentum, snap to centered card, videos auto-play when centered.
- **Remote**: Lines fade in + slide up `32px` with `100ms` stagger on scroll into view.
- **Modal**: Open/close with fade and backdrop blur; scroll lock while open.
- **3D mode**: Enter `700ms`, exit `600ms`, camera orbits on mouse, scroll moves forward/backward with fog.

### Responsive System

- **Breakpoints:** `768px` tablet, `1024px` desktop. Typography scales fluidly via `clamp()`.
- **Mobile:** Hero grid 2 columns, countdown number scales down, 3D mode and floating capsule hidden, carousel drag via touch, header Demo Night remains.
- **Touch targets:** Minimum `44px`.
- **No horizontal overflow** from `320px` to `1920px`.

### Media Treatment

- **Hero videos:** 23 project previews autoplay muted loop, mixed aspect ratios, cover centered.
- **Carousel videos:** 8 media cards with auto-play when centered, large background text (of 14 total).
- **Remote studio photo:** Integrated into New York line, cover centered.
- **3D mode:** Wireframe grid lattice, headlines as 3D wireframe text, project planes at varying depths, fog for depth, floating particles and cubes.
- **Grain and polish:** Subtle grain and high-contrast finish consistent across sections.

## 4. Global Accessibility Requirements

- Keyboard reachability: All cards, modal close, carousel drag via keyboard arrow, Demo Night pill, footer CTA, and navigation are operable via `Tab` and `Enter`/`Space`; modal traps focus while open.
- Visible focus: Focus indicators at least as prominent as hover for all interactive elements.
- Heading structure: Hero `Make the new normal` is `h1`; section headings (`Design in public`, `Remote by design`, `Help shape what comes next`) are `h2`; card titles are `h3` where appropriate.
- Landmarks: Header with `banner`, main with `main`, footer with `contentinfo`.
- Accessible names:
  - Card: `View project: <Title>`
  - Modal close: `Close`
  - Carousel: `Browse design culture cards`
  - Demo Night: `Join Demo Night`
  - Clock: decorative, `aria-hidden true`
  - 3D capsule: `Enter 3D view`
  - Remote locations: `View <City> location`
- Decorative hiding: Clock ring, tick marks, floating capsule, and 3D wireframe are `aria-hidden true` where decorative.
- Text contrast: Black on white and white on black meet AA; orange `#FF591D` on white used only for large graphics, not body text.
- Reduced motion: `prefers-reduced-motion: reduce` disables intro scale, tile explosion, and parallax; scroll becomes instant, animations collapse near-instant.
- Live regions: Modal open/close not announced as live; no audible autoplay.

## 5. Global Content and Data

### Brand and Product

- Product name `Artifact` and `Artifact Design` in hero and footer.
- Tagline: `How we work is changing shape. So is what's possible.`
- Live indicator: `From Artifact` with pulsing green dot.
- Footer: `ARTIFACT DESIGN` / `2026` + `Help shape what comes next` + `Join Artifact` + `Open Roles` + bag icon.

### Navigation

| Label | Destination | Type |
|-------|-------------|------|
| `Demo Night` | External event link | header pill |
| `Join Artifact` | Hiring destination | footer CTA |

### Project Grid Catalog (23 items)

| Title | Aspect | Type |
|-------|--------|------|
| `Hero Renaissance` | Landscape | Featured hero video |
| `Racing` | Portrait | Featured |
| `Tinker` | Landscape | Featured |
| `Sidekick` | Portrait | Featured |
| `Artifact` | Landscape | Featured |
| `OpenAI` | Portrait | Featured |
| Additional 17 project videos | Mixed | Grid cards |

- Each card shows video preview, title, and category; clicking opens modal with full video and hash route.
- Only the 6 listed titles are verified verbatim; remaining 17 are present as grid cards with video previews (total 23 = 8 + 7 + 8 across 3 columns, see `src/components/HeroSection.tsx` COL1/COL2/COL3).

### Carousel Catalog (14 cards)

| Variant | Count | Description |
|---------|-------|-------------|
| Media | 8 | Video thumbnail with play button and large background text |
| Stacked | 4 | Three overlapping event photos |
| Article | 2 | Gradient background with bold heading text |

- Card size `415 × 558px`, radius `24px`, rotation `-2deg` to `+2.5deg`.
- Videos auto-play when card is centered.

### Remote Locations

| City | State/Province | Country |
|------|----------------|---------|
| Toronto | Ontario | Canada |
| Ottawa | Ontario | Canada |
| New York | New York | USA |
| Montreal | Quebec | Canada |
| Seattle | Washington | USA |

### Asset Inventory

| Category | Location | Provenance / Source | Usage |
|----------|----------|---------------------|-------|
| Hero grid videos (23) + posters | `public/videos/hero/` 41 files (e.g. `card-hash-1b35.mp4`, `sidekick.mp4`) + `public/images/hero/` 56 images (e.g. `renaissance.jpg`, `card-hash-7e77.jpg`); served also via Shopify CDN `https://cdn.shopify.com/shopify-design-cms-media/media/` | Local public mirrors + Shopify Design CMS CDN (original shopify.design media, licensed/attributed to Shopify) | 23 hero cards (COL1 8 + COL2 7 + COL3 8 in `src/components/HeroSection.tsx`) previews and modal videos; posters as fallback |
| Carousel media (14 cards) | `public/videos/carousel/context.mp4`, `diveclub.mp4` + `public/images/carousel/` 27 images (e.g. `diamond.jpg`, `dinner-*.jpg`, `article-bg-*.png`, `context.jpg`) + CDN `https://cdn.shopify.com/shopify-design-cms-media/media/` (e.g. `katarina-dive-club-d.mp4`, `Comp%201…jpg`) | Local public + Shopify CDN (CMS media, same origin as hero) | 14 draggable carousel cards (8 media video, 4 stacked triple, 2 article) in `src/components/CarouselSection.tsx` |
| GLB 3D models (15) | `public/models/model4.glb`, `model5.glb`, `model7.glb`, `model8.glb`, `model10.glb`, `model11.glb`, `model12.glb`, `model13.glb`, `model14.glb`, `model15.glb`, `model16.glb`, `model17.glb`, `model18.glb`, `model19.glb`, `model20.glb` | Local copy from original shopify.design WebGL assets (floating objects, wireframe lattice) | Floating 3D objects `src/components/FloatingObjects.tsx` and wireframe overlay `InfiniteGrid.ts`; CSS wireframe fallback if missing |
| Fonts (4 woff2 + 1 json) | `public/fonts/AntiqueLegacy-Light.woff2`, `AntiqueLegacy-Regular.woff2`, `AntiqueLegacy-Medium.woff2`, `FragmentMono-Regular.woff2`, `AntiqueLegacy-Medium.typeface.json` | Shopify bespoke fonts Antique Legacy (display) + Fragment Mono (mono) — locally hosted WOFF2, sourced from shopify.design | Global typography: `AntiqueLegacy` for headlines/hero, `FragmentMono` for mono labels; 3D `typeface.json` for wireframe text |
| Icons (10) | `public/icons/logo.svg`, `logo-white.svg`, `shop-bag.svg`, `arrow-outward.svg`, `arrow-forward-white.svg`, `close.svg`, `design-mark-white.svg`, `expand-icon.svg`, `studio-logo.svg`, `marquee-icon.gif` | Local copy from shopify.design icon set (SVG, one GIF) | Header/footer logos, bag CTA, arrow, close modal, marquee, studio stamp, expand |
| Clock dial | `public/clock/clock-hand-dial.webp` | Local asset from original clock section | Tick hand texture for countdown clock |
| Hero & studio photos | `public/images/studio.jpg`, `studio.webp`, `public/studio.jpg` alias | Local studio photography from shopify.design | Remote staircase New York line + meta images |
| SFX / Audio (6) | `public/sfx/clock-tick.mp3`, `clock-tock.mp3`, `sfx-01.mp3`–`sfx-04.mp3` | Local SFX from original clock/tick experience | Clock tick/tock and intro tick sounds; no Shopify CDN audio |
| Favicons (42) | `public/favicons/favicon-32x32.png`, `favicon-16x16.png`, `apple-touch-icon.png` + 13 variant folders `01`–`13` each with 3 files + root `public/favicons/` | Local favicon set mirrored from shopify.design | Browser icons/manifest; served statically |
| CDN media (Shopify CMS) | `https://cdn.shopify.com/shopify-design-cms-media/media/` (e.g. `Screenshot%202026-05-14%20at%20…`, `2cfdb1d8…`, `katarina-dive-club…`, `1b358e50…`) | Shopify CDN — authoritative source for all hero thumbnail/poster images and hero/carousel videos (23 hero + 14 carousel) | Primary media for hero/carousel when available; local `public/videos` + `public/images` act as pre-cached mirrors/fallback posters |

- All assets are under root `/public` and served statically.
- Video assets are `MP4` `H.264`, images are `JPEG`/`WEBP`, fonts are `WOFF2`.
- Fallback: If video fails to load, show poster image with same aspect; if 3D assets fail, 3D mode shows wireframe fallback without texture.

## 6. Product Surfaces

### Route `/` — Single-Page Artifact Experience

- Purpose:
  - Present Artifact’s philosophy and work in a continuous scroll that can be read without navigation.
  - Let visitors browse projects, watch videos, and understand remote culture before hiring.

#### Intro Animation Region

- Content:
  - Four words `Make`, `the`, `new`, `normal` appear sequentially.
  - Brand statement `Make the new normal` as hero heading after intro.
- Structure, components, and assets:
  - Full-viewport intro layer centered, popping scale effect, words start widely spaced and converge.
  - Tile explosion from center with prismatic light clears to reveal hero; hero rises as tiles dissolve.
  - Uses `DM Serif Display` 164px desktop.
- Behavior / states:
  - Plays once on first load for ~3.3 seconds; thereafter hero is static.
  - Reduced motion shows hero without scale/tile animation.
- Responsive behavior:
  - Scales down proportionally on mobile; words remain centered.
- Accessibility notes:
  - Intro is decorative, hidden from assistive tech until hero is present; hero `h1` provides accessible name.

#### Hero Grid Region

- Content:
  - Headline `Make the new normal`.
  - Tagline `How we work is changing shape. So is what's possible.`
  - Live indicator `From Artifact` with pulsing green dot.
  - Demo Night pill `Demo Night` with marquee text.
  - Grid of 23 video cards (8+7+8) with mixed aspect ratios.
- Structure, components, and assets:
  - Hero centered with headline and tagline, live indicator top-left, Demo Night top-right.
  - Grid 3 columns desktop, 2 columns mobile, gap `16px`, max width `1440px`.
  - Cards `24px` radius, rotated slightly, video cover centered.
  - Assets: 23 hero videos/posters (CDN + local public/videos/hero + public/images/hero; see Asset Inventory).
- Behavior / states:
  - Cards animate in from offset positions on load.
  - Clicking a card opens modal (see Card Modal).
  - Hover shows subtle scale; focus shows outline.
- Responsive behavior:
  - Grid collapses to 2 columns below `768px`; typography scales via `clamp()`.
- Accessibility notes:
  - Cards are buttons with `aria-label View project: <Title>`; grid is landmark `region` with label `Featured projects`.

#### Card Modal Region

- Content:
  - Fullscreen video with native controls and title overlay.
  - Close affordance `Close` and backdrop.
- Structure, components, and assets:
  - Fixed fullscreen overlay with white blurred backdrop, centered video container with `24px` radius.
  - URL hash reflects project (e.g. `#hero-renaissance`).
  - Body scroll locked while open.
- Behavior / states:
  - Opens on card click, video auto-plays.
  - Closes on backdrop click, `ESC`, or browser back; URL hash cleared.
  - Focus trapped inside modal while open.
- Accessibility notes:
  - Modal has `role dialog` with `aria-label <Title>`, close button `aria-label Close`, focus returns to triggering card on close.

#### Countdown Clock Region

- Content:
  - Large `26` at `1600px`
  - Orange ring with 221 tick marks
  - Hand ticking once per second
  - Manifesto `Make commerce better for everyone`
  - Body `Every 26 seconds, a merchant makes their first sale`
  - CTA `Our design philosophy`
- Structure, components, and assets:
  - Sticky section `600vh` height, number centered, ring and tick marks around circumference, hand from center, text below number.
  - Assets: clock dial `clock-hand-dial.webp`.
- Behavior / states:
  - Number sticks while scrolling through `600vh`; ring draws progressively; `26` → `0` → `26` countdown; hand ticks per second; wipe reveal left-to-right on scroll down, reverses on scroll up.
- Responsive behavior:
  - Number scales down on mobile; ring and tick marks scale proportionally.
- Accessibility notes:
  - Clock is decorative `aria-hidden true`; manifesto and body are readable headings/paragraph.

#### Carousel Region

- Content:
  - Header `Design in public` with subheading `Ideas that shape Artifact’s design and how we share them`.
  - 10 draggable cards (5 media, 3 stacked, 2 article) with videos, photos, or gradient headings.
- Structure, components, and assets:
  - Header centered, cards horizontal row starting centered in viewport, size `415×558px`, `24px` radius, rotated `-2deg` to `+2.5deg`, gap `16px`.
  - Assets: 14 carousel cards — 8 media videos + 4 stacked triples + 2 article (CDN + public/images/carousel + public/videos/carousel; see Asset Inventory).
- Behavior / states:
  - Drag with mouse/touch, momentum after release, snap to centered card; videos auto-play when centered.
  - Keyboard arrow navigates between cards.
- Responsive behavior:
  - Drag via touch on mobile; cards remain `415×558px` with horizontal overflow scroll.
- Accessibility notes:
  - Carousel has `role region` with `aria-label Browse design culture cards`; cards are focusable.

#### Remote Staircase Region

- Content:
  - Headline `Remote by design` in red `#fe432a`.
  - 5 locations:
    - `Toronto — ONTARIO, CANADA`
    - `Ottawa — ONTARIO, CANADA`
    - `New York — NEW YORK, USA` (with studio photo `studio.jpg`)
    - `Montreal — QUEBEC, CANADA`
    - `Seattle — WASHINGTON, USA`
- Structure, components, and assets:
  - Staircase layout with each line at different horizontal offset, font `min(160px, 11.111vw)`, mono state labels `12px`.
  - Studio photo `studio.jpg` integrated into New York line, cover centered.
  - Assets: `studio.jpg`.
- Behavior / states:
  - Lines fade in + slide up `32px` with `100ms` stagger when section enters viewport.
- Responsive behavior:
  - Staircase offsets reduce on mobile but remain staggered; photo scales down.
- Accessibility notes:
  - Locations are list items with accessible names; photo has alt `Artifact studio in New York`.

#### Footer Region

- Content:
  - Top bar `ARTIFACT DESIGN` left, `2026` right, horizontal rule.
  - Headline `Help shape what comes next` left-aligned.
  - CTA `Join Artifact` black pill `56px` height with bag icon and `Open Roles` sublabel.
- Structure, components, and assets:
  - White background, bottom padding `164px`, left-aligned, max width `1440px`, gutter `48px`.
  - Assets: `bag.svg`.
- Behavior / states:
  - Content fades in on scroll into view; CTA hover shows highlight.
- Accessibility notes:
  - Footer has `contentinfo` landmark; CTA is link with `aria-label Join Artifact — Open Roles`.

#### 3D WebGL Mode (Overlay)

- Content:
  - Fullscreen black overlay with wireframe grid lattice, headlines as 3D wireframe text, project planes at varying depths, floating particles and cubes.
- Structure, components, and assets:
  - Fixed fullscreen overlay, wireframe grid (floor, walls, depth lines), headlines `Make the new normal` as wireframe, project planes textured, fog for depth.
  - Trigger: click and hold `Make the new normal` or click floating capsule `64×64px` bottom-right.
- Behavior / states:
  - Enter `700ms`, exit `600ms`; mouse orbits camera, scroll moves forward/backward; `ESC` exits; disabled on mobile.
  - Floating capsule `64×64px` pill, gradient, continuous float animation, hidden on mobile.
- Accessibility notes:
  - Overlay has `role dialog` with `aria-label 3D view`; decorative wireframe `aria-hidden true` where appropriate.

## 7. Acceptance Criteria

### Intro and Hero

- Intro sequence of 4 words with popping scale and converging tracking plays on first load and clears via radial tile explosion to reveal hero without blank frame.
- Hero shows `Make the new normal` at 164px desktop (scales down mobile), tagline, live indicator with pulsing dot, and 23 video cards in 3 columns desktop / 2 columns mobile with mixed aspect ratios.

### Card Interaction

- Clicking any of the 23 cards opens a fullscreen modal with video auto-play, white blurred backdrop, hash URL, and locked scroll; backdrop/`ESC`/back closes it and focus returns.

### Clock

- Sticky `600vh` clock section shows `26` at `1600px`, orange ring with 221 tick marks drawing progressively, hand ticking per second, countdown `26` → `0` → `26`, with wipe reveal.

### Carousel

- Horizontal draggable row of 14 cards (8 media, 4 stacked, 2 article) centered initially, drag with momentum, auto-play when centered, keyboard navigable.

### Remote and Footer

- Remote staircase shows 5 locations at staggered offsets with mono state labels and studio photo in New York line, sequenced fade+slide.
- Footer shows `ARTIFACT DESIGN` / `2026`, `Help shape what comes next`, and `Join Artifact` pill `56px` with bag icon, left-aligned.

### 3D Mode

- Holding `Make the new normal` or clicking floating capsule enters fullscreen black wireframe 3D mode (`700ms`), mouse orbits, scroll moves, `ESC` exits (`600ms`), hidden on mobile.

### Responsive and Accessibility

- No horizontal overflow `320px` to `1920px`; touch targets `44px`; carousel drag works on touch; 3D/capsule hidden on mobile.
- All interactive elements keyboard operable with visible focus; modal traps focus; decorative 3D/clock `aria-hidden` where appropriate; reduced-motion disables intro and parallax.
