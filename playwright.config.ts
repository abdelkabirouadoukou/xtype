import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "bun run dev",
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 90_000,
      },
});
