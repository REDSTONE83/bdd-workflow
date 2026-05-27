import { expect, test } from "@playwright/test"

import { DEFAULT_USER, installAuthRoutes } from "./_helpers/auth-mocks"

// REQ-011 FS/FE: 로그인 성공 후 redirect 분기, open redirect 차단, 이미 인증된 사용자의 /login 진입,
// 비인증 사용자의 보호 화면 접근, FS-2 round-trip.
test.describe("로그인 성공 후 이동 / 라우트 가드 / open redirect 방어", () => {
  test("로그인 성공 시 기본 진입점(/todos)으로 이동한다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description:
          "로그인 화면에서 인증에 성공하면 원래 가려고 했던 보호 화면이 있으면 그 화면으로, 없으면 자신의 할 일 목록 화면으로 이동한다",
      },
    )

    await installAuthRoutes(page, { authenticated: null, loginStatus: 204 })
    await page.goto("/login")
    await page.getByLabel("이메일").fill(DEFAULT_USER.email)
    await page.getByLabel("비밀번호", { exact: true }).fill("password123")
    await page.getByRole("button", { name: "로그인" }).click()

    await expect(page).toHaveURL(/\/todos$/)
  })

  test("비신뢰 loginRedirect 는 무시되고 기본 진입점으로 이동한다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description:
          "로그인 성공 후 이동 대상이 본 애플리케이션의 보호 라우트 경로가 아니거나 외부 사이트로 가는 값이면 그 값은 무시되고 할 일 목록 화면으로 이동한다",
      },
    )

    await installAuthRoutes(page, { authenticated: null, loginStatus: 204 })
    await page.goto("/login?loginRedirect=https://evil.example.com/")
    await page.getByLabel("이메일").fill(DEFAULT_USER.email)
    await page.getByLabel("비밀번호", { exact: true }).fill("password123")
    await page.getByRole("button", { name: "로그인" }).click()

    await expect(page).toHaveURL(/\/todos$/)
  })

  test("이미 인증된 사용자가 /login 에 접근하면 /todos 로 이동한다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description: "이미 인증된 사용자가 로그인 화면에 접근하면 할 일 목록 화면으로 이동한다",
      },
    )

    await installAuthRoutes(page, { authenticated: DEFAULT_USER })
    await page.goto("/login")
    await expect(page).toHaveURL(/\/todos$/)
  })

  test("비인증 사용자가 보호 화면(/todos)에 접근하면 /login 으로 이동한다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description: "비인증 사용자가 보호 화면에 접근하면 로그인 화면으로 이동한다",
      },
    )

    await installAuthRoutes(page, { authenticated: null })
    await page.goto("/todos")
    await expect(page).toHaveURL(/\/login/)
  })

  test("비인증 사용자가 보호 화면 진입 시도 후 로그인에 성공하면 원래 화면으로 돌아온다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description:
          "비인증 사용자가 보호 화면에 접근했다가 로그인에 성공하면 원래 가려고 했던 보호 화면으로 돌아온다",
      },
    )

    await installAuthRoutes(page, { authenticated: null, loginStatus: 204 })
    await page.goto("/todos")
    await expect(page).toHaveURL(/\/login\?loginRedirect=/)

    await page.getByLabel("이메일").fill(DEFAULT_USER.email)
    await page.getByLabel("비밀번호", { exact: true }).fill("password123")
    await page.getByRole("button", { name: "로그인" }).click()

    await expect(page).toHaveURL(/\/todos$/)
  })
})
