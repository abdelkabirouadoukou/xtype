import { expect, test, type Page } from "@playwright/test";

export async function openFreshProject(page: Page) {
  await page.addInitScript(() => {
    indexedDB.deleteDatabase("xtype");
    localStorage.clear();
  });
  await page.goto("/project/new");
  await page.waitForURL(/\/project\/(?!new)[A-Za-z0-9-]+/);
}

export async function typeInEditor(page: Page, text: string) {
  const content = page.locator(".cm-content").first();
  await content.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Delete");
  await page.keyboard.type(text, { delay: 10 });
}
