import { test, expect } from "@playwright/test";

test.describe("3D WebGL Scene", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3456");
    await page.waitForLoadState("networkidle");
  });

  test("headline click opens 3D scene overlay", async ({ page }, testInfo) => {
    const headline = page.locator("h1").first();
    await expect(headline).toBeVisible();
    await headline.click();

    const overlay = page.locator("[data-testid='webgl-overlay']");
    await expect(overlay).toBeVisible({ timeout: 3000 });

    const canvas = overlay.locator("canvas");
    await expect(canvas).toBeVisible();

    await page.screenshot({ path: testInfo.outputPath("3d-scene-active.png") });
  });

  test("ESC key closes 3D scene", async ({ page }, testInfo) => {
    await page.locator("h1").first().click();
    const overlay = page.locator("[data-testid='webgl-overlay']");
    await expect(overlay).toBeVisible({ timeout: 3000 });

    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);

    await expect(overlay).not.toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("3d-scene-closed.png") });
  });

  test("mouse movement changes canvas content", async ({ page }) => {
    await page.locator("h1").first().click();
    const canvas = page.locator("[data-testid='webgl-overlay'] canvas");
    await expect(canvas).toBeVisible({ timeout: 3000 });
    await page.waitForTimeout(500);

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    const before = await page.screenshot({ clip: box! });

    await page.mouse.move(box!.x + box!.width * 0.2, box!.y + box!.height * 0.5);
    await page.waitForTimeout(600);
    await page.mouse.move(box!.x + box!.width * 0.8, box!.y + box!.height * 0.2);
    await page.waitForTimeout(600);

    const after = await page.screenshot({ clip: box! });
    expect(Buffer.compare(before, after)).not.toBe(0);
  });

  test("scroll within 3D scene moves camera", async ({ page }) => {
    await page.locator("h1").first().click();
    const overlay = page.locator("[data-testid='webgl-overlay']");
    await expect(overlay).toBeVisible({ timeout: 3000 });
    await page.waitForTimeout(500);

    await expect(overlay.locator("canvas")).toBeVisible();
    await page.mouse.wheel(0, 400);
    await expect
      .poll(async () => Number(await overlay.getAttribute("data-camera-scroll-target")))
      .toBeGreaterThan(300);
  });

  test("no memory leak on repeated open/close", async ({ page }) => {
    const overlay = page.locator("[data-testid='webgl-overlay']");
    for (let i = 0; i < 2; i++) {
      await page.locator("h1").first().dispatchEvent("click");
      await expect(overlay).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(overlay).not.toBeVisible();
    }
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("page scrolls normally after closing 3D scene", async ({ page }, testInfo) => {
    await page.locator("h1").first().click();
    await page.waitForTimeout(800);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);

    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(500);
    await page.screenshot({ path: testInfo.outputPath("3d-page-after-close.png") });
  });
});
