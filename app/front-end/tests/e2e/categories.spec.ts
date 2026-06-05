import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { DEFAULT_USER, installAuthRoutes } from "./_helpers/auth-mocks"
import { installCategoryRoutes } from "./_helpers/category-mocks"

// REQ-016~REQ-019 FE BDD: 카테고리 관리 화면. 모든 테스트는 카테고리 API 를 mock 하고
// 사용자가 관찰할 수 있는 결과만 검증한다. 상위 REQ-015 통합 여정은 live smoke 가 커버한다.

test.describe("카테고리 관리 — mock 전체 여정", () => {
  test.beforeEach(async ({ page }) => {
    await installAuthRoutes(page, { authenticated: DEFAULT_USER })
  })

  test("카테고리를 확인하고 만들고 수정한 뒤 삭제할 수 있다", async ({ page }) => {
    await installCategoryRoutes(page, {
      initial: [{ id: "c1", name: "업무", color: "#3b82f6" }],
    })
    await page.goto("/categories")
    await expect(page.getByRole("listitem").filter({ hasText: "업무" })).toBeVisible()

    await page.getByRole("button", { name: "새 카테고리" }).click()
    await page.getByLabel("이름", { exact: true }).fill("회의")
    await page.getByLabel("색상", { exact: true }).fill("#22c55e")
    await page.getByRole("button", { name: "만들기" }).click()
    await expect(page.getByRole("listitem").filter({ hasText: "회의" })).toBeVisible()

    await page.getByRole("button", { name: "회의 수정" }).click()
    await page.getByLabel("이름", { exact: true }).fill("회의록")
    await page.getByLabel("색상", { exact: true }).fill("#8b5cf6")
    await page.getByRole("button", { name: "저장" }).click()
    await expect(page.getByRole("listitem").filter({ hasText: "회의록" })).toBeVisible()
    await expect(page.getByRole("img", { name: "색상 #8b5cf6" })).toBeVisible()

    await page.getByRole("button", { name: "회의록 삭제" }).click()
    await page.getByRole("button", { name: "삭제", exact: true }).click()
    await expect(page.getByRole("listitem").filter({ hasText: "회의록" })).toHaveCount(0)
    await expect(page.getByRole("listitem").filter({ hasText: "업무" })).toBeVisible()
  })
})

test.describe("카테고리 화면 — 목록과 구성", () => {
  test.beforeEach(async ({ page }) => {
    await installAuthRoutes(page, { authenticated: DEFAULT_USER })
  })

  test("목록, 정렬, 이름·색상, 앱 셸 내비가 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-016" },
      {
        type: "Covers",
        description: "`/categories` 경로에 접근하면 자신의 카테고리 목록이 보인다",
      },
      {
        type: "Covers",
        description:
          "카테고리 목록은 정해진 정렬 순서대로 보이며, 같은 순서면 먼저 등록한 카테고리가 위로 정렬되어 보인다",
      },
      {
        type: "Covers",
        description: "카테고리 목록의 각 항목은 이름과 색상을 함께 표시한다",
      },
      {
        type: "Covers",
        description:
          "카테고리 화면은 보호 화면 앱 셸 안에 보이고, 할 일 화면과 카테고리 화면을 오갈 수 있는 내비가 보인다",
      },
    )

    await installCategoryRoutes(page, {
      initial: [
        { name: "업무", color: "#3b82f6" },
        { name: "개인", color: "#22c55e" },
        { name: "기타", color: null },
      ],
    })
    await page.goto("/categories")

    // 목록과 정렬 순서
    await expect(page.getByRole("listitem").nth(0)).toContainText("업무")
    await expect(page.getByRole("listitem").nth(1)).toContainText("개인")
    await expect(page.getByRole("listitem").nth(2)).toContainText("기타")

    // 각 항목의 이름 + 색상
    await expect(page.getByText("업무", { exact: true })).toBeVisible()
    await expect(page.getByRole("img", { name: "색상 #3b82f6" })).toBeVisible()

    // 보호 앱 셸 + 1차 내비(할 일 / 카테고리)
    await expect(page.getByRole("heading", { name: "카테고리" })).toBeVisible()
    await expect(page.getByRole("link", { name: "할 일" })).toBeVisible()
    await expect(page.getByRole("link", { name: "카테고리" })).toBeVisible()
    await expect(page.getByText(DEFAULT_USER.email)).toBeVisible()
  })

  test("카테고리가 없으면 빈 상태 안내가 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-016" },
      {
        type: "Covers",
        description: "카테고리가 하나도 없으면 카테고리가 비어 있다는 안내가 보인다",
      },
    )

    await installCategoryRoutes(page, { initial: [] })
    await page.goto("/categories")

    await expect(page.getByTestId("category-empty")).toBeVisible()
    await expect(page.getByText(/아직 카테고리가 없습니다/)).toBeVisible()
  })

  test("한 묶음보다 많으면 스크롤로 다음 묶음을 이어 보여준다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-016" },
      {
        type: "Covers",
        description:
          "카테고리가 한 묶음(20개)보다 많으면, 처음에는 첫 묶음의 카테고리까지만 보여주고 목록을 아래로 스크롤하면 다음 묶음의 카테고리를 이어서 보여준다",
      },
    )

    const seed = Array.from({ length: 25 }, (_, i) => ({
      name: `카테고리 ${String(i + 1).padStart(2, "0")}`,
    }))
    await installCategoryRoutes(page, { initial: seed })
    await page.goto("/categories")

    // 첫 묶음(20개)만: 첫 항목은 보이고, 둘째 묶음의 항목은 아직 없다.
    await expect(page.getByText("카테고리 01", { exact: true })).toBeVisible()
    await expect(page.getByText("카테고리 25", { exact: true })).toHaveCount(0)

    // 아래로 스크롤하면 다음 묶음을 이어 받아 둘째 묶음 항목이 보인다.
    const scroller = page.getByTestId("category-scroll")
    await expect(async () => {
      await scroller.evaluate((el) => el.scrollTo({ top: el.scrollHeight }))
      await expect(page.getByText("카테고리 25", { exact: true })).toBeVisible({
        timeout: 1000,
      })
    }).toPass({ timeout: 15000 })
  })

  test("데스크톱 화면에서 화면 밖으로 넘치지 않는다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-016" },
      {
        type: "Covers",
        description:
          "데스크톱 화면에서 카테고리 목록과 입력 영역의 주요 요소가 화면 밖으로 넘치지 않는다",
      },
    )

    await installCategoryRoutes(page, {
      initial: [
        { name: "업무", color: "#3b82f6" },
        { name: "개인", color: "#22c55e" },
      ],
    })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/categories")
    await expect(page.getByRole("heading", { name: "카테고리" })).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    )
    expect(hasHorizontalOverflow).toBe(false)
  })

  test("자동 접근성 검사에서 위반이 없다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-016" },
      {
        type: "Covers",
        description: "카테고리 화면은 자동 접근성 검사에서 위반이 없어야 한다",
      },
    )

    await installCategoryRoutes(page, {
      initial: [
        { name: "업무", color: "#3b82f6", description: "회사 일" },
        { name: "기타", color: null },
      ],
    })
    await page.goto("/categories")
    await expect(page.getByRole("heading", { name: "카테고리" })).toBeVisible()

    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  })
})

test.describe("카테고리 화면 — 보호 라우트", () => {
  test("비인증 사용자가 접근하면 로그인 화면으로 이동한다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-016" },
      {
        type: "Covers",
        description: "비인증 사용자가 카테고리 화면 경로에 접근하면 로그인 화면으로 이동한다",
      },
    )

    await installAuthRoutes(page, { authenticated: null })
    await page.goto("/categories")
    await expect(page).toHaveURL(/\/login/)
  })

  test("경로로 진입했다가 로그인하면 카테고리 화면으로 돌아온다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-016" },
      {
        type: "Covers",
        description: "카테고리 화면 경로로 진입했다가 로그인하면 카테고리 화면으로 돌아온다",
      },
    )

    await installAuthRoutes(page, { authenticated: null, loginStatus: 204 })
    await installCategoryRoutes(page, { initial: [{ name: "업무" }] })
    await page.goto("/categories")
    await expect(page).toHaveURL(/\/login\?loginRedirect=/)

    await page.getByLabel("이메일").fill(DEFAULT_USER.email)
    await page.getByLabel("비밀번호", { exact: true }).fill("password123")
    await page.getByRole("button", { name: "로그인" }).click()

    await expect(page).toHaveURL(/\/categories$/)
  })
})

test.describe("카테고리 생성", () => {
  test.beforeEach(async ({ page }) => {
    await installAuthRoutes(page, { authenticated: DEFAULT_USER })
  })

  test("새 카테고리 만들기를 열면 입력 영역과 만들기 버튼이 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-017" },
      {
        type: "Covers",
        description: "새 카테고리 만들기를 열면 이름, 색상, 설명을 입력하는 입력 영역과 만들기 버튼이 보인다",
      },
    )

    await installCategoryRoutes(page, { initial: [] })
    await page.goto("/categories")
    await page.getByRole("button", { name: "새 카테고리" }).click()

    await expect(page.getByLabel("이름", { exact: true })).toBeVisible()
    await expect(page.getByLabel("색상", { exact: true })).toBeVisible()
    await expect(page.getByLabel("설명", { exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "만들기" })).toBeVisible()
  })

  test("이름을 공백만 입력하면 이름 아래에 안내가 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-017" },
      { type: "Requirement", description: "REQ-018" },
      {
        type: "Covers",
        description:
          "카테고리를 만들거나 수정할 때 이름을 비우거나 공백만 입력하면 이름 입력 아래에 입력이 필요하다는 안내가 보인다",
      },
    )

    await installCategoryRoutes(page, { initial: [] })
    await page.goto("/categories")
    await page.getByRole("button", { name: "새 카테고리" }).click()
    await page.getByLabel("이름", { exact: true }).fill("   ")
    await page.getByRole("button", { name: "만들기" }).click()

    await expect(page.getByText("이름을 입력해 주세요.")).toBeVisible()
  })

  test("이름이 50자를 초과하면 너무 길다는 안내가 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-017" },
      { type: "Requirement", description: "REQ-018" },
      {
        type: "Covers",
        description: "카테고리를 만들거나 수정할 때 이름이 50자를 초과하면 이름이 너무 길다는 안내가 보인다",
      },
    )

    await installCategoryRoutes(page, { initial: [] })
    await page.goto("/categories")
    await page.getByRole("button", { name: "새 카테고리" }).click()
    await page.getByLabel("이름", { exact: true }).fill("가".repeat(51))
    await page.getByRole("button", { name: "만들기" }).click()

    await expect(page.getByText("이름은 50자를 넘을 수 없습니다.")).toBeVisible()
  })

  test("설명이 500자를 초과하면 너무 길다는 안내가 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-017" },
      { type: "Requirement", description: "REQ-018" },
      {
        type: "Covers",
        description: "카테고리를 만들거나 수정할 때 설명이 500자를 초과하면 설명이 너무 길다는 안내가 보인다",
      },
    )

    await installCategoryRoutes(page, { initial: [] })
    await page.goto("/categories")
    await page.getByRole("button", { name: "새 카테고리" }).click()
    await page.getByLabel("이름", { exact: true }).fill("유효한 이름")
    await page.getByLabel("설명", { exact: true }).fill("설".repeat(501))
    await page.getByRole("button", { name: "만들기" }).click()

    await expect(page.getByText("설명은 500자를 넘을 수 없습니다.")).toBeVisible()
  })

  test("색상 형식이 올바르지 않으면 색상 아래에 형식 안내가 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-017" },
      { type: "Requirement", description: "REQ-018" },
      {
        type: "Covers",
        description:
          "카테고리를 만들거나 수정할 때 색상 형식이 올바르지 않으면 색상 입력 아래에 형식 안내가 보인다",
      },
    )

    await installCategoryRoutes(page, { initial: [] })
    await page.goto("/categories")
    await page.getByRole("button", { name: "새 카테고리" }).click()
    await page.getByLabel("이름", { exact: true }).fill("유효한 이름")
    await page.getByLabel("색상", { exact: true }).fill("not-a-color")
    await page.getByRole("button", { name: "만들기" }).click()

    await expect(page.getByText("색상은 #RRGGBB 형식으로 입력해 주세요.")).toBeVisible()
  })

  test("유효한 정보로 만들면 새 카테고리가 목록에 나타난다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-017" },
      {
        type: "Covers",
        description: "유효한 정보로 카테고리를 만들면 새 카테고리가 목록에 나타난다",
      },
    )

    await installCategoryRoutes(page, { initial: [] })
    await page.goto("/categories")
    await page.getByRole("button", { name: "새 카테고리" }).click()
    await page.getByLabel("이름", { exact: true }).fill("회의")
    await page.getByLabel("색상", { exact: true }).fill("#22c55e")
    await page.getByRole("button", { name: "만들기" }).click()

    await expect(page.getByRole("listitem").filter({ hasText: "회의" })).toBeVisible()
  })

  test("이미 쓰는 이름으로 만들려고 하면 중복 이름 안내가 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-017" },
      {
        type: "Covers",
        description: "이미 사용 중인 이름으로 카테고리를 만들려고 하면 중복 이름 안내가 보인다",
      },
    )

    await installCategoryRoutes(page, { initial: [{ name: "업무", color: "#3b82f6" }] })
    await page.goto("/categories")
    await page.getByRole("button", { name: "새 카테고리" }).click()
    await page.getByLabel("이름", { exact: true }).fill("업무")
    await page.getByRole("button", { name: "만들기" }).click()

    await expect(page.getByText(/같은 이름의 카테고리가 이미 있습니다/)).toBeVisible()
  })

  test("만들기·저장·삭제 요청을 기다리는 동안 확인 버튼은 다시 누를 수 없다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-017" },
      { type: "Requirement", description: "REQ-018" },
      { type: "Requirement", description: "REQ-019" },
      {
        type: "Covers",
        description: "카테고리를 만드는 요청을 기다리는 동안 만들기 버튼은 다시 누를 수 없는 상태로 표시된다",
      },
      {
        type: "Covers",
        description: "카테고리를 수정하는 요청을 기다리는 동안 저장 버튼은 다시 누를 수 없는 상태로 표시된다",
      },
      {
        type: "Covers",
        description: "카테고리를 삭제하는 요청을 기다리는 동안 삭제 버튼은 다시 누를 수 없는 상태로 표시된다",
      },
    )

    // 생성/수정은 같은 CategoryForm, 삭제는 별도 CategoryDeleteDialog 경로이므로 세 흐름을 모두 검증한다.
    const categories = await installCategoryRoutes(page, {
      initial: [{ id: "c1", name: "업무" }],
    })
    await page.goto("/categories")

    // 만들기 대기 중: "만드는 중..." 비활성 + 추가 요청 차단
    categories.pauseWrites()
    await page.getByRole("button", { name: "새 카테고리" }).click()
    await page.getByLabel("이름", { exact: true }).fill("회의")
    await page.getByRole("button", { name: "만들기" }).click()
    const creating = page.getByRole("button", { name: "만드는 중..." })
    await expect(creating).toBeDisabled()
    await creating.click({ force: true }).catch(() => {})
    expect(categories.createCount()).toBe(1)
    categories.resumeWrites()
    await expect(
      page.getByRole("listitem").filter({ hasText: "회의" }),
    ).toBeVisible()

    // 저장(수정) 대기 중: "저장 중..." 비활성 + 추가 요청 차단
    categories.pauseWrites()
    await page.getByRole("button", { name: "업무 수정" }).click()
    await page.getByLabel("이름", { exact: true }).fill("업무2")
    await page.getByRole("button", { name: "저장" }).click()
    const saving = page.getByRole("button", { name: "저장 중..." })
    await expect(saving).toBeDisabled()
    await saving.click({ force: true }).catch(() => {})
    expect(categories.updateCount()).toBe(1)
    categories.resumeWrites()
    await expect(
      page.getByRole("listitem").filter({ hasText: "업무2" }),
    ).toBeVisible()

    // 삭제 대기 중: "삭제 중..." 비활성 + 추가 요청 차단
    categories.pauseWrites()
    await page.getByRole("button", { name: "회의 삭제" }).click()
    await page.getByRole("button", { name: "삭제", exact: true }).click()
    const deleting = page.getByRole("button", { name: "삭제 중..." })
    await expect(deleting).toBeDisabled()
    await deleting.click({ force: true }).catch(() => {})
    expect(categories.deleteCount()).toBe(1)
    categories.resumeWrites()
    await expect(
      page.getByRole("listitem").filter({ hasText: "회의" }),
    ).toHaveCount(0)
  })
})

test.describe("카테고리 수정과 삭제", () => {
  test.beforeEach(async ({ page }) => {
    await installAuthRoutes(page, { authenticated: DEFAULT_USER })
  })

  test("이름과 색상을 바꾸면 목록에 반영된다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-018" },
      {
        type: "Covers",
        description: "카테고리를 수정해 이름이나 색상을 바꾸면 변경된 이름과 색상이 목록에 반영된다",
      },
    )

    await installCategoryRoutes(page, {
      initial: [{ id: "c1", name: "업무", color: "#3b82f6" }],
    })
    await page.goto("/categories")
    await page.getByRole("button", { name: "업무 수정" }).click()
    await page.getByLabel("이름", { exact: true }).fill("회의")
    await page.getByLabel("색상", { exact: true }).fill("#8b5cf6")
    await page.getByRole("button", { name: "저장" }).click()

    await expect(page.getByRole("listitem").filter({ hasText: "회의" })).toBeVisible()
    await expect(page.getByText("업무", { exact: true })).toHaveCount(0)
    await expect(page.getByRole("img", { name: "색상 #8b5cf6" })).toBeVisible()
  })

  test("설명을 바꾼 뒤 수정 화면을 다시 열면 변경된 설명이 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-018" },
      {
        type: "Covers",
        description: "카테고리를 수정해 설명을 바꾼 뒤 수정 화면을 다시 열면 변경된 설명이 보인다",
      },
    )

    await installCategoryRoutes(page, {
      initial: [{ id: "c1", name: "업무", description: "이전 설명" }],
    })
    await page.goto("/categories")
    await page.getByRole("button", { name: "업무 수정" }).click()
    await page.getByLabel("설명", { exact: true }).fill("새 설명")
    // 저장 후 목록이 다시 조회되어 변경된 설명이 캐시에 반영된 뒤 수정 화면을 다시 연다.
    const refetched = page.waitForResponse(
      (r) => r.request().method() === "GET" && r.url().includes("/categories?"),
    )
    await page.getByRole("button", { name: "저장" }).click()
    await refetched

    await page.getByRole("button", { name: "업무 수정" }).click()
    await expect(page.getByLabel("설명", { exact: true })).toHaveValue("새 설명")
  })

  test("색상을 비우면 목록에서 색상 표시가 사라진다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-018" },
      {
        type: "Covers",
        description: "카테고리를 수정할 때 색상을 비우면 목록에서 그 카테고리의 색상 표시가 사라진다",
      },
    )

    await installCategoryRoutes(page, {
      initial: [{ id: "c1", name: "업무", color: "#3b82f6" }],
    })
    await page.goto("/categories")
    await expect(page.getByRole("img", { name: "색상 #3b82f6" })).toBeVisible()

    await page.getByRole("button", { name: "업무 수정" }).click()
    await page.getByRole("button", { name: "지우기" }).click()
    await page.getByRole("button", { name: "저장" }).click()

    await expect(page.getByRole("img", { name: "색상 #3b82f6" })).toHaveCount(0)
    await expect(page.getByRole("listitem").filter({ hasText: "업무" })).toBeVisible()
  })

  test("설명을 비운 뒤 수정 화면을 다시 열면 설명이 비어 있다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-018" },
      {
        type: "Covers",
        description: "카테고리를 수정할 때 설명을 비운 뒤 수정 화면을 다시 열면 설명이 비어 있다",
      },
    )

    await installCategoryRoutes(page, {
      initial: [{ id: "c1", name: "업무", description: "이전 설명" }],
    })
    await page.goto("/categories")
    await page.getByRole("button", { name: "업무 수정" }).click()
    await page.getByLabel("설명", { exact: true }).fill("")
    const refetchedAfterClear = page.waitForResponse(
      (r) => r.request().method() === "GET" && r.url().includes("/categories?"),
    )
    await page.getByRole("button", { name: "저장" }).click()
    await refetchedAfterClear

    await page.getByRole("button", { name: "업무 수정" }).click()
    await expect(page.getByLabel("설명", { exact: true })).toHaveValue("")
  })

  test("이미 쓰는 다른 이름으로 바꾸려고 하면 중복 이름 안내가 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-018" },
      {
        type: "Covers",
        description: "카테고리를 수정할 때 이미 사용 중인 다른 이름으로 바꾸려고 하면 중복 이름 안내가 보인다",
      },
    )

    await installCategoryRoutes(page, {
      initial: [
        { id: "c1", name: "업무" },
        { id: "c2", name: "개인" },
      ],
    })
    await page.goto("/categories")
    await page.getByRole("button", { name: "개인 수정" }).click()
    await page.getByLabel("이름", { exact: true }).fill("업무")
    await page.getByRole("button", { name: "저장" }).click()

    await expect(page.getByText(/같은 이름의 카테고리가 이미 있습니다/)).toBeVisible()
  })

  test("삭제하면 확인 안내와 미분류 설명이 보이고, 확인하면 목록에서 사라진다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-019" },
      {
        type: "Covers",
        description:
          "카테고리를 삭제하려고 하면 삭제를 확인받는 안내와 함께, 그 카테고리에 묶였던 할 일이 미분류로 바뀐다는 설명이 보인다",
      },
      {
        type: "Covers",
        description: "삭제를 확인하면 그 카테고리가 목록에서 사라진다",
      },
    )

    await installCategoryRoutes(page, {
      initial: [{ id: "c1", name: "업무", color: "#3b82f6" }],
    })
    await page.goto("/categories")
    await page.getByRole("button", { name: "업무 삭제" }).click()

    // 삭제 확인 + 미분류 안내
    await expect(page.getByText(/삭제할까요/)).toBeVisible()
    await expect(page.getByText(/미분류로 바뀝니다/)).toBeVisible()

    // 확인하면 목록에서 사라진다
    await page.getByRole("button", { name: "삭제", exact: true }).click()
    await expect(page.getByRole("listitem").filter({ hasText: "업무" })).toHaveCount(0)
    await expect(page.getByTestId("category-empty")).toBeVisible()
  })
})
