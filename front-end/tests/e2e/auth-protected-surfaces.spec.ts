import { expect, test } from "@playwright/test"

import { DEFAULT_USER, installAuthRoutes } from "./_helpers/auth-mocks"

// REQ-011 FE: 보호 화면 스켈레톤, 공통 헤더, 사용자 메뉴, 로그아웃 성공/실패, placeholder.
test.describe("보호 화면 / 헤더 / 로그아웃 / placeholder", () => {
  test("보호 화면 진입 시 인증 확인 전에는 스켈레톤이 표시된다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description:
          "보호 화면을 처음 열거나 새로고침했을 때 인증 확인이 끝나기 전에는 헤더 골격과 본문 자리만 보이는 스켈레톤이 표시된다",
      },
    )

    // /auth/me 응답을 지연시켜 checking 단계를 길게 유지.
    let resolveMe = () => {}
    await page.route("**/auth/me", async (route) => {
      await new Promise<void>((r) => {
        resolveMe = r
      })
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(DEFAULT_USER),
      })
    })
    await page.route("**/auth/logout", async (route) => {
      await route.fulfill({ status: 204, body: "" })
    })
    await page.route("**/auth/login", async (route) => {
      await route.fulfill({ status: 204, body: "" })
    })

    await page.goto("/todos")
    await expect(page.getByTestId("auth-skeleton")).toBeVisible()
    resolveMe()
  })

  test("보호 화면 상단 헤더에 현재 사용자 이메일이 표시된다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description:
          "보호 화면에는 공통 상단 헤더가 있고, 헤더 우측에 현재 사용자의 이메일이 표시된다",
      },
      {
        type: "Covers",
        description: "인증된 사용자가 `/todos` 경로에 접근하면 자신의 이메일이 표시되는 빈 보호 화면이 보인다",
      },
    )

    await installAuthRoutes(page, { authenticated: DEFAULT_USER })
    await page.goto("/todos")
    await expect(page.getByText(DEFAULT_USER.email)).toBeVisible()
  })

  test("헤더 우측 사용자 이메일을 선택하면 사용자 메뉴가 펼쳐지고 로그아웃 항목이 보인다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description:
          "보호 화면 상단 헤더의 사용자 이메일을 선택하면 사용자 메뉴가 펼쳐지고, 그 안에 로그아웃 항목이 있다",
      },
    )

    await installAuthRoutes(page, { authenticated: DEFAULT_USER })
    await page.goto("/todos")
    await page.getByRole("button", { name: /사용자 메뉴 열기/ }).click()
    await expect(page.getByRole("menuitem", { name: "로그아웃" })).toBeVisible()
  })

  test("로그아웃 성공 시 사용자 정보가 사라지고 /login 으로 이동한다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description:
          "사용자 메뉴에서 로그아웃 항목을 선택해 로그아웃 호출이 성공하면 화면에서 사용자 정보가 사라지고 로그인 화면으로 이동한다",
      },
    )

    await installAuthRoutes(page, { authenticated: DEFAULT_USER, logoutStatus: 204 })
    await page.goto("/todos")
    await page.getByRole("button", { name: /사용자 메뉴 열기/ }).click()
    await page.getByRole("menuitem", { name: "로그아웃" }).click()

    await expect(page).toHaveURL(/\/login/)
  })

  test("로그아웃 실패 시 현재 화면에 머무르고 상단에 재시도 안내가 노출된다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description:
          "사용자 메뉴에서 로그아웃 항목을 선택해 로그아웃 호출이 실패하면 현재 화면에 그대로 머무르고 상단에 재시도를 안내하는 오류 표시가 노출된다",
      },
    )

    await installAuthRoutes(page, { authenticated: DEFAULT_USER, logoutStatus: 500 })
    await page.goto("/todos")
    await page.getByRole("button", { name: /사용자 메뉴 열기/ }).click()
    await page.getByRole("menuitem", { name: "로그아웃" }).click()

    // URL 은 그대로
    await expect(page).toHaveURL(/\/todos$/)
    await expect(page.getByText(/다시 시도/)).toBeVisible()
  })
})
