import { chromium } from "playwright";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const VIDEO = "/Users/vinaypadmanabhi/Desktop/Screen Recording 2026-05-07 at 4.39.25 PM.mov";
const DIR = "screenshots/my-recording";

async function run() {
  execSync(`mkdir -p ${DIR}`);

  const browser = await chromium.launch({ channel: "chrome", headless: false });
  const page = await browser.newPage();

  // Create an HTML page that plays the video
  const html = `
  <html><body style="margin:0;background:#000">
  <video id="v" src="file://${encodeURI(VIDEO)}" muted style="width:100vw;height:100vh;object-fit:contain"></video>
  <script>
    const v = document.getElementById('v');
    v.play();
  </script>
  </body></html>`;

  await page.setContent(html);
  await page.waitForTimeout(1000);

  // Seek through video and capture frames
  for (let i = 0; i < 30; i++) {
    const time = i * 0.15; // every 150ms
    await page.evaluate((t) => {
      const v = document.getElementById('v');
      v.currentTime = t;
    }, time);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${DIR}/frame-${String(i).padStart(3, "0")}.png` });
    console.log(`frame ${i} at ${time.toFixed(2)}s`);
  }

  console.log(`Done! ${DIR}/`);
  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
