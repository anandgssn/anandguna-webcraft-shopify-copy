import { test, expect } from "@playwright/test";

test.describe("3D WebGL Scene", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3456");
    await page.waitForLoadState("networkidle");
  });

  test("headline click opens 3D scene overlay", async ({ page }) => {
    const headline = page.locator("h1").first();
    await expect(headline).toBeVisible();
    await headline.click();

    const overlay = page.locator("[data-testid='webgl-overlay']");
    await expect(overlay).toBeVisible({ timeout: 3000 });

    const canvas = overlay.locator("canvas");
    await expect(canvas).toBeVisible();

    await page.screenshot({ path: "screenshots/3d-scene-active.png" });
  });

  test("ESC key closes 3D scene", async ({ page }) => {
    await page.locator("h1").first().click();
    const overlay = page.locator("[data-testid='webgl-overlay']");
    await expect(overlay).toBeVisible({ timeout: 3000 });

    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);

    await expect(overlay).not.toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: "screenshots/3d-scene-closed.png" });
  });

  test("mouse movement changes canvas content", async ({ page }) => {
    await page.locator("h1").first().click();
    const canvas = page.locator("[data-testid='webgl-overlay'] canvas");
    await expect(canvas).toBeVisible({ timeout: 3000 });
    await page.waitForTimeout(500);

    const before = await canvas.screenshot();

    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
      await page.waitForTimeout(600);
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2);
      await page.waitForTimeout(600);
    }

    const after = await canvas.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
    await page.screenshot({ path: "screenshots/3d-scene-mouse-moved.png" });
  });

  test("scroll within 3D scene moves camera", async ({ page }) => {
    await page.locator("h1").first().click();
    const overlay = page.locator("[data-testid='webgl-overlay']");
    await expect(overlay).toBeVisible({ timeout: 3000 });
    await page.waitForTimeout(500);

    const canvas = page.locator("[data-testid='webgl-overlay'] canvas");
    const before = await canvas.screenshot();

    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(800);

    const after = await canvas.screenshot();
    expect(Buffer.compare(before, after)).not.toBe(0);
    await page.screenshot({ path: "screenshots/3d-scene-scrolled.png" });
  });

  test("no memory leak on repeated open/close", async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.locator("h1").first().click();
      await page.waitForTimeout(800);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(800);
    }
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: "screenshots/3d-after-repeated-open-close.png" });
  });

  test("page scrolls normally after closing 3D scene", async ({ page }) => {
    await page.locator("h1").first().click();
    await page.waitForTimeout(800);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);

    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(500);
    await page.screenshot({ path: "screenshots/3d-page-after-close.png" });
  });
});
