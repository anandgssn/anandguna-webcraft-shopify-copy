import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: false,
  channel: 'chrome',
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3456', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

await page.screenshot({ path: '/tmp/webgl-01-page.png' });

await page.click('h1');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/webgl-02-entered.png' });

await page.mouse.move(900, 300);
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/webgl-03-orbit.png' });

await page.mouse.wheel(0, 2000);
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/webgl-04-scrolled.png' });

await page.mouse.wheel(0, 3000);
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/webgl-05-deep.png' });

await browser.close();
console.log('Done - screenshots at /tmp/webgl-01 through 05');
