# Intro Animation — Frame-by-Frame Analysis

Based on 251 frames extracted at 30fps from screen_load.mov.

## Timeline

### Phase 1: White blank (frames 70-109, ~1.3s)
Pure white screen while WebGL scene initializes.

### Phase 2: Word reveal with shapes (frames 110-130, ~0.7s)
- Frame 110: Tiny black SQUARE appears left-center, tiny black CIRCLE appears right-center
- Frame 115: "Make" text appears next to square (still small). Circle on right for "the". Small circle lower-left for "new", small square lower-right for "normal"
- Frame 120: "Make" larger. "the" appeared with circle. "new" visible with circle. "normal" starting
- Frame 125: All 4 words visible, scaling up. Still spread apart with adjacent shapes
- Frame 130: Text near final massive size. Words settled into two lines, centered on viewport

### Phase 3: Text fills viewport (frames 130-140, ~0.3s hold)
"Make the new normal" fills the viewport at enormous scale, centered vertically. No other elements visible.

### Phase 4: THE EXPLOSION (frame 145, ~0.2s)
THIS IS THE KEY MOMENT:
- Background INSTANTLY goes BLACK with WebGL dot grid visible
- Multi-scale BLACK TILES appear in a checkerboard-like pattern (1x1, 2x2, 3x3 tiles from the GLSL shader)
- Some WHITE TILES remain (revealing page content beneath)
- MASSIVE WHITE STARBURST emanates from CENTER with radial light rays
- Text "Make the new normal" visible BEHIND the tiles, dimmed
- Chromatic aberration visible on text edges (RGB fringing)
- The tagline "How we work is changing shape..." visible

### Phase 5: Starburst expanding (frame 150, ~0.3s)
- Starburst LARGER, filling more of center
- Dark background with dot grid
- White tiles starting to dominate
- Radial light rays prominent

### Phase 6: Tiles revealing page (frame 160, ~0.3s)
- Mix of black and white tiles — white shows normal page content
- Center starburst fading
- Text at normal page scale in white areas
- Remaining dark tiles have dot grid

### Phase 7: Page emerging (frame 170, ~0.3s)
- Most page visible (white background)
- A few remaining dark/glitchy tiles at edges
- Cyan/blue colored tiles on sides
- Text at final size but slightly lower (hero-rise in progress)

### Phase 8: Cards flying in (frame 180, ~0.3s)
- Almost all tiles gone
- Cards appearing at bottom, flying from offset positions
- Hero section still rising upward

### Phase 9: Settling (frames 190-200, ~0.5s)
- Last 2-3 tiles disappearing
- Page nearly complete
- Cards in position

### Phase 10: Final state (frames 210+)
- Fully settled page

## Key Technical Components

1. **Word reveal (CSS)**: wr-shape (square/circle) + wr-text (scale 0.35→1.0) with step-end timing
2. **Tile reveal shader (WebGL GLSL)**: Multi-scale tiles (20 columns, hash-based 1x1/2x2/3x3) with radial spawn from center
3. **Starburst (WebGL)**: Central radial burst with light rays — likely the "electric edge" shader pass
4. **Chromatic aberration (WebGL post-processing)**: RGB fringing during explosion
5. **Hero rise (CSS)**: translateY from center to final position, easeInOutQuint, 1.9s
6. **Card fly-in (CSS)**: From offset positions, staggered delays, easeOutExpo
7. **Header fade (CSS)**: From top:-40px, 0.8s delay 2.7s
8. **Live bar clip-path (CSS)**: Left-to-right wipe, 1.6s delay 2.6s
