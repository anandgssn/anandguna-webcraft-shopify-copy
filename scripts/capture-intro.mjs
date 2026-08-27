import { chromium } from "playwright";
import { execSync } from "child_process";

const BASE = "http://localhost:3456";
const DIR = "screenshots/intro-test";

async function run() {
  execSync(`mkdir -p ${DIR}`);
  execSync(`rm -f ${DIR}/*.png`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  let frame = 0;
  const captureInterval = setInterval(async () => {
    try {
      await page.screenshot({ path: `${DIR}/frame-${String(frame).padStart(3, "0")}.png` });
      console.log(`frame ${frame}`);
      frame++;
    } catch {}
  }, 100);

  console.log("Loading localhost:3456...");
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);

  clearInterval(captureInterval);
  console.log(`Done! Captured ${frame} frames to ${DIR}/`);
  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
