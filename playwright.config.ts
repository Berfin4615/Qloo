import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  use: { baseURL: "http://localhost:3100", headless: true },
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://localhost:3100",
    env: { QLOO_API_KEY: "" },
    reuseExistingServer: false,
  },
  workers: 1,
});
