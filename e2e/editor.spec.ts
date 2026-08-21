import { expect, test } from "@playwright/test";
import { openFreshProject, typeInEditor } from "./helpers";

test("new project -> type math -> fast preview renders KaTeX", async ({ page }) => {
  await openFreshProject(page);

  const editor = page.locator(".cm-content").first();
  await expect(editor).toBeVisible({ timeout: 30_000 });

  await typeInEditor(page, "Euler: $e^{i\\pi} + 1 = 0$");

  const preview = page.locator("[data-preview-pane]");
  const katex = preview.locator(".katex").first();
  await expect(katex).toBeVisible({ timeout: 15_000 });
  await expect(katex).toContainText("=");
});

test("typst compile produces a downloadable PDF blob", async ({ page }) => {
  test.setTimeout(180_000);
  await openFreshProject(page);

  const editor = page.locator(".cm-content").first();
  await expect(editor).toBeVisible({ timeout: 30_000 });
  await typeInEditor(page, "= Hello\n$x^2$");

  const pdfLink = page.locator('a[download="xtype.pdf"]');
  await expect(pdfLink).toBeVisible({ timeout: 150_000 });

  const [download] = await Promise.all([page.waitForEvent("download"), pdfLink.click()]);
  const path = await download.path();
  expect(path).toBeTruthy();
  const { readFile } = await import("node:fs/promises");
  const head = (await readFile(path!)).subarray(0, 4).toString("latin1");
  expect(head).toBe("%PDF");
});
