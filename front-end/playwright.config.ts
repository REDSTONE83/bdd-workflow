import { defineConfig, devices } from "@playwright/test"

const e2eResultsFile =
  process.env.E2E_RESULTS_FILE ?? "test-results/e2e-results.partial.json"

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results/artifacts",
  reporter: [
    ["list"],
    ["json", { outputFile: e2eResultsFile }],
    ["html", { open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
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
