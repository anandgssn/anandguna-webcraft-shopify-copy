import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";
import { chromium } from "playwright";

const OUT_DIR = process.env.OUT_DIR ?? "/tmp/shopify-parity-captures";
const LOCAL_URL = process.env.LOCAL_URL ?? "http://localhost:3456";
const ORIGINAL_URL = process.env.ORIGINAL_URL ?? "https://shopify.design";
const CHANNEL = process.env.PW_CHANNEL;
const HEADLESS = process.env.PW_HEADLESS !== "0";
const DIFF_THRESHOLD = Number(process.env.DIFF_THRESHOLD ?? 24);

const VIEWPORTS = [
  ["desktop", { width: 1440, height: 900, deviceScaleFactor: 2 }],
  [
    "mobile",
    { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
  ],
];

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`Capture visual parity screenshots and diffs.

Usage:
  PW_CHANNEL=chrome npm run capture:parity

Environment:
  LOCAL_URL=http://localhost:3456
  ORIGINAL_URL=https://shopify.design
  OUT_DIR=/tmp/shopify-parity-captures
  PW_CHANNEL=chrome
  PW_HEADLESS=0
  DIFF_THRESHOLD=24

Output:
  ${OUT_DIR}/desktop/local/*.png
  ${OUT_DIR}/desktop/original/*.png
  ${OUT_DIR}/desktop/diff/*.png
  ${OUT_DIR}/mobile/...
  ${OUT_DIR}/report.json`);
  process.exit(0);
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function checkpointPath(viewportName, label, name) {
  return join(OUT_DIR, viewportName, label, `${name}.png`);
}

function diffPath(viewportName, name) {
  return join(OUT_DIR, viewportName, "diff", `${name}.png`);
}

function withVisualTestParam(url) {
  const parsed = new URL(url);
  parsed.searchParams.set("visualTest", "1");
  return parsed.toString();
}

async function launchBrowser() {
  const options = { headless: HEADLESS };
  if (CHANNEL) options.channel = CHANNEL;

  try {
    return await chromium.launch(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to launch Playwright Chromium. Try PW_CHANNEL=chrome or PW_HEADLESS=0.\n\n${message}`
    );
  }
}

async function preparePage(page, url) {
  await page.addInitScript(() => {
    const fixedNow = 1778515200000;
    const originalDateNow = Date.now.bind(Date);
    Date.now = () => fixedNow || originalDateNow();
    Math.random = () => 0.42;
  });

  await page.goto(withVisualTestParam(url), {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForTimeout(7_000);
}

async function freezeForScreenshot(page) {
  await page.evaluate(() => {
    document.querySelectorAll("video").forEach((video) => {
      try {
        video.pause();
        video.currentTime = 0;
      } catch {}
    });
  });

  const styleHandle = await page
    .addStyleTag({
      content: `
        *, *::before, *::after {
          animation-play-state: paused !important;
          transition-duration: 0s !important;
          scroll-behavior: auto !important;
        }
      `,
    })
    .catch(() => {});

  await page.waitForTimeout(250);
  return styleHandle;
}

async function screenshot(page, path) {
  ensureDir(dirname(path));
  const styleHandle = await freezeForScreenshot(page);
  try {
    await page.screenshot({ path });
  } finally {
    await styleHandle?.evaluate((el) => el.remove()).catch(() => {});
  }
}

async function scrollToText(page, text) {
  return page.evaluate((needle) => {
    const elements = [
      ...document.querySelectorAll("h1,h2,h3,p,span,a,button,footer"),
    ];
    const candidates = elements
      .filter((el) => (el.textContent || "").replace(/\s+/g, " ").includes(needle))
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

    const target = candidates[0];
    if (!target) return false;

    target.scrollIntoView({ block: "start", inline: "nearest" });
    return true;
  }, text);
}

async function scrollToTarget(page, selectors, fallbackText) {
  const foundSelector = await page.evaluate((candidateSelectors) => {
    for (const selector of candidateSelectors) {
      const target = document.querySelector(selector);
      if (!target) continue;

      const rect = target.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      target.scrollIntoView({ block: "start", inline: "nearest" });
      return true;
    }

    return false;
  }, selectors);

  if (foundSelector) return true;
  return scrollToText(page, fallbackText);
}

async function findCountdownScroll(page, viewportHeight) {
  return page.evaluate((vh) => {
    const stage =
      document.querySelector(".countdown-stage") ??
      document.querySelector('[data-id="cd-ring"]')?.closest("section") ??
      document.querySelector('[data-id="countdown-number"]')?.closest("section") ??
      document.querySelector('[data-id="countdown-headline"]')?.closest("section") ??
      [...document.querySelectorAll("section,div")].find((el) => {
        const rect = el.getBoundingClientRect();
        return rect.height > vh * 4;
      });

    if (!stage) return null;

    const rect = stage.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      height: rect.height,
      targetY: Math.round(rect.top + window.scrollY + rect.height * 0.45 - vh),
    };
  }, viewportHeight);
}

async function captureSet(browser, label, url, viewportName, viewport) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor,
    isMobile: Boolean(viewport.isMobile),
  });

  await preparePage(page, url);

  const captured = [];
  async function shot(name) {
    const path = checkpointPath(viewportName, label, name);
    await screenshot(page, path);
    captured.push(name);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await shot("01-top");

  await page.evaluate((h) => window.scrollTo(0, Math.round(h * 0.85)), viewport.height);
  await page.waitForTimeout(500);
  await shot("02-hero-scrolled");

  const countdown = await findCountdownScroll(page, viewport.height);
  if (countdown) {
    await page.evaluate((y) => window.scrollTo(0, Math.max(0, y)), countdown.targetY);
    await page.waitForTimeout(600);
    await shot("03-countdown-mid");
  }

  if (
    await scrollToTarget(
      page,
      ['[data-id="carousel-headline"]', '[data-id="carousel-headline-2"]'],
      "Design"
    )
  ) {
    await page.waitForTimeout(600);
    await shot("04-carousel");
  }

  if (await scrollToTarget(page, ['[data-id="remote-line-0"]'], "Remote")) {
    await page.waitForTimeout(600);
    await shot("05-remote");
  }

  if (await scrollToTarget(page, ['[data-id="footer-headline"]', "footer"], "Help shape")) {
    await page.waitForTimeout(600);
    await shot("06-footer");
  }

  if (viewportName === "desktop") {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    const headline = page.locator("h1").first();
    const box = await headline.boundingBox().catch(() => null);
    if (box) {
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height * 0.35;
      await page.mouse.move(startX, startY);
      await headline.dispatchEvent("mousedown", {
        button: 0,
        buttons: 1,
        clientX: startX,
        clientY: startY,
        bubbles: true,
      });
      await page.mouse.down();
      await page.waitForTimeout(600);

      const localOverlayOpen = await page
        .locator('[data-testid="webgl-overlay"] canvas')
        .count()
        .catch(() => 0);
      if (localOverlayOpen === 0) {
        await page.mouse.up().catch(() => {});
        await page.mouse.click(viewport.width - 48, viewport.height - 72);
      }

      await page.waitForTimeout(1_200);
      await shot("07-3d-enter");

      await page.mouse.move(viewport.width * 0.18, viewport.height * 0.35);
      await page.waitForTimeout(900);
      await shot("08-3d-orbit-left");

      await page.mouse.wheel(0, 1_400);
      await page.waitForTimeout(1_000);
      await shot("09-3d-deep");

      await page.mouse.up();
    }
  }

  const metrics = await page.evaluate(() => ({
    title: document.title,
    scrollHeight: document.documentElement.scrollHeight,
    bodyHeight: document.body.scrollHeight,
    url: location.href,
  }));

  await page.close();
  return { label, url, viewport: viewportName, captured, metrics };
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data = Buffer.alloc(0)) {
  const typeBuf = Buffer.from(type);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  typeBuf.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 8 + data.length);
  return out;
}

function readPng(path) {
  const data = readFileSync(path);
  if (!data.subarray(0, 8).equals(Buffer.from("\x89PNG\r\n\x1a\n", "binary"))) {
    throw new Error(`Not a PNG: ${path}`);
  }

  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];

  while (pos < data.length) {
    const length = data.readUInt32BE(pos);
    pos += 4;
    const type = data.subarray(pos, pos + 4).toString("ascii");
    pos += 4;
    const chunk = data.subarray(pos, pos + length);
    pos += length + 4;

    if (type === "IHDR") {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      const bitDepth = chunk[8];
      colorType = chunk[9];
      const interlace = chunk[12];
      if (bitDepth !== 8 || interlace !== 0 || ![2, 6].includes(colorType)) {
        throw new Error(`Unsupported PNG format in ${path}`);
      }
    } else if (type === "IDAT") {
      idat.push(chunk);
    } else if (type === "IEND") {
      break;
    }
  }

  const channels = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const rgba = Buffer.alloc(width * height * 4);
  let rawPos = 0;
  let prev = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[rawPos++];
    const row = Buffer.from(raw.subarray(rawPos, rawPos + stride));
    rawPos += stride;

    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? row[i - channels] : 0;
      const up = prev[i];
      const upLeft = i >= channels ? prev[i - channels] : 0;

      if (filter === 1) {
        row[i] = (row[i] + left) & 255;
      } else if (filter === 2) {
        row[i] = (row[i] + up) & 255;
      } else if (filter === 3) {
        row[i] = (row[i] + Math.floor((left + up) / 2)) & 255;
      } else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        const predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        row[i] = (row[i] + predictor) & 255;
      } else if (filter !== 0) {
        throw new Error(`Unsupported PNG filter ${filter} in ${path}`);
      }
    }

    for (let x = 0; x < width; x++) {
      const src = x * channels;
      const dst = (y * width + x) * 4;
      rgba[dst] = row[src];
      rgba[dst + 1] = row[src + 1];
      rgba[dst + 2] = row[src + 2];
      rgba[dst + 3] = channels === 4 ? row[src + 3] : 255;
    }

    prev = row;
  }

  return { width, height, rgba };
}

function writePng(path, width, height, rgba) {
  ensureDir(dirname(path));
  const raw = Buffer.alloc(height * (1 + width * 4));
  let pos = 0;

  for (let y = 0; y < height; y++) {
    raw[pos++] = 0;
    rgba.copy(raw, pos, y * width * 4, (y + 1) * width * 4);
    pos += width * 4;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from("\x89PNG\r\n\x1a\n", "binary"),
      pngChunk("IHDR", ihdr),
      pngChunk("IDAT", deflateSync(raw)),
      pngChunk("IEND"),
    ])
  );
}

function makeDiff(originalPath, localPath, outPath) {
  const original = readPng(originalPath);
  const local = readPng(localPath);

  if (original.width !== local.width || original.height !== local.height) {
    return {
      skipped: true,
      reason: "dimension-mismatch",
      original: { width: original.width, height: original.height },
      local: { width: local.width, height: local.height },
    };
  }

  const { width, height } = original;
  const total = width * height;
  const diff = Buffer.alloc(total * 4);
  let changed = 0;
  let sad = 0;
  let maxDelta = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let i = 0; i < total; i++) {
    const p = i * 4;
    const dr = Math.abs(original.rgba[p] - local.rgba[p]);
    const dg = Math.abs(original.rgba[p + 1] - local.rgba[p + 1]);
    const db = Math.abs(original.rgba[p + 2] - local.rgba[p + 2]);
    const delta = dr + dg + db;
    sad += delta;
    maxDelta = Math.max(maxDelta, delta);

    const gray = Math.round(
      original.rgba[p] * 0.2126 +
        original.rgba[p + 1] * 0.7152 +
        original.rgba[p + 2] * 0.0722
    );

    if (delta > DIFF_THRESHOLD) {
      changed++;
      const x = i % width;
      const y = Math.floor(i / width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      diff[p] = 255;
      diff[p + 1] = 48;
      diff[p + 2] = 48;
      diff[p + 3] = 255;
    } else {
      diff[p] = gray;
      diff[p + 1] = gray;
      diff[p + 2] = gray;
      diff[p + 3] = 72;
    }
  }

  writePng(outPath, width, height, diff);

  return {
    skipped: false,
    changedPixels: changed,
    changedPercent: Number(((changed / total) * 100).toFixed(4)),
    meanAbsRgbPerChannel: Number((sad / total / 3).toFixed(4)),
    maxRgbDelta: maxDelta,
    bbox: changed === 0 ? null : [minX, minY, maxX, maxY],
  };
}

async function main() {
  ensureDir(OUT_DIR);

  const browser = await launchBrowser();
  const report = {
    createdAt: new Date().toISOString(),
    localUrl: LOCAL_URL,
    originalUrl: ORIGINAL_URL,
    outDir: OUT_DIR,
    diffThreshold: DIFF_THRESHOLD,
    captures: [],
    diffs: [],
  };

  for (const [viewportName, viewport] of VIEWPORTS) {
    console.log(`Capturing ${viewportName} local...`);
    report.captures.push(
      await captureSet(browser, "local", LOCAL_URL, viewportName, viewport)
    );

    console.log(`Capturing ${viewportName} original...`);
    report.captures.push(
      await captureSet(browser, "original", ORIGINAL_URL, viewportName, viewport)
    );

    const localDir = join(OUT_DIR, viewportName, "local");
    const originalDir = join(OUT_DIR, viewportName, "original");
    const checkpoints = [
      "01-top",
      "02-hero-scrolled",
      "03-countdown-mid",
      "04-carousel",
      "05-remote",
      "06-footer",
      "07-3d-enter",
      "08-3d-orbit-left",
      "09-3d-deep",
    ];

    for (const checkpoint of checkpoints) {
      const localPath = join(localDir, `${checkpoint}.png`);
      const originalPath = join(originalDir, `${checkpoint}.png`);
      if (!existsSync(localPath) || !existsSync(originalPath)) continue;

      const outPath = diffPath(viewportName, checkpoint);
      console.log(`Diffing ${viewportName} ${checkpoint}...`);
      report.diffs.push({
        viewport: viewportName,
        checkpoint,
        localPath,
        originalPath,
        diffPath: outPath,
        ...makeDiff(originalPath, localPath, outPath),
      });
    }
  }

  await browser.close();

  const reportPath = join(OUT_DIR, "report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Done. Captures and diffs written to ${OUT_DIR}`);
  console.log(`Report: ${reportPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
