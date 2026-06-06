import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { DEFAULT_USER, installAuthRoutes } from "./_helpers/auth-mocks"
import { installCategoryRoutes } from "./_helpers/category-mocks"
import { installTodoRoutes, type SeedTodo } from "./_helpers/todo-mocks"

const TODO_CATEGORIES = [
  { categoryId: "cat-work", name: "업무", color: "#3b82f6" },
  { categoryId: "cat-home", name: "개인", color: "#22c55e" },
]

const CATEGORY_SEEDS = TODO_CATEGORIES.map((category) => ({
  id: category.categoryId,
  name: category.name,
  color: category.color,
}))

const seededTodo = (overrides: Partial<SeedTodo> = {}): SeedTodo => ({
  id: "todo-1",
  title: "분기 보고서",
  description: "초안을 작성합니다.",
  dueDate: "2026-06-20",
  priority: "HIGH",
  completed: false,
  category: TODO_CATEGORIES[0],
  ...overrides,
})

async function installTodoScreenRoutes(
  page: Parameters<typeof installAuthRoutes>[0],
  todos: SeedTodo[],
) {
  await installCategoryRoutes(page, { initial: CATEGORY_SEEDS })
  return installTodoRoutes(page, { initial: todos, categories: TODO_CATEGORIES })
}

test.describe("할 일 관리 화면 — 목록과 상태", () => {
  test.beforeEach(async ({ page }) => {
    await installAuthRoutes(page, { authenticated: DEFAULT_USER })
  })

  test("목록, 항목 정보, 앱 셸 내비가 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-023" },
      {
        type: "Covers",
        description: "`/todos` 경로에 접근하면 자신의 할 일 목록이 보인다",
      },
      {
        type: "Covers",
        description: "할 일 목록은 서버가 반환한 순서대로 보인다",
      },
      {
        type: "Covers",
        description:
          "할 일 목록의 각 항목은 제목, 설명, 마감일, 우선순위, 완료 상태, 카테고리 이름과 색상을 함께 표시한다",
      },
      {
        type: "Covers",
        description: "카테고리 연결이 없는 할 일은 미분류로 보인다",
      },
      {
        type: "Covers",
        description:
          "할 일 화면은 보호 앱 셸 안에 보이고, 할 일 화면과 카테고리 화면을 오갈 수 있는 내비가 보인다",
      },
    )

    await installTodoScreenRoutes(page, [
      seededTodo(),
      seededTodo({
        id: "todo-2",
        title: "운동 예약",
        description: null,
        dueDate: null,
        priority: "MEDIUM",
        completed: true,
        category: null,
      }),
    ])
    await page.goto("/todos")

    await expect(page.getByRole("heading", { name: "할 일" })).toBeVisible()
    await expect(page.getByRole("link", { name: "할 일" })).toBeVisible()
    await expect(page.getByRole("link", { name: "카테고리" })).toBeVisible()
    await expect(page.getByText(DEFAULT_USER.email)).toBeVisible()

    await expect(page.getByRole("listitem").nth(0)).toContainText("분기 보고서")
    await expect(page.getByRole("listitem").nth(1)).toContainText("운동 예약")

    const report = page.getByRole("listitem").filter({ hasText: "분기 보고서" })
    await expect(report).toContainText("초안을 작성합니다.")
    await expect(report).toContainText("마감 2026-06-20")
    await expect(report).toContainText("우선순위 높음")
    await expect(report).toContainText("미완료")
    await expect(report).toContainText("업무")
    await expect(page.getByRole("img", { name: "색상 #3b82f6" })).toBeVisible()

    const uncategorized = page.getByRole("listitem").filter({ hasText: "운동 예약" })
    await expect(uncategorized).toContainText("완료")
    await expect(uncategorized).toContainText("미분류")
  })

  test("한 묶음보다 많으면 스크롤로 다음 묶음을 이어 보여준다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-023" },
      {
        type: "Covers",
        description:
          "할 일이 한 묶음(20개)보다 많으면, 처음에는 첫 묶음의 할 일까지만 보여주고 목록을 아래로 스크롤하면 다음 묶음의 할 일을 이어서 보여준다",
      },
    )

    const seed = Array.from({ length: 25 }, (_, i) =>
      seededTodo({
        id: `todo-${i + 1}`,
        title: `할 일 ${String(i + 1).padStart(2, "0")}`,
        description: null,
        dueDate: null,
        category: null,
      }),
    )
    await installTodoScreenRoutes(page, seed)
    await page.goto("/todos")

    await expect(page.getByText("할 일 01", { exact: true })).toBeVisible()
    await expect(page.getByText("할 일 25", { exact: true })).toHaveCount(0)

    const scroller = page.getByTestId("todo-scroll")
    await expect(async () => {
      await scroller.evaluate((el) => el.scrollTo({ top: el.scrollHeight }))
      await expect(page.getByText("할 일 25", { exact: true })).toBeVisible({
        timeout: 1000,
      })
    }).toPass({ timeout: 15000 })
  })

  test("할 일이 없으면 빈 상태 안내가 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-023" },
      {
        type: "Covers",
        description: "할 일이 하나도 없으면 할 일이 비어 있다는 안내가 보인다",
      },
    )

    await installTodoScreenRoutes(page, [])
    await page.goto("/todos")

    await expect(page.getByTestId("todo-empty")).toBeVisible()
    await expect(page.getByText(/아직 할 일이 없습니다/)).toBeVisible()
  })

  test("목록을 불러오지 못하면 다시 시도 안내가 보인다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-023" },
      {
        type: "Covers",
        description: "할 일 목록을 불러오지 못하면 다시 시도하라는 안내가 보인다",
      },
    )

    await installCategoryRoutes(page, { initial: CATEGORY_SEEDS })
    await installTodoRoutes(page, {
      initial: [],
      categories: TODO_CATEGORIES,
      listError: true,
    })
    await page.goto("/todos")

    await expect(page.getByText(/할 일 목록을 불러오지 못했습니다/)).toBeVisible()
  })
})

test.describe("할 일 관리 화면 — 쓰기 여정", () => {
  test.beforeEach(async ({ page }) => {
    await installAuthRoutes(page, { authenticated: DEFAULT_USER })
  })

  test("새 할 일을 만들면 목록에 미완료로 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-022" },
      {
        type: "Covers",
        description:
          "새 할 일 만들기를 열면 제목, 설명, 마감일, 우선순위, 카테고리를 입력하는 입력 영역과 만들기 버튼이 보인다",
      },
      {
        type: "Covers",
        description: "새 할 일을 만들면 목록에 미완료 할 일로 보인다",
      },
    )

    await installTodoScreenRoutes(page, [])
    await page.goto("/todos")
    await page.getByRole("button", { name: "새 할 일" }).click()

    await expect(page.getByLabel("제목", { exact: true })).toBeVisible()
    await expect(page.getByLabel("설명", { exact: true })).toBeVisible()
    await expect(page.getByLabel("마감일", { exact: true })).toBeVisible()
    await expect(page.getByLabel("우선순위", { exact: true })).toBeVisible()
    await expect(page.getByLabel("카테고리", { exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "만들기" })).toBeVisible()

    await page.getByLabel("제목", { exact: true }).fill("새 보고서")
    await page.getByLabel("설명", { exact: true }).fill("초안을 준비합니다.")
    await page.getByLabel("마감일", { exact: true }).fill("2026-06-25")
    await page.getByLabel("우선순위", { exact: true }).selectOption("HIGH")
    await page.getByLabel("카테고리", { exact: true }).selectOption("cat-work")
    await page.getByRole("button", { name: "만들기" }).click()

    const item = page.getByRole("listitem").filter({ hasText: "새 보고서" })
    await expect(item).toBeVisible()
    await expect(item).toContainText("미완료")
    await expect(item).toContainText("업무")
    await expect(page.getByRole("checkbox", { name: "새 보고서 완료" })).not.toBeChecked()
  })

  test("잘못된 입력이면 필드 아래에 안내가 보인다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-022" },
      { type: "Requirement", description: "REQ-024" },
      {
        type: "Covers",
        description:
          "할 일을 만들거나 수정할 때 제목을 비우거나 공백만 입력하면 제목 입력 아래에 입력이 필요하다는 안내가 보인다",
      },
      {
        type: "Covers",
        description:
          "할 일을 만들거나 수정할 때 설명이 1000자를 넘으면 설명 입력 아래에 길이 제한 안내가 보인다",
      },
    )

    await installTodoScreenRoutes(page, [])
    await page.goto("/todos")
    await page.getByRole("button", { name: "새 할 일" }).click()

    await page.getByLabel("제목", { exact: true }).fill("   ")
    await page.getByRole("button", { name: "만들기" }).click()
    await expect(page.getByText("제목을 입력해 주세요.")).toBeVisible()

    await page.getByLabel("제목", { exact: true }).fill("긴 설명 검증")
    await page.getByLabel("설명", { exact: true }).fill("가".repeat(1001))
    await page.getByRole("button", { name: "만들기" }).click()
    await expect(page.getByText("설명은 1000자를 넘을 수 없습니다.")).toBeVisible()
  })

  test("할 일을 수정하고 선택 정보를 비울 수 있다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-024" },
      {
        type: "Covers",
        description:
          "할 일 수정을 열면 기존 제목, 설명, 마감일, 우선순위, 카테고리가 입력 영역에 채워져 보인다",
      },
      {
        type: "Covers",
        description:
          "할 일을 수정하면 목록에 바뀐 제목, 설명, 마감일, 우선순위, 카테고리가 보인다",
      },
      {
        type: "Covers",
        description:
          "할 일의 선택 정보를 비우고 저장하면 목록에서 설명과 마감일은 보이지 않고 카테고리는 미분류로 보인다",
      },
    )

    await installTodoScreenRoutes(page, [seededTodo()])
    await page.goto("/todos")

    await page.getByRole("button", { name: "분기 보고서 수정" }).click()
    await expect(page.getByLabel("제목", { exact: true })).toHaveValue("분기 보고서")
    await expect(page.getByLabel("설명", { exact: true })).toHaveValue("초안을 작성합니다.")
    await expect(page.getByLabel("마감일", { exact: true })).toHaveValue("2026-06-20")
    await expect(page.getByLabel("우선순위", { exact: true })).toHaveValue("HIGH")
    await expect(page.getByLabel("카테고리", { exact: true })).toHaveValue("cat-work")

    await page.getByLabel("제목", { exact: true }).fill("보고서 최종")
    await page.getByLabel("설명", { exact: true }).fill("리뷰까지 마칩니다.")
    await page.getByLabel("마감일", { exact: true }).fill("2026-06-30")
    await page.getByLabel("우선순위", { exact: true }).selectOption("LOW")
    await page.getByLabel("카테고리", { exact: true }).selectOption("cat-home")
    await page.getByRole("button", { name: "저장" }).click()

    const updated = page.getByRole("listitem").filter({ hasText: "보고서 최종" })
    await expect(updated).toContainText("리뷰까지 마칩니다.")
    await expect(updated).toContainText("마감 2026-06-30")
    await expect(updated).toContainText("우선순위 낮음")
    await expect(updated).toContainText("개인")

    await page.getByRole("button", { name: "보고서 최종 수정" }).click()
    await page.getByLabel("설명", { exact: true }).fill("")
    await page.getByLabel("마감일", { exact: true }).fill("")
    await page.getByLabel("카테고리", { exact: true }).selectOption("")
    await page.getByRole("button", { name: "저장" }).click()

    const cleared = page.getByRole("listitem").filter({ hasText: "보고서 최종" })
    await expect(cleared).toContainText("미분류")
    await expect(cleared).not.toContainText("리뷰까지 마칩니다.")
    await expect(cleared).not.toContainText("2026-06-30")
  })

  test("완료 상태를 바꿀 수 있다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-027" },
      {
        type: "Covers",
        description: "할 일 목록의 완료 체크를 바꾸면 목록의 완료 상태 표시가 바뀐다",
      },
    )

    await installTodoScreenRoutes(page, [seededTodo()])
    await page.goto("/todos")

    const checkbox = page.getByRole("checkbox", { name: "분기 보고서 완료" })
    await expect(checkbox).not.toBeChecked()
    await checkbox.click()
    await expect(checkbox).toBeChecked()
    await expect(page.getByRole("listitem").filter({ hasText: "분기 보고서" })).toContainText(
      "완료",
    )
  })

  test("삭제 확인 후 할 일이 목록에서 사라진다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-025" },
      {
        type: "Covers",
        description: "할 일을 삭제하려고 하면 삭제 확인 안내가 보인다",
      },
      {
        type: "Covers",
        description: "삭제를 확인하면 그 할 일은 목록에서 사라진다",
      },
    )

    await installTodoScreenRoutes(page, [seededTodo()])
    await page.goto("/todos")

    await page.getByRole("button", { name: "분기 보고서 삭제" }).click()
    await expect(page.getByText(/할 일을 삭제할까요/)).toBeVisible()
    await page.getByRole("button", { name: "삭제", exact: true }).click()
    await expect(page.getByRole("listitem").filter({ hasText: "분기 보고서" })).toHaveCount(0)
  })

  test("생성·수정·삭제 요청이 실패하면 안내가 보이고 다시 시도할 수 있다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-022" },
      { type: "Requirement", description: "REQ-024" },
      { type: "Requirement", description: "REQ-025" },
      {
        type: "Covers",
        description: "할 일 생성 요청이 실패하면 실패 안내가 보이고 사용자가 다시 시도할 수 있다",
      },
      {
        type: "Covers",
        description: "할 일 수정 요청이 실패하면 실패 안내가 보이고 사용자가 다시 시도할 수 있다",
      },
      {
        type: "Covers",
        description: "할 일 삭제 요청이 실패하면 실패 안내가 보이고 사용자가 다시 시도할 수 있다",
      },
    )

    const controller = await installTodoScreenRoutes(page, [seededTodo()])
    await page.goto("/todos")

    controller.failNextCreate()
    await page.getByRole("button", { name: "새 할 일" }).click()
    await page.getByLabel("제목", { exact: true }).fill("재시도 생성")
    await page.getByRole("button", { name: "만들기" }).click()
    await expect(page.getByText(/저장하지 못했습니다/)).toBeVisible()
    await expect(page.getByRole("button", { name: "만들기" })).toBeEnabled()
    await page.getByRole("button", { name: "만들기" }).click()
    await expect(page.getByRole("listitem").filter({ hasText: "재시도 생성" })).toBeVisible()

    controller.failNextUpdate()
    await page.getByRole("button", { name: "재시도 생성 수정" }).click()
    await page.getByLabel("제목", { exact: true }).fill("재시도 수정")
    await page.getByRole("button", { name: "저장" }).click()
    await expect(page.getByText(/저장하지 못했습니다/)).toBeVisible()
    await expect(page.getByRole("button", { name: "저장" })).toBeEnabled()
    await page.getByRole("button", { name: "저장" }).click()
    await expect(page.getByRole("listitem").filter({ hasText: "재시도 수정" })).toBeVisible()

    controller.failNextDelete()
    await page.getByRole("button", { name: "재시도 수정 삭제" }).click()
    await page.getByRole("button", { name: "삭제", exact: true }).click()
    await expect(page.getByText(/삭제하지 못했습니다/)).toBeVisible()
    await expect(page.getByRole("button", { name: "삭제", exact: true })).toBeEnabled()
    await page.getByRole("button", { name: "삭제", exact: true }).click()
    await expect(page.getByRole("listitem").filter({ hasText: "재시도 수정" })).toHaveCount(0)
  })
})

test.describe("할 일 관리 화면 — 보호 라우트와 품질", () => {
  test("비인증 사용자가 접근하면 로그인 화면으로 이동한다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-023" },
      {
        type: "Covers",
        description: "비인증 사용자가 할 일 화면 경로에 접근하면 로그인 화면으로 이동한다",
      },
    )

    await installAuthRoutes(page, { authenticated: null })
    await page.goto("/todos")
    await expect(page).toHaveURL(/\/login/)
  })

  test("경로로 진입했다가 로그인하면 할 일 관리 화면으로 돌아온다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-023" },
      {
        type: "Covers",
        description: "할 일 화면 경로로 진입했다가 로그인하면 할 일 화면으로 돌아온다",
      },
    )

    await installAuthRoutes(page, { authenticated: null, loginStatus: 204 })
    await installTodoScreenRoutes(page, [seededTodo()])
    await page.goto("/todos")
    await expect(page).toHaveURL(/\/login\?loginRedirect=/)

    await page.getByLabel("이메일").fill(DEFAULT_USER.email)
    await page.getByLabel("비밀번호", { exact: true }).fill("password123")
    await page.getByRole("button", { name: "로그인" }).click()

    await expect(page).toHaveURL(/\/todos$/)
    await expect(page.getByRole("heading", { name: "할 일" })).toBeVisible()
  })

  test("데스크톱 화면에서 넘치지 않고 접근성 위반이 없다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-023" },
      {
        type: "Covers",
        description:
          "데스크톱 화면에서 할 일 목록과 입력 영역의 주요 요소가 화면 밖으로 넘치지 않는다",
      },
      {
        type: "Covers",
        description: "할 일 화면은 자동 접근성 검사에서 위반이 없어야 한다",
      },
    )

    await installAuthRoutes(page, { authenticated: DEFAULT_USER })
    await installTodoScreenRoutes(page, [seededTodo()])
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/todos")
    await expect(page.getByRole("heading", { name: "할 일" })).toBeVisible()

    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])

    await page.getByRole("button", { name: "새 할 일" }).click()
    await expect(page.getByLabel("제목", { exact: true })).toBeVisible()
    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    )
    expect(hasHorizontalOverflow).toBe(false)
  })
})
