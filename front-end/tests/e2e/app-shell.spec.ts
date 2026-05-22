import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.describe("App shell", () => {
  test("renders the React/Vite/shadcn foundation", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-005" },
      { type: "Covers", description: "프런트엔드 기반 앱 셸이 표시된다" },
    )

    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: "Front-end foundation" }),
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Start a screen" })).toBeVisible()
    await expect(page.getByText("shadcn/ui component registry ready")).toBeVisible()
  })

  test("keeps the shell inside a mobile viewport", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-005" },
      {
        type: "Covers",
        description: "모바일 화면에서 앱 셸의 핵심 요소가 화면 밖으로 넘치지 않는다",
      },
    )

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/")

    await expect(page.getByRole("heading", { name: "Front-end foundation" })).toBeVisible()

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

    await page.goto("/")

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toEqual([])
  })
})
