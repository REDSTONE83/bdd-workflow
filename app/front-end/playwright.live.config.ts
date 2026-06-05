import { defineConfig, devices } from "@playwright/test"

const liveResultsFile =
  process.env.E2E_LIVE_RESULTS_FILE ?? "test-results/e2e-live-results.json"

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.live.spec.ts",
  outputDir: "test-results/live-artifacts",
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: liveResultsFile }],
    ["html", { open: "never", outputFolder: "playwright-report/live" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command:
        "../back-end/gradlew -p ../back-end bootRun --args='--spring.profiles.active=test --server.port=8080'",
      url: "http://127.0.0.1:8080/v3/api-docs",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command:
        "VITE_BACKEND_ORIGIN=http://127.0.0.1:8080 npm run dev -- --port 5173",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
})
