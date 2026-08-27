# Shopify.design Reference Notes
# Built from 91 video frames extracted at 2fps from user recording

## GLOBAL

### Font
- AntiqueLegacy — a BOLD SANS-SERIF grotesque (NOT serif)
- Very heavy weight, extremely tight letter-spacing (-0.04em)
- Used everywhere: headlines, body, buttons
- Substitute: Space Grotesk (700 for headlines, 300-400 for body)
- Mono font: Fragment Mono for labels/metadata

### Colors
- Background: #fff (white)
- Text: #000 (pure black)
- Red accent: #FE432A
- Green accent: #6BFF91 (live dot, Shopify green)
- Grey muted: #6F7680
- Border: #e6e6e6

### Layout
- Max width: ~1440px
- Side padding: ~80px from edges (page gutter)
- Mobile breakpoint: 768px

---

## SECTION 1: HEADER (ref: 01-hero-headline.jpg)

- Position: absolute top, full width
- Left: Shopify bag icon (~20px black) + "design" lowercase, ~16px, regular weight
- Right: Pill button group
  - Main pill: scrolling marquee text "Night Vol. 2 · Demo Night Vol. 2 · " + small animated GIF icon + "Apr 22" muted text
  - Arrow pill: 44x44 circle with ↗ arrow
  - Both pills: white bg, 1px border rgba(0,0,0,0.1), subtle shadow
- Padding: ~80px from left, ~48px from top

## SECTION 2: HERO HEADLINE (ref: 01-hero-headline.jpg)

- "Make the" line 1
- "new normal" line 2
- Font: headline font, weight 700, MASSIVE size
- Size fills ~85% of viewport width (~220px per line on 1440px viewport)
- Text-align: center
- Line-height: ~0.85 (very tight between lines)
- Color: pure black
- Top padding from header: ~100-120px

## SECTION 3: HERO TAGLINE (ref: 01-hero-headline.jpg)

- "How we work is changing shape. So is what's possible."
- Centered, ~18-20px font size
- Regular/light weight (300-400)
- Color: slightly muted (#1A1A1A or #666)
- Gap from headline: ~40-60px

## SECTION 4: LIVE BAR (ref: 02-hero-livebar.jpg)

- Full width within page gutters
- Left: green dot (~6px, #6BFF91) + "LIVE" uppercase mono ~12px
- Center: thin horizontal line (#e6e6e6, 1px)
- Right: "FROM ARTIFACT" uppercase mono ~12px + Artifact logo
  - Logo: small dark rounded square (~28x28) with white geometric shape inside
- Positioned about 80% down from hero top, with big gap below tagline

## SECTION 5: HERO GRID (ref: 03-hero-grid.jpg, 04-hero-grid-detail.jpg)

- 3 columns of cards on WHITE background
- Cards have rounded corners ~16-20px
- Card gap: ~20px between cards, ~20px between columns
- Column stagger: col2 starts ~60px below col1, col3 starts ~120px below col1
- Cards contain REAL design work content (videos/images):
  - Col1 row1: "Renaissance" — classical painting (Baroque art scene, warm tones)
  - Col1 row2: "Shopify Racing" — race car with green neon on dark bg, merchandise
  - Col2 row1: (gap/offset)
  - Col2 row2: "Inventory New" — pink/magenta bold typography on gray bg, chrome 3D objects
  - Col3 row1: "Sidekick" — iPhone mockup showing Shopify Sidekick UI
  - Col3 row2: "Artifact" — dark bg with Artifact logo in center, product card UI
- Card aspect ratios: landscape (~1.2:1) and portrait (~0.59:1) mixed
- NO labels overlaid on the cards — just the image/video content filling the card

## SECTION 6: COUNTDOWN / CLOCK (ref: 05-countdown-clock.jpg)

- Sticky section — "26" stays pinned while you scroll
- "26" is ENORMOUS — digits fill ~80% of viewport width
- Only bottom/middle portions visible (clipped at top/sides)
- Clock face:
  - Thin red circle (#FF591D) — the clock ring
  - 60 tick marks around circumference (small lines at edges)
  - Every 5th tick (hour marks) is slightly longer
  - Thick red clock hand from center outward (~4-6px wide, #FF591D)
  - Hand rotates continuously
- Manifesto at bottom (overlaying the clock):
  - Left: "Make commerce better for everyone." — headline font, ~40px, weight 700
  - Right: "Every 26 seconds, a merchant makes their first sale on Shopify. That kind of scale changes the job and how we approach design." — lighter weight (300), ~20px, line-height 1.4
  - Below body text: BLACK pill button with small Shopify icon + "Our design philosophy" + separate round arrow button

## SECTION 7: CAROUSEL (need more frames — not clearly visible in current reference)

- "Design in public" headline in display size
- Horizontal scrolling cards
- Cards are colorful with unique bg colors and content

## SECTION 8: REMOTE / CITIES (ref: 06-remote-cities.jpg, 07-remote-top.jpg)

- Stacked lines of city names in MASSIVE display type
- PROGRESSIVE INDENTATION — each line is indented further right:
  - "Remote" — left-aligned, RED
  - "by design." — indented right, RED
  - "Together in" — left-aligned, BLACK
  - "Toronto" — indented right, with "ONTARIO, CANADA" label
  - "Ottawa" — more indented right, with "ONTARIO, CANADA" label to the LEFT of the word
  - "New [studio image] York" — indented, image between words, "NEW YORK, USA" label far right
  - "Montreal" — very indented right, "QUEBEC, CANADA" label to LEFT
  - "Seattle" — indented, "WASHINGTON, USA" label

- Studio image between "New" and "York": ~200x120px, rounded 12px, shows interior office/studio photo, has a small "studio" label overlay with expand icon
- Font: same grotesque, weight 700, display size (~164px desktop)
- Line-height: ~0.85
- The indentation creates a cascading/staircase visual effect

## SECTION 9: FOOTER (ref: 08-footer.jpg)

- WHITE BACKGROUND (NOT dark!)
- Top bar: "SHOPIFY" bold + "DESIGN" muted, in mono font ~14px, uppercase
- "2026" on the right, same font
- Thin horizontal rule (#e6e6e6)
- "Help shape what comes next" — LEFT-ALIGNED (not centered!), ~40-48px, bold sans-serif
- "Join Shopify [bag icon] Open Roles" — LEFT-ALIGNED pill button below
- LARGE 3D capsule on the RIGHT side (~100-150px tall, purple/blue/red gradient)
- Generous whitespace above and below

## SECTION 10: 3D TRANSITION (ref: 09-3d-transition.jpg, 10-3d-transition-deep.jpg)

- This is a SCROLL TRANSITION between Remote and Footer sections
- Dark/black background
- Perspective wireframe grid floor
- 3D wireframe text outlines floating in space
- Glowing light particles/dots scattered
- Small 3D cube objects
- The Remote section text transforms INTO this 3D scene as you scroll
- This is the most complex element — custom WebGL/Three.js
- PHASE 2: approximate with CSS, don't block the rest of the build

## FLOATING CAPSULE

- Present throughout the site in bottom-right corner
- ~28x56px pill/capsule shape
- 3D rendered look with gradient (green+black or purple+red+blue depending on section)
- Subtle floating animation
- In the footer, a LARGER version (~150px) appears on the right side of the content
