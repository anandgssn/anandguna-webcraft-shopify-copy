import { chromium } from "playwright";
import { execSync } from "child_process";

const BASE = "https://shopify.design";
const DIR = "screenshots/original";
const INTERVAL = 2000;
const DURATION = 60000; // 60 seconds to explore

async function run() {
  execSync(`mkdir -p ${DIR}`);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log("Loading shopify.design...");
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(8000);

  console.log("\n=== YOU HAVE 60 SECONDS ===");
  console.log("Navigate the 3D world with your mouse.");
  console.log("Screenshots will be taken every 2 seconds.");
  console.log("===========================\n");

  let frame = 0;
  const start = Date.now();

  while (Date.now() - start < DURATION) {
    const path = `${DIR}/frame-${String(frame).padStart(3, "0")}.png`;
    await page.screenshot({ path });
    console.log(`[${Math.round((Date.now() - start) / 1000)}s] -> ${path}`);
    frame++;
    await page.waitForTimeout(INTERVAL);
  }

  console.log(`\nDone! Captured ${frame} frames in screenshots/original/`);
  await browser.close();
}

run().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
