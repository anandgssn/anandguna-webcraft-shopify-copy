# Setup & Deployment Instructions

## Prerequisites

- Node.js 18+ 
- npm 9+

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The site should load with the intro animation sequence, followed by the hero section with project grid.

## Build for Production

```bash
# Build the Next.js application
npm run build

# Start production server
npm start
```

## Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy to production
npx vercel --prod
```

Or connect the GitHub repo to Vercel for automatic deployments on push.

The production deployment is available at
`https://anandguna-webcraft-shopify-copy.vercel.app`. The project is owned by
the **AAI -Web Craft** Vercel team and connected to the internal Codimango
GitHub repository. Its published `internal meta` firewall rule denies requests
outside Meta CIDRs `199.201.64.0/22` and `163.114.128.0/20`.

## Environment Variables

No environment variables required. This is a static frontend site with no backend or API dependencies.

See `.env.example` for reference (empty file).

## Assets and External Links

### Fonts
- **DM Serif Display**: Google Fonts (self-hosted in `/public/fonts/`)
- **Space Grotesk**: Google Fonts substitute for AntiqueLegacy (self-hosted)
- **Fragment Mono**: Google Fonts (self-hosted)

### Icons
- Shopify bag logo and UI icons: Original SVGs from shopify.design (functional elements, kept as-is)
- All icons in `/public/icons/`

### Images and Videos

- Local fallback images, videos, audio, fonts, icons, and WebGL models live under
  `public/` and are inventoried in `site.toml`.
- Project and editorial media currently use Shopify's public media CDN so the
  animated portfolio cards retain their intended content and timing.
- The footer's **Join Shopify** command opens the meaningful third-party Shopify
  careers page in a new tab. No runtime link points back to the reference site.

## Narration / Walkthrough Videos

- Temporary pending walkthrough: https://pxl.cl/pending

The final narrated walkthrough will cover:
- Intro animation sequence
- Hero section with project grid
- Countdown section with sticky behavior and ring animation
- Carousel drag interaction
- Remote section scroll reveals
- 3D WebGL mode entry and camera controls
- Responsive behavior on mobile

### Key Technical Decisions
- Used original CSS custom properties (--hero-fs, --page-gutter, etc.) for exact measurements
- Implemented clock algorithm from reverse-engineered JavaScript
- 3D mode uses Three.js with TextGeometry for headlines
- Canvas-based tile explosion for intro (not WebGL, matching original)
- Embla Carousel for drag interactions
- Lenis for smooth scrolling

## What Was Built

### Sections Implemented
1. **Intro Animation**: Word reveal + tile explosion + hero rise (3.3s sequence)
2. **Hero**: Headline, tagline, live indicator, 19 project cards in 3 columns
3. **Countdown**: Sticky "26" with animated ring, tick marks, clock hand, manifesto
4. **Carousel**: 10 cards (5 media, 3 stacked, 2 article), draggable
5. **Remote**: 8 location lines in staircase grid layout
6. **Footer**: Hiring CTA with Shopify Design branding

### Interactive Features
- 3D WebGL mode (headline click or capsule click)
- Video modal on card click
- Draggable carousel
- Floating capsule with 3D effect
- Favicon color cycling
- Smooth scroll throughout

## Browser Testing

Tested on:
- Chrome 120+ (macOS, Windows)
- Safari 17+ (macOS, iOS)
- Firefox 120+ (macOS, Windows)
- Mobile Safari (iOS 17+)
- Mobile Chrome (Android 14+)

## Performance Notes

- All animations use transform and opacity for 60fps
- Videos lazy-load via IntersectionObserver
- Fonts preloaded in layout.tsx
- Images optimized via Next.js Image component where applicable
- 3D mode disposes all objects on exit to free memory

## Troubleshooting

**Intro animation not playing:**
- Check browser console for errors
- Ensure fonts are loading (check Network tab)
- Try hard refresh (Cmd+Shift+R)

**3D mode not working:**
- Requires WebGL2 support
- Check browser console for Three.js errors
- Ensure typeface JSON exists at `/public/fonts/AntiqueLegacy-Medium.typeface.json`

**Videos not auto-playing:**
- Browser may block autoplay with sound (videos are muted)
- Check IntersectionObserver is working
- Verify video files exist in `/public/videos/`
