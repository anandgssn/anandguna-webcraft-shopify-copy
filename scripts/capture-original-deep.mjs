import { chromium } from "playwright";
import { execSync } from "child_process";

const BASE = "https://shopify.design";
const DIR = "screenshots/original-deep";
const INTERVAL = 1000;
const DURATION = 180000; // 3 minutes

async function run() {
  execSync(`mkdir -p ${DIR}`);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    args: ["--start-fullscreen"],
  });
  const context = await browser.newContext({
    viewport: null,
  });
  const page = await context.newPage();

  console.log("Loading shopify.design...");
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(8000);

  console.log("\n========================================");
  console.log("  YOU HAVE 3 MINUTES — 1 frame/second");
  console.log("  Click and hold the headline.");
  console.log("  Explore slowly through each section.");
  console.log("  Suggested order:");
  console.log("    1. Hold headline — look at text up close");
  console.log("    2. Orbit slowly left/right/up/down");
  console.log("    3. Scroll slowly to hero cards");
  console.log("    4. Scroll to countdown/clock");
  console.log("    5. Scroll to carousel section");
  console.log("    6. Scroll to remote section");
  console.log("    7. Scroll to footer");
  console.log("    8. Scroll back up");
  console.log("========================================\n");

  let frame = 0;
  const start = Date.now();

  while (Date.now() - start < DURATION) {
    const elapsed = Math.round((Date.now() - start) / 1000);
    const path = `${DIR}/frame-${String(frame).padStart(4, "0")}.png`;
    await page.screenshot({ path });
    if (frame % 10 === 0) {
      console.log(`[${elapsed}s] frame ${frame}`);
    }
    frame++;
    await page.waitForTimeout(INTERVAL);
  }

  console.log(`\nDone! Captured ${frame} frames in screenshots/original-deep/`);
  await browser.close();
}

run().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
