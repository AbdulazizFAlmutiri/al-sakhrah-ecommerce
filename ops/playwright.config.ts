import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:3200", viewport: { width: 1366, height: 900 } },
  webServer: { command: "npm run start", port: 3200, reuseExistingServer: true, timeout: 120_000 },
});
