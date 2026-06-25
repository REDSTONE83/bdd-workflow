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
// Playwright는 webServer.command를 OS 셸로 실행한다(POSIX=sh, Windows=cmd). 셸별로 인용 방식이
// 다르므로 플랫폼에 맞춰 따옴표를 고르고, Windows에서는 배치 래퍼(gradlew.bat)를 사용한다.
const isWindows = process.platform === "win32"
const shellQuote = (value: string) =>
  isWindows
    ? `"${value.replace(/"/g, '""')}"`
    : `'${value.replace(/'/g, "'\\''")}'`
const gradleWrapper = isWindows ? "..\\back-end\\gradlew.bat" : "../back-end/gradlew"
const gradleProjectDir = isWindows ? "..\\back-end" : "../back-end"
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
        `${gradleWrapper} -p ${gradleProjectDir}${gradleProjectCacheArg} bootRun --args=${shellQuote(springArgs)}`,
      url: new URL("/v3/api-docs", backendOrigin).toString(),
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      // 인라인 VAR=값 접두는 cmd가 해석하지 못하므로 webServer.env로 환경 변수를 전달한다.
      command: `npm run dev -- --port ${frontendPort}`,
      env: { VITE_BACKEND_ORIGIN: backendOrigin },
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
