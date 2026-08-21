import { expect, test } from "@playwright/test";
import { openFreshProject, typeInEditor } from "./helpers";

test.use({ colorScheme: "light" });

test("katex output visual regression", async ({ page }) => {
  await page.addInitScript(() => {
    indexedDB.deleteDatabase("xtype");
    localStorage.clear();
  });
  await page.goto("/project/new");
  await page.waitForURL(/\/project\/(?!new)[A-Za-z0-9-]+/);

  const editor = page.locator(".cm-content").first();
  await expect(editor).toBeVisible({ timeout: 30_000 });

  await typeInEditor(
    page,
    "# Section\n\nInline $a^2+b^2=c^2$ and display:\n$$\\int_0^\\infty e^{-x}\\,dx = 1$$",
  );

  const previewBlock = page.locator("[data-preview-pane] .prose-katex").first();
  await expect(previewBlock.locator(".katex-display")).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
  await expect(previewBlock).toHaveScreenshot("katex-preview.png", {
    animations: "disabled",
  });
});
