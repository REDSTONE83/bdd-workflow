import { defineConfig, devices } from "@playwright/test"

const backendPort = process.env.E2E_BACKEND_PORT ?? "8080"
const frontendPort = process.env.E2E_FRONTEND_PORT ?? "5173"
const frontendOrigin =
  process.env.E2E_BASE_URL ?? `http://127.0.0.1:${frontendPort}`
const backendOrigin =
  process.env.VITE_BACKEND_ORIGIN ?? `http://127.0.0.1:${backendPort}`
const liveResultsFile =
  process.env.E2E_LIVE_RESULTS_FILE ?? "test-results/e2e-live-results.json"
const liveArtifactsDir =
  process.env.E2E_LIVE_ARTIFACTS_DIR ?? "test-results/live-artifacts"
const liveHtmlReportDir =
  process.env.E2E_LIVE_HTML_REPORT_DIR ?? "playwright-report/live"
const shellQuote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`
const gradleProjectCacheArg = process.env.HARNESS_GRADLE_PROJECT_CACHE_DIR
  ? ` --project-cache-dir ${shellQuote(process.env.HARNESS_GRADLE_PROJECT_CACHE_DIR)}`
  : ""
const springArgs = `--spring.profiles.active=test --server.port=${backendPort}`

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.live.spec.ts",
  outputDir: liveArtifactsDir,
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: liveResultsFile }],
    ["html", { open: "never", outputFolder: liveHtmlReportDir }],
  ],
  use: {
    baseURL: frontendOrigin,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command:
        `../back-end/gradlew -p ../back-end${gradleProjectCacheArg} bootRun --args=${shellQuote(springArgs)}`,
      url: new URL("/v3/api-docs", backendOrigin).toString(),
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command:
        `VITE_BACKEND_ORIGIN=${shellQuote(backendOrigin)} npm run dev -- --port ${frontendPort}`,
      url: frontendOrigin,
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
