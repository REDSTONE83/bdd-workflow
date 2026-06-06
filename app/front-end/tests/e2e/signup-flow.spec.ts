import { expect, test } from "@playwright/test"

import { DEFAULT_USER, installAuthRoutes } from "./_helpers/auth-mocks"
import { installCategoryRoutes } from "./_helpers/category-mocks"
import { installSignupRoute } from "./_helpers/signup-mocks"
import { installTodoRoutes } from "./_helpers/todo-mocks"

const VALID = {
  name: "홍길동",
  email: "newuser@example.com",
  password: "Password123!",
}

// REQ-001 FE: 가입 성공 후 /login 이동 + 가입 완료 안내, 인증 상태 라우팅 가드.
test.describe("회원 가입 성공 흐름 / 인증 가드", () => {
  test("가입에 성공하면 /login 으로 이동해 가입 완료 안내가 보인다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-001" },
      {
        type: "Covers",
        description: "회원 가입에 성공하면 사용자는 `/login` 화면으로 이동한다",
      },
      {
        type: "Covers",
        description: "회원 가입에 성공해 `/login`으로 이동하면 가입이 완료되었다는 안내가 보인다",
      },
    )

    await installAuthRoutes(page, { authenticated: null })
    await installSignupRoute(page, { status: 201 })

    await page.goto("/signup")
    await page.getByLabel("사용자 이름").fill(VALID.name)
    await page.getByLabel("이메일").fill(VALID.email)
    await page.getByLabel("비밀번호", { exact: true }).fill(VALID.password)
    await page.getByRole("button", { name: "회원 가입" }).click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByText("회원 가입이 완료되었습니다")).toBeVisible()
  })

  test("이미 인증된 사용자가 /signup 에 접근하면 /todos 로 이동한다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-001" },
      {
        type: "Covers",
        description: "이미 인증된 사용자가 회원 가입 화면에 접근하면 자신의 할 일 목록 화면으로 이동한다",
      },
    )

    await installAuthRoutes(page, { authenticated: DEFAULT_USER })
    await installCategoryRoutes(page, { initial: [] })
    await installTodoRoutes(page, { initial: [] })
    await page.goto("/signup")

    await expect(page).toHaveURL(/\/todos$/)
  })
})
