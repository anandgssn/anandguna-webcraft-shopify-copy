import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const OUT_DIR = "/tmp/shopify-countdown-captures";
const VIEWPORT = { width: 1440, height: 900 };
const LOCAL_URL = process.env.LOCAL_URL ?? "http://localhost:3456";
const ORIGINAL_URL = process.env.ORIGINAL_URL ?? "https://shopify.design";
const HEADLESS = process.env.PW_HEADLESS !== "0";
const CHANNEL = process.env.PW_CHANNEL;

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`Capture countdown comparison screenshots.

Usage:
  npm run capture:countdown

Environment:
  LOCAL_URL=http://localhost:3456
  ORIGINAL_URL=https://shopify.design
  PW_CHANNEL=chrome        Use system Chrome instead of bundled Chromium
  PW_HEADLESS=0            Run headed if headless Chromium is blocked

Output:
  ${OUT_DIR}/local-0.png ... local-5.png
  ${OUT_DIR}/original-0.png ... original-5.png`);
  process.exit(0);
}

async function launchBrowser() {
  const options = { headless: HEADLESS };
  if (CHANNEL) options.channel = CHANNEL;

  try {
    return await chromium.launch(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to launch Playwright Chromium. If this is macOS Mach port permission ` +
        `failure, retry with PW_CHANNEL=chrome or PW_HEADLESS=0.\n\n${message}`
    );
  }
}

async function findCountdownMetrics(page) {
  return page.evaluate(() => {
    const stage =
      document.querySelector(".countdown-stage") ??
      [...document.querySelectorAll("div")].find(
        (el) => el.getBoundingClientRect().height > window.innerHeight * 5
      );

    if (!stage) return null;

    const rect = stage.getBoundingClientRect();
    return {
      stageTop: rect.top + window.scrollY,
      stageHeight: rect.height,
      viewportH: window.innerHeight,
      className: stage.className,
    };
  });
}

async function captureSeries(url, prefix) {
  const browser = await launchBrowser();
  const page = await browser.newPage({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(1_000);

  const metrics = await findCountdownMetrics(page);
  if (!metrics) {
    await browser.close();
    throw new Error(`Could not find countdown stage on ${url}`);
  }

  const stickyEnd = metrics.stageTop + metrics.stageHeight - metrics.viewportH;
  const progressPoints = [0, 0.12, 0.25, 0.5, 0.75, 1];
  const scrollPositions = progressPoints.map((p) =>
    Math.round(metrics.stageTop + (stickyEnd - metrics.stageTop) * p)
  );

  for (let i = 0; i < scrollPositions.length; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollPositions[i]);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${OUT_DIR}/${prefix}-${i}.png` });
  }

  console.log(`${prefix}: ${JSON.stringify(metrics)}`);
  await browser.close();
}

mkdirSync(OUT_DIR, { recursive: true });
await captureSeries(LOCAL_URL, "local");
await captureSeries(ORIGINAL_URL, "original");
console.log(`Screenshots written to ${OUT_DIR}`);
