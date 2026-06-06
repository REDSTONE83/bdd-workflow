import { expect, test } from "@playwright/test"

import { routeApi } from "./_helpers/apiRoute"
import { DEFAULT_USER, installAuthRoutes } from "./_helpers/auth-mocks"
import { installCategoryRoutes } from "./_helpers/category-mocks"
import { installTodoRoutes } from "./_helpers/todo-mocks"

// REQ-011 FE: 로그인 화면 폼의 구성/포커스/마스킹/토글/검증/Enter/대기/실패 처리.
test.describe("로그인 화면 폼", () => {
  test.beforeEach(async ({ page }) => {
    await installAuthRoutes(page, { authenticated: null })
  })

  test("로그인 카드 구조와 가입 링크", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description:
          "로그인 화면은 화면 가운데에 하나의 로그인 카드를 표시하고, 카드는 이메일 입력, 비밀번호 입력, 로그인 버튼으로 구성된다",
      },
      {
        type: "Covers",
        description: "로그인 카드 하단에는 가입 화면으로 이동하는 텍스트 링크가 있다",
      },
    )

    await page.goto("/login")

    await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible()
    await expect(page.getByLabel("이메일")).toBeVisible()
    await expect(page.getByLabel("비밀번호", { exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible()
    await expect(page.getByRole("link", { name: /가입/ })).toBeVisible()
  })

  test("이메일 입력에 자동으로 포커스가 들어간다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description: "로그인 화면을 열면 이메일 입력에 자동으로 입력 포커스가 간다",
      },
    )

    await page.goto("/login")
    await expect(page.getByLabel("이메일")).toBeFocused()
  })

  test("비밀번호는 기본 마스킹되며 토글로 보이기/가리기가 가능하고 상태가 보조 기술에 안내된다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description:
          "로그인 화면의 비밀번호 입력은 처음에는 입력값이 화면에 그대로 보이지 않게 가려진다",
      },
      {
        type: "Covers",
        description:
          "로그인 화면의 비밀번호 입력 옆에는 입력값을 보이거나 다시 가릴 수 있는 토글 버튼이 있다",
      },
      {
        type: "Covers",
        description:
          "비밀번호 토글을 보이기로 바꾸면 입력값이 화면에 그대로 보이고, 다시 가리기로 바꾸면 다시 가려진다",
      },
      {
        type: "Covers",
        description:
          "비밀번호 토글은 키보드로 조작할 수 있고, 현재 보이기와 가리기 상태가 보조 기술에 안내된다",
      },
    )

    await page.goto("/login")
    const pwd = page.getByLabel("비밀번호", { exact: true })
    await expect(pwd).toHaveAttribute("type", "password")

    const toggle = page.getByRole("button", { name: "비밀번호 보이기" })
    await expect(toggle).toBeVisible()
    await expect(toggle).toHaveAttribute("aria-pressed", "false")

    // 키보드로 토글 활성화
    await pwd.fill("secret-value")
    await toggle.focus()
    await page.keyboard.press("Enter")

    await expect(pwd).toHaveAttribute("type", "text")
    await expect(page.getByRole("button", { name: "비밀번호 가리기" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )

    // 다시 가리기
    await page.keyboard.press("Enter")
    await expect(pwd).toHaveAttribute("type", "password")
  })

  test("빈 입력으로 제출하면 각 필드 아래에 안내가 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description:
          "이메일을 비워둔 채 로그인을 시도하면 이메일 입력 아래에 입력이 필요하다는 안내가 보인다",
      },
      {
        type: "Covers",
        description:
          "비밀번호를 비워둔 채 로그인을 시도하면 비밀번호 입력 아래에 입력이 필요하다는 안내가 보인다",
      },
    )

    await page.goto("/login")
    await page.getByRole("button", { name: "로그인" }).click()

    await expect(page.getByText("이메일을 입력해 주세요.")).toBeVisible()
    await expect(page.getByText("비밀번호를 입력해 주세요.")).toBeVisible()
  })

  test("이메일 형식이 아닌 값으로 제출하면 이메일 아래에 형식 안내가 보인다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description:
          "이메일 형식이 아닌 값을 입력하고 로그인을 시도하면 이메일 입력 아래에 형식 안내가 보인다",
      },
    )

    await page.goto("/login")
    await page.getByLabel("이메일").fill("not-an-email")
    await page.getByLabel("비밀번호", { exact: true }).fill("password123")
    await page.getByRole("button", { name: "로그인" }).click()

    await expect(page.getByText("이메일 형식으로 입력해 주세요.")).toBeVisible()
  })

  test("Enter 키로 로그인 폼을 제출할 수 있다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      { type: "Covers", description: "키보드 Enter 입력으로 로그인을 제출할 수 있다" },
    )

    await installAuthRoutes(page, { authenticated: null, loginStatus: 204 })
    await installCategoryRoutes(page, { initial: [] })
    await installTodoRoutes(page, { initial: [] })
    await page.goto("/login")
    await page.getByLabel("이메일").fill(DEFAULT_USER.email)
    await page.getByLabel("비밀번호", { exact: true }).fill("password123")
    await page.getByLabel("비밀번호", { exact: true }).press("Enter")

    await expect(page).toHaveURL(/\/todos$/)
  })

  test("로그인 응답 대기 중 버튼은 비활성화되고 중복 제출이 차단된다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description:
          "로그인 버튼을 누른 뒤 응답을 기다리는 동안 로그인 버튼은 다시 누를 수 없는 상태로 표시된다",
      },
      {
        type: "Covers",
        description:
          "로그인 응답을 기다리는 동안 같은 폼을 다시 제출해도 추가 로그인 요청이 서버로 전송되지 않는다",
      },
    )

    let resolveLogin = () => {}
    let loginCalls = 0
    await routeApi(page, "**/auth/me", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ code: "UNAUTHORIZED" }),
      })
    })
    await routeApi(page, "**/auth/login", async (route) => {
      loginCalls += 1
      await new Promise<void>((resolve) => {
        resolveLogin = resolve
      })
      await route.fulfill({ status: 204, body: "" })
    })

    await page.goto("/login")
    await page.getByLabel("이메일").fill(DEFAULT_USER.email)
    await page.getByLabel("비밀번호", { exact: true }).fill("password123")

    const submit = page.getByRole("button", { name: "로그인 중..." }).or(
      page.getByRole("button", { name: "로그인" }),
    )
    await page.getByRole("button", { name: "로그인" }).click()

    // 대기 상태 진입
    await expect(page.getByRole("button", { name: "로그인 중..." })).toBeDisabled()

    // 두 번째 클릭 시도 (disabled 이므로 무시되거나 noop)
    await submit.click({ force: true }).catch(() => {})

    // 대기 종료
    resolveLogin()
    await expect(submit).not.toBeDisabled().catch(() => {})

    expect(loginCalls).toBe(1)
  })

  test("인증 실패 시 공통 안내가 보이고 이메일은 유지, 비밀번호는 비워진다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-011" },
      {
        type: "Covers",
        description:
          "로그인 화면에서 인증에 실패하면 폼 상단에 어느 쪽이 잘못됐는지 구분하지 않는 공통 안내가 보이고, 입력했던 이메일은 그대로 유지되며 비밀번호 입력은 비워진다",
      },
    )

    await installAuthRoutes(page, { authenticated: null, loginStatus: 401 })
    await page.goto("/login")
    await page.getByLabel("이메일").fill(DEFAULT_USER.email)
    await page.getByLabel("비밀번호", { exact: true }).fill("wrong-password")
    await page.getByRole("button", { name: "로그인" }).click()

    await expect(
      page.getByText("이메일 또는 비밀번호가 올바르지 않습니다."),
    ).toBeVisible()
    await expect(page.getByLabel("이메일")).toHaveValue(DEFAULT_USER.email)
    await expect(page.getByLabel("비밀번호", { exact: true })).toHaveValue("")
  })
})
