import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { routeApi } from "./_helpers/apiRoute"
import { installAuthRoutes } from "./_helpers/auth-mocks"
import { installSignupRoute } from "./_helpers/signup-mocks"

const VALID = {
  name: "홍길동",
  email: "newuser@example.com",
  password: "Password123!",
}

// REQ-013 FE: 회원 가입 화면 폼 구성/검증/제출 중/중복 이메일/접근성/데스크톱 레이아웃.
test.describe("회원 가입 화면 폼", () => {
  test.beforeEach(async ({ page }) => {
    await installAuthRoutes(page, { authenticated: null })
  })

  test("회원 가입 카드 구조와 로그인 링크", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-013" },
      {
        type: "Covers",
        description:
          "`/signup` 경로에 접근하면 사용자 이름, 이메일, 비밀번호를 입력하고 회원 가입을 제출할 수 있는 화면이 보인다",
      },
      {
        type: "Covers",
        description:
          "회원 가입 화면은 화면 가운데에 하나의 회원 가입 카드를 표시하고, 카드는 제목, 사용자 이름 입력, 이메일 입력, 비밀번호 입력, 회원 가입 버튼, 로그인 화면으로 돌아가는 링크로 구성된다",
      },
      {
        type: "Covers",
        description: "회원 가입 화면에는 로그인 화면으로 돌아갈 수 있는 링크가 있다",
      },
    )

    await page.goto("/signup")

    await expect(page.getByRole("heading", { name: "회원 가입" })).toBeVisible()
    await expect(page.getByLabel("사용자 이름")).toBeVisible()
    await expect(page.getByLabel("이메일")).toBeVisible()
    await expect(page.getByLabel("비밀번호", { exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "회원 가입" })).toBeVisible()
    await expect(page.getByRole("link", { name: /로그인/ })).toBeVisible()
  })

  test("빈 입력으로 제출하면 각 입력 아래에 안내가 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-013" },
      {
        type: "Covers",
        description:
          "사용자 이름, 이메일 또는 비밀번호를 비워 둔 채 회원 가입을 시도하면 해당 입력 아래에 입력이 필요하다는 안내가 보인다",
      },
    )

    await page.goto("/signup")
    await page.getByRole("button", { name: "회원 가입" }).click()

    await expect(page.getByText("사용자 이름을 입력해 주세요.")).toBeVisible()
    await expect(page.getByText("이메일을 입력해 주세요.")).toBeVisible()
    await expect(page.getByText("비밀번호를 입력해 주세요.")).toBeVisible()
  })

  test("이름이 100자를 초과하면 너무 길다는 안내가 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-013" },
      {
        type: "Covers",
        description: "사용자 이름이 100자를 초과하면 사용자 이름이 너무 길다는 안내가 보인다",
      },
    )

    await page.goto("/signup")
    await page.getByLabel("사용자 이름").fill("가".repeat(101))
    await page.getByLabel("이메일").fill(VALID.email)
    await page.getByLabel("비밀번호", { exact: true }).fill(VALID.password)
    await page.getByRole("button", { name: "회원 가입" }).click()

    await expect(page.getByText("사용자 이름은 100자 이하여야 합니다.")).toBeVisible()
  })

  test("이메일 형식이 아닌 값으로 제출하면 이메일 아래에 형식 안내가 보인다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-013" },
      {
        type: "Covers",
        description:
          "이메일 형식이 아닌 값을 입력하고 회원 가입을 시도하면 이메일 입력 아래에 형식 안내가 보인다",
      },
    )

    await page.goto("/signup")
    await page.getByLabel("사용자 이름").fill(VALID.name)
    await page.getByLabel("이메일").fill("not-an-email")
    await page.getByLabel("비밀번호", { exact: true }).fill(VALID.password)
    await page.getByRole("button", { name: "회원 가입" }).click()

    await expect(page.getByText("이메일 형식으로 입력해 주세요.")).toBeVisible()
  })

  test("비밀번호가 8자 미만이면 너무 짧다는 안내가 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-013" },
      {
        type: "Covers",
        description: "비밀번호가 8자 미만이면 비밀번호가 너무 짧다는 안내가 보인다",
      },
    )

    await page.goto("/signup")
    await page.getByLabel("사용자 이름").fill(VALID.name)
    await page.getByLabel("이메일").fill(VALID.email)
    await page.getByLabel("비밀번호", { exact: true }).fill("Ab1!")
    await page.getByRole("button", { name: "회원 가입" }).click()

    await expect(page.getByText("비밀번호는 8자 이상이어야 합니다.")).toBeVisible()
  })

  test("비밀번호가 허용되지 않는 문자를 포함하면 사용할 수 없다는 안내가 보인다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-013" },
      {
        type: "Covers",
        description:
          "비밀번호가 72자를 초과하거나 허용되지 않는 문자를 포함하면 사용할 수 없는 비밀번호라는 안내가 보인다",
      },
    )

    await page.goto("/signup")
    await page.getByLabel("사용자 이름").fill(VALID.name)
    await page.getByLabel("이메일").fill(VALID.email)
    // 비ASCII(한글)는 허용 문자 정책 위반.
    await page.getByLabel("비밀번호", { exact: true }).fill("비밀번호abcd")
    await page.getByRole("button", { name: "회원 가입" }).click()

    await expect(page.getByText("사용할 수 없는 비밀번호입니다.")).toBeVisible()
  })

  test("비밀번호가 72자를 초과하면 사용할 수 없다는 안내가 보인다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-013" },
      {
        type: "Covers",
        description:
          "비밀번호가 72자를 초과하거나 허용되지 않는 문자를 포함하면 사용할 수 없는 비밀번호라는 안내가 보인다",
      },
    )

    await page.goto("/signup")
    await page.getByLabel("사용자 이름").fill(VALID.name)
    await page.getByLabel("이메일").fill(VALID.email)
    // 73자(72자 초과). 허용 문자만으로 구성해 길이 초과 분기만 단독으로 검증한다.
    await page.getByLabel("비밀번호", { exact: true }).fill("a".repeat(73))
    await page.getByRole("button", { name: "회원 가입" }).click()

    await expect(page.getByText("사용할 수 없는 비밀번호입니다.")).toBeVisible()
  })

  test("제출 응답 대기 중 버튼은 비활성화되고 중복 제출이 차단된다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-013" },
      {
        type: "Covers",
        description:
          "회원 가입 버튼을 누른 뒤 응답을 기다리는 동안 회원 가입 버튼은 다시 누를 수 없는 상태로 표시된다",
      },
      {
        type: "Covers",
        description:
          "회원 가입 응답을 기다리는 동안 같은 폼을 다시 제출해도 추가 회원 가입 요청이 서버로 전송되지 않는다",
      },
    )

    let resolveSignup = () => {}
    let signupCalls = 0
    await routeApi(page, "**/users/signup", async (route) => {
      signupCalls += 1
      await new Promise<void>((resolve) => {
        resolveSignup = resolve
      })
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ userId: "x", email: VALID.email, name: VALID.name }),
      })
    })

    await page.goto("/signup")
    await page.getByLabel("사용자 이름").fill(VALID.name)
    await page.getByLabel("이메일").fill(VALID.email)
    await page.getByLabel("비밀번호", { exact: true }).fill(VALID.password)
    await page.getByRole("button", { name: "회원 가입" }).click()

    const pending = page.getByRole("button", { name: "가입 처리 중..." })
    await expect(pending).toBeDisabled()

    // 대기 중 두 번째 클릭 시도 — disabled 라 무시되어야 한다.
    await pending.click({ force: true }).catch(() => {})

    resolveSignup()
    expect(signupCalls).toBe(1)
  })

  test("이미 등록된 이메일로 거절되면 중복 안내가 보이고 이름·이메일은 유지, 비밀번호는 비워진다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-013" },
      {
        type: "Covers",
        description:
          "이미 등록된 이메일로 회원 가입이 거절되면 중복 이메일 안내가 보이고 입력했던 사용자 이름과 이메일은 유지된다",
      },
      {
        type: "Covers",
        description: "서버 응답으로 회원 가입이 거절되면 비밀번호 입력은 비워진다",
      },
    )

    await installSignupRoute(page, { status: 409 })
    await page.goto("/signup")
    await page.getByLabel("사용자 이름").fill(VALID.name)
    await page.getByLabel("이메일").fill("exists@example.com")
    await page.getByLabel("비밀번호", { exact: true }).fill(VALID.password)
    await page.getByRole("button", { name: "회원 가입" }).click()

    await expect(page.getByText("이미 등록된 이메일입니다")).toBeVisible()
    await expect(
      page.getByRole("link", { name: "로그인 화면으로 이동" }),
    ).toBeVisible()
    await expect(page.getByLabel("사용자 이름")).toHaveValue(VALID.name)
    await expect(page.getByLabel("이메일")).toHaveValue("exists@example.com")
    await expect(page.getByLabel("비밀번호", { exact: true })).toHaveValue("")
  })

  test("데스크톱 화면에서 카드가 가로로 넘치지 않는다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-013" },
      {
        type: "Covers",
        description:
          "데스크톱 화면에서 회원 가입 카드의 주요 입력과 버튼이 화면 밖으로 넘치지 않는다",
      },
    )

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/signup")
    await expect(page.getByRole("heading", { name: "회원 가입" })).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      )
    })
    expect(hasHorizontalOverflow).toBe(false)
  })

  test("자동 접근성 검사에서 위반이 없다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-013" },
      {
        type: "Covers",
        description: "회원 가입 화면은 자동 접근성 검사에서 위반이 없어야 한다",
      },
    )

    await page.goto("/signup")
    await expect(page.getByRole("heading", { name: "회원 가입" })).toBeVisible()

    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
})
