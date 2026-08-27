# Assets to Replicate

## Priority 1: Hero Card Videos (19)
Each is a ~5-15 second looping video shown in the hero grid cards.
Use Manus/Veo or similar to generate replacement videos matching the visual style.

| Name | Description | Duration | Original CDN URL |
|------|-------------|----------|-----------------|
| renaissance | Classical painting scene, Baroque art with overlay text | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/f0b176459b1f4b70944c29b2ee1199f2/...SD-480p...mp4` |
| racing | Green race car with neon outlines, merchandise floating | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/b4aa3c14ebaa4f9ab37581d4eff2c821/...SD-480p...mp4` |
| tinker | Colorful UI elements, playful animation | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/437622b036d94878a2ee612cdc37b62d/...SD-480p...mp4` |
| visual-search | Mobile app UI showing visual search | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/6eb7750f700b4aa495c1f760437f4172/...SD-480p...mp4` |
| immersive-search | Dark purple immersive search UI | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/1d2e7cf086874ef38ad6724985a7c250/...SD-480p...mp4` |
| shop-web | Light beige web interface | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/62468346d8124b80bbf09bf694fd0693/...SD-480p...mp4` |
| shop-app-cards | Mobile app card stacks UI | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/27c802122bee460596d01b721afaa1d0/...SD-480p...mp4` |
| product-spotlight | Product photography with spotlight | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/10391f07beeb4eec96dc4939d9b5be06/...SD-480p...mp4` |
| send-money | Financial send money UI | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/1d8d21f862c04e0eb0ca98c045d72f99/...SD-480p...mp4` |
| text-strings | Typography/text animation | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/33aeeb20a9ba491fb89c825ef449c70c/...SD-480p...mp4` |
| openai | OpenAI integration dark UI | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/f5a5e25447844325a02ea90381d0ce40/...SD-480p...mp4` |
| carousel | Dark carousel/card UI | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/d54d0068dcc34872b2c0763d3f4e321f/...SD-480p...mp4` |
| sidekick | Sidekick AI assistant UI | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/7e77055da5174bdbb4a1f623f333ae36/...SD-480p...mp4` |
| artifact | Artifact branding, dark bg | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/1b358e5079a74f4da68611480133e0cc/...SD-480p...mp4` |
| card-sorting | Card sorting interaction | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/562007d0b67b419fa723e5f6ebc68c39/...SD-480p...mp4` |
| agentic-search | Agentic search UI | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/f8b96401d22446258a24e5f84e64483c/...SD-480p...mp4` |
| shopify-logo-anim | Logo animation frames | ~5s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/c827080fa2e342879c8c88510702444d/...SD-480p...mp4` |
| type-pill | Typography pill button animation | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/555ec3e877ac4dd3a02a4e145daff3e5/...SD-480p...mp4` |
| shop-card-stacks | Card stack interaction | ~10s | `pds-shop-design.myshopify.com/cdn/shop/videos/c/vp/d26134546b0f4bd096ff696d4cbac166/...SD-480p...mp4` |

## Priority 2: Fonts (4)
Need free/open-source substitutes before final submission.

| Font | Weight | Usage |
|------|--------|-------|
| AntiqueLegacy-Medium | 500 | Headlines, display text |
| AntiqueLegacy-Regular | 400 | Body text, taglines |
| AntiqueLegacy-Light | 300 | Light body text |
| FragmentMono-Regular | 400 | Labels, metadata (this one is open-source on Google Fonts) |

## Priority 3: Studio Image (1)
| Name | Description |
|------|-------------|
| studio.webp | Interior photo of Shopify Design studio in New York (wood, bookshelves, conference table) |

## Lower Priority: Icons/SVGs (10)
These are functional UI elements. May be OK to keep for a replication exercise — check with hackathon organizers.

- logo.svg — Shopify Design wordmark
- logo-white.svg — White version
- arrow-outward.svg — Up-right arrow
- arrow-forward-white.svg — Forward arrow (white)
- design-mark-white.svg — Shopify design mark
- shop-bag.svg — Shopping bag icon
- close.svg — Close/X icon
- studio-logo.svg — Studio wordmark
- expand-icon.svg — Expand arrows
- marquee-icon.gif — Animated GIF for Demo Night pill

## How to Replace
1. Drop replacement files into the same paths in `public/`
2. Keep the same filenames — no code changes needed
3. For videos: MP4 format, ~480p, 5-15 seconds, looping
4. For images: JPG, similar dimensions to originals
5. For fonts: WOFF2 format, update @font-face in globals.css if font-family name changes
