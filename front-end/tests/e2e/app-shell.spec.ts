import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.describe("App shell", () => {
  test("renders the React/Vite/shadcn foundation", async ({ page }) => {
    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: "Front-end foundation" }),
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Start a screen" })).toBeVisible()
    await expect(page.getByText("shadcn/ui component registry ready")).toBeVisible()
  })

  test("keeps the shell inside a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/")

    await expect(page.getByRole("heading", { name: "Front-end foundation" })).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalOverflow).toBe(false)
  })

  test("has no automatically detectable accessibility violations", async ({ page }) => {
    await page.goto("/")

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toEqual([])
  })
})
