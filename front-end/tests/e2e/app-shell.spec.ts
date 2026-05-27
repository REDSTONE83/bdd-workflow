import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { installAuthRoutes } from "./_helpers/auth-mocks"

test.describe("App shell", () => {
  // / 는 인증 상태에 따라 /todos 또는 /login 으로 redirect 한다.
  // 비인증 진입점인 /login 화면 셸을 기준으로 REQ-005 의 앱 셸 수용 기준을 확인한다.
  test.beforeEach(async ({ page }) => {
    await installAuthRoutes(page, { authenticated: null })
  })

  test("renders the React/Vite/shadcn foundation", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-005" },
      { type: "Covers", description: "프런트엔드 기반 앱 셸이 표시된다" },
    )

    await page.goto("/")
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible()
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible()
  })

  test("keeps the shell inside the desktop viewport", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-005" },
      {
        type: "Covers",
        description: "데스크톱 화면에서 앱 셸의 핵심 요소가 화면 밖으로 넘치지 않는다",
      },
    )

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/login")

    await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalOverflow).toBe(false)
  })

  test("has no automatically detectable accessibility violations", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-005" },
      { type: "Covers", description: "자동 접근성 검사에서 위반이 없어야 한다" },
    )

    await page.goto("/login")

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toEqual([])
  })
})
