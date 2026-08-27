# Shopify Design Web Craft

An interactive portfolio for a distributed product-design collective. The
single-page experience combines an animated project gallery, a scroll-driven
countdown, draggable editorial stories, remote-studio typography, video
previews, and an optional spatial WebGL view.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Production builds and checks run with:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

The focused WebGL interaction suite expects the app at port `3456`:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3456
npx playwright test tests/webgl-scene.spec.ts
```

## Deployment

- Production: `https://anandguna-webcraft-shopify-copy.vercel.app`
- Owner: **AAI -Web Craft**
- Source: `codimango/anandguna-webcraft-shopify-copy`
- Access: published `internal meta` firewall rule allowing only
  `199.201.64.0/22` and `163.114.128.0/20`

See [SETUP.md](SETUP.md) for the full local setup, deployment notes, asset
inventory, testing scope, and walkthrough status.
