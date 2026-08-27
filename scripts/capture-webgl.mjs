import { chromium } from "playwright";
import { execSync } from "child_process";

const BASE = "http://localhost:3456";
const DIR = "screenshots";

async function run() {
  // Ensure screenshots dir exists
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

  // Collect console messages
  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error" || type === "warning" || type === "log") {
      console.log(`[BROWSER ${type.toUpperCase()}] ${msg.text()}`);
    }
  });

  console.log("1. Loading page...");
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/01-page-loaded.png` });
  console.log("   -> 01-page-loaded.png");

  // Scroll down a bit to see more of the page
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${DIR}/02-scrolled-hero.png` });
  console.log("   -> 02-scrolled-hero.png");

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  console.log("2. Mousedown on headline to enter 3D mode...");
  const headline = page.locator("h1").first();
  const headlineBox = await headline.boundingBox();
  if (!headlineBox) {
    console.log("   WARN: h1 not found");
  }
  // Mouse down — hold to stay in 3D
  await page.mouse.move(headlineBox.x + headlineBox.width / 2, headlineBox.y + headlineBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(3000); // Wait for scene to build

  console.log("3. Taking 3D screenshots...");
  await page.screenshot({ path: `${DIR}/03-3d-initial.png` });
  console.log("   -> 03-3d-initial.png");

  // Check for canvas
  const canvas = page.locator("[data-testid='webgl-overlay'] canvas");
  const canvasVisible = await canvas.isVisible().catch(() => false);
  console.log(`   Canvas visible: ${canvasVisible}`);

  if (canvasVisible) {
    const box = await canvas.boundingBox();
    if (box) {
      // Mouse orbit - move to different positions
      console.log("4. Orbiting camera...");
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${DIR}/04-3d-orbit-left.png` });
      console.log("   -> 04-3d-orbit-left.png");

      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3);
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${DIR}/05-3d-orbit-right.png` });
      console.log("   -> 05-3d-orbit-right.png");

      // Scroll down in 3D space
      console.log("5. Scrolling in 3D space...");
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${DIR}/06-3d-scrolled-down.png` });
      console.log("   -> 06-3d-scrolled-down.png");

      await page.mouse.wheel(0, 1200);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${DIR}/07-3d-scrolled-deep.png` });
      console.log("   -> 07-3d-scrolled-deep.png");
    }
  } else {
    console.log("   WARN: No canvas found in overlay!");
    await page.screenshot({ path: `${DIR}/03b-no-canvas-debug.png` });
  }

  // Release mouse to exit 3D
  console.log("6. Releasing mouse to exit 3D...");
  await page.mouse.up();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${DIR}/08-after-close.png` });
  console.log("   -> 08-after-close.png");

  console.log("\nDone! Screenshots saved to screenshots/");
  await browser.close();
}

run().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
