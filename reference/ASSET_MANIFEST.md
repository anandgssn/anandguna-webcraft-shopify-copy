# Asset Manifest

Purpose: local production assets needed to recreate the captured `shopify.design` look without reusing Shopify's proprietary media.

Scope: based on current desktop references in `reference/sections/` and the mobile recording frames in `reference/mobile-frames/shopify1/`.

## Rules

- Treat Shopify media as reference only.
- Ship local assets from `public/assets/` only.
- Prefer AI-generated or original replacements for all photography, video, and 3D renders.
- Reuse the same asset set across desktop and mobile with separate poster crops when needed.

## Proposed Folder Layout

```text
public/assets/
  brand/
  intro/
  hero/
  carousel/
  remote/
  footer/
  shared/
```

## Brand And UI Assets

| ID | File | Type | Count | Notes | Reference |
| --- | --- | --- | --- | --- | --- |
| B01 | `brand/shopify-design-lockup.svg` | SVG | 1 | Shopify bag icon + `design` wordmark, tight spacing | `reference/sections/01-hero-headline.jpg` |
| B02 | `brand/artifact-glyph.svg` | SVG | 1 | Small dark rounded-square Artifact glyph for live bar | `reference/sections/02-hero-livebar.jpg` |
| B03 | `shared/arrow-up-right.svg` | SVG | 1 | Header CTA arrow | `reference/sections/01-hero-headline.jpg` |
| B04 | `shared/play-triangle.svg` | SVG | 1 | Carousel media cards | mobile frames + carousel section |
| B05 | `shared/studio-expand.svg` | SVG | 1 | Small expand/link icon on remote studio inset | `reference/sections/06-remote-cities.jpg` |

## Intro / Splash Assets

These are mostly procedural, not downloaded media.

| ID | File | Type | Count | Notes | Reference |
| --- | --- | --- | --- | --- | --- |
| I01 | `intro/noise-soft.png` | PNG texture | 1 | Very subtle grain/noise for splash/glitch polish | `reference/mobile-frames/shopify1-contact-sheet.jpg` |
| I02 | `intro/chromatic-smear.png` | PNG texture | 1 | Optional RGB smear texture if not generated procedurally | `reference/mobile-frames/shopify1-contact-sheet.jpg` |
| I03 | `intro/ink-burst-mask.png` | PNG alpha mask | 1 | Optional radial/burst mask for center reveal | `reference/mobile-frames/shopify1-contact-sheet.jpg` |

Implementation note: the splash itself should be mostly code-driven. The headline, white field, distortion, burst, and fade can be procedural.

## Hero Assets

Priority is the visible top-of-page card set. Each hero card should have:

- looping video version when possible: `.mp4` and `.webm`
- fallback poster: `.jpg` or `.webp`
- mobile-safe crop if the desktop crop fails in narrow cards

Suggested sizes:

- landscape cards: `800x660`
- portrait cards: `600x1020`

### Hero Priority Cards

| ID | File | Type | Count | Notes | Reference |
| --- | --- | --- | --- | --- | --- |
| H01 | `hero/renaissance-loop.{mp4,webm}` + poster | video + poster | 1 | Classical painting / commerce UI composite | `reference/sections/03-hero-grid.jpg` |
| H02 | `hero/racing-loop.{mp4,webm}` + poster | video + poster | 1 | Dark race car / neon green / merch composition | `reference/sections/03-hero-grid.jpg` |
| H03 | `hero/inventory-loop.{mp4,webm}` + poster | video + poster | 1 | Bold magenta typography + chrome object composition | `reference/sections/03-hero-grid.jpg` |
| H04 | `hero/sidekick-loop.{mp4,webm}` + poster | video + poster | 1 | iPhone mockup / Sidekick UI composition | `reference/sections/03-hero-grid.jpg` |
| H05 | `hero/artifact-loop.{mp4,webm}` + poster | video + poster | 1 | Dark card / logo / product UI composition | `reference/sections/03-hero-grid.jpg` |
| H06 | `hero/grid-fill-01.{mp4,webm,jpg}` | video + poster | 1 | Additional card for below-fold continuity | `reference/sections/04-hero-grid-detail.jpg` |
| H07 | `hero/grid-fill-02.{mp4,webm,jpg}` | video + poster | 1 | Additional card for below-fold continuity | `reference/sections/04-hero-grid-detail.jpg` |
| H08 | `hero/grid-fill-03.{mp4,webm,jpg}` | video + poster | 1 | Additional card for below-fold continuity | `reference/sections/04-hero-grid-detail.jpg` |

## Carousel Assets

This section needs local replacements that feel like design talks, events, and editorial cards. Avoid stock-photo randomness.

### Media Cards

Each media card wants:

- portrait speaker thumbnail or short loop
- rounded-corner frame
- slight rotation
- optional local poster fallback

Suggested size:

- portrait speaker thumb: `480x560`

| ID | File | Type | Count | Notes |
| --- | --- | --- | --- | --- |
| C01 | `carousel/context-speaker.{mp4,webm,jpg}` | video + poster | 1 | Speaker portrait for `Context` |
| C02 | `carousel/dive-club-speaker.{mp4,webm,jpg}` | video + poster | 1 | Speaker portrait for `Dive Club` |
| C03 | `carousel/double-diamond-speaker.{mp4,webm,jpg}` | video + poster | 1 | Speaker portrait for `Double Diamond` |
| C04 | `carousel/sneak-peek-speaker.{mp4,webm,jpg}` | video + poster | 1 | Speaker portrait for `Sneak Peek` |
| C05 | `carousel/kinference-speaker.{mp4,webm,jpg}` | video + poster | 1 | Speaker portrait for `Kinference` |

### Stacked Event Cards

Suggested size:

- square stills: `540x540`

| ID | File | Type | Count | Notes |
| --- | --- | --- | --- | --- |
| C06 | `carousel/demo-night-01.jpg` | still | 1 | Stage / speaker event photo |
| C07 | `carousel/demo-night-02.jpg` | still | 1 | Audience / room event photo |
| C08 | `carousel/demo-night-03.jpg` | still | 1 | Secondary talk / detail shot |
| C09 | `carousel/dinner-01.jpg` | still | 1 | Team dinner / table photo |
| C10 | `carousel/dinner-02.jpg` | still | 1 | Group dinner / candid photo |
| C11 | `carousel/dinner-03.jpg` | still | 1 | Toast / close-up photo |
| C12 | `carousel/eoy-01.jpg` | still | 1 | End-of-year gathering photo |
| C13 | `carousel/eoy-02.jpg` | still | 1 | Team social photo |
| C14 | `carousel/eoy-03.jpg` | still | 1 | Venue / environment photo |

### Article Cards

| ID | File | Type | Count | Notes |
| --- | --- | --- | --- | --- |
| C15 | none required | procedural | 1 | `Building Artifact` should be typography on deep blue, no photo required |
| C16 | none required | procedural | 1 | `Deciding to move faster` can stay typographic if it matches reference |

## Countdown Assets

No external media required for the core clock.

| ID | File | Type | Count | Notes |
| --- | --- | --- | --- | --- |
| D01 | none required | procedural SVG/CSS | 1 | Clock ring, ticks, rotating hand |
| D02 | `brand/shopify-bag-mini.svg` | SVG | 1 | Small icon inside philosophy CTA |

## Remote Section Assets

| ID | File | Type | Count | Notes | Reference |
| --- | --- | --- | --- | --- | --- |
| R01 | `remote/studio-inset.jpg` | still | 1 | Interior office/studio image placed between `New` and `York` | `reference/sections/06-remote-cities.jpg` |
| R02 | `shared/studio-inset-mobile.jpg` | still | 1 | Mobile crop of the same studio inset | mobile recording |

## Footer Assets

| ID | File | Type | Count | Notes | Reference |
| --- | --- | --- | --- | --- | --- |
| F01 | `footer/capsule-large.{webp,png}` | render | 1 | Large glossy capsule render on the right | `reference/sections/08-footer.jpg` |
| F02 | `shared/capsule-small.{webp,png}` | render | 1 | Small floating capsule used elsewhere on page | desktop + mobile refs |

## 3D Transition Assets

This section should be mostly procedural. Do not block the rebuild on it.

| ID | File | Type | Count | Notes |
| --- | --- | --- | --- | --- |
| T01 | `shared/noise-grid.png` | optional texture | 1 | Optional texture for wireframe/grid polish |
| T02 | `shared/glow-particle.png` | optional sprite | 1 | Optional particle sprite for glow dots |

Implementation note: grid floor, particles, and perspective should be code-driven. Local textures are optional.

## Mobile-Specific Asset Needs

| ID | File | Type | Count | Notes |
| --- | --- | --- | --- | --- |
| M01 | `intro/splash-mobile-timing.json` | notes/data | 1 | Sequence timings captured from mobile reference |
| M02 | `hero/*-mobile-poster.jpg` | posters | 4-8 | Safe crops for narrow mobile cards |
| M03 | `carousel/*-mobile-poster.jpg` | posters | 5 | Safe crops for speaker cards on mobile |

## Minimum Viable Asset Pack

If we only do the top of page first, the minimum set is:

- B01, B02, B03
- H01, H02, H03, H04, H05
- I01 or fully procedural splash

If we extend through carousel, add:

- C01-C05
- C06-C14

## Current Reference Inputs

- Desktop stills:
  - `reference/sections/01-hero-headline.jpg`
  - `reference/sections/02-hero-livebar.jpg`
  - `reference/sections/03-hero-grid.jpg`
  - `reference/sections/04-hero-grid-detail.jpg`
  - `reference/sections/05-countdown-clock.jpg`
  - `reference/sections/06-remote-cities.jpg`
  - `reference/sections/07-remote-top.jpg`
  - `reference/sections/08-footer.jpg`
  - `reference/sections/09-3d-transition.jpg`
  - `reference/sections/10-3d-transition-deep.jpg`
- Mobile frames:
  - `reference/mobile-frames/shopify1/`
  - `reference/mobile-frames/shopify1-contact-sheet.jpg`
