import { expect, type Page, test } from "@playwright/test"

const PASSWORD = "Password123!"

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue }

type ApiResult<T> = {
  status: number
  body: T
}

type PageResponse<T> = {
  content: T[]
  totalElements: number
}

type TodoResponse = {
  todoId: string
  title: string
  completed: boolean
}

type ApiOptions = {
  method?: string
  body?: JsonValue
}

function uniqueEmail(prefix: string) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `${prefix}-${suffix}@example.com`
}

async function signupAndLogin(page: Page, prefix: string) {
  const email = uniqueEmail(prefix)

  await page.goto("/signup")
  await page.getByLabel("사용자 이름").fill(`통합 ${prefix}`)
  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호", { exact: true }).fill(PASSWORD)
  await page.getByRole("button", { name: "회원 가입" }).click()

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText("회원 가입이 완료되었습니다")).toBeVisible()

  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호", { exact: true }).fill(PASSWORD)
  await page.getByRole("button", { name: "로그인" }).click()

  await expect(page).toHaveURL(/\/todos$/)
  await expect(page.getByText(email)).toBeVisible()
  return email
}

async function browserApi<T>(
  page: Page,
  path: string,
  options: ApiOptions = {},
): Promise<ApiResult<T>> {
  return page.evaluate(
    async ({ path, options }) => {
      const response = await fetch(path, {
        method: options.method ?? "GET",
        credentials: "include",
        headers:
          options.body === undefined
            ? undefined
            : { "Content-Type": "application/json" },
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
      })
      const text = await response.text()
      const body = text ? JSON.parse(text) : null
      return { status: response.status, body }
    },
    { path, options },
  ) as Promise<ApiResult<T>>
}

test.describe("상위 요건 통합 스모크", () => {
  test("실서버 카테고리 관리 여정이 동작한다", async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-015" },
      {
        type: "Covers",
        description:
          "로그인 사용자는 카테고리 화면에서 카테고리를 확인하고 새 카테고리를 만든 뒤 수정하고 삭제할 수 있다",
      },
    )

    await signupAndLogin(page, "category-smoke")
    await page.getByRole("link", { name: "카테고리" }).click()
    await expect(page.getByRole("heading", { name: "카테고리" })).toBeVisible()
    await expect(page.getByRole("button", { name: "새 카테고리" })).toBeVisible()

    const categoryName = `통합 카테고리 ${Date.now()}`
    const updatedName = `${categoryName} 수정`

    await page.getByRole("button", { name: "새 카테고리" }).click()
    await page.getByLabel("이름", { exact: true }).fill(categoryName)
    await page.getByLabel("색상", { exact: true }).fill("#22c55e")
    await page.getByRole("button", { name: "만들기" }).click()
    await expect(
      page.getByRole("listitem").filter({ hasText: categoryName }),
    ).toBeVisible()

    await page.getByRole("button", { name: `${categoryName} 수정` }).click()
    await page.getByLabel("이름", { exact: true }).fill(updatedName)
    await page.getByLabel("색상", { exact: true }).fill("#8b5cf6")
    await page.getByRole("button", { name: "저장" }).click()
    await expect(
      page.getByRole("listitem").filter({ hasText: updatedName }),
    ).toBeVisible()
    await expect(page.getByRole("img", { name: "색상 #8b5cf6" })).toBeVisible()

    await page.getByRole("button", { name: `${updatedName} 삭제` }).click()
    await expect(
      page.getByText(`‘${updatedName}’ 카테고리를 삭제할까요?`),
    ).toBeVisible()
    await page.getByRole("button", { name: "삭제", exact: true }).click()
    await expect(
      page.getByRole("listitem").filter({ hasText: updatedName }),
    ).toHaveCount(0)
    await expect(page.getByRole("heading", { name: "카테고리" })).toBeVisible()
  })

  test("브라우저 세션에서 실서버 할 일 API 생명주기가 동작한다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-021" },
      {
        type: "Covers",
        description:
          "로그인 사용자는 API로 자신의 할 일을 생성하고 목록에서 확인한 뒤 수정하고 삭제할 수 있다",
      },
    )

    await signupAndLogin(page, "todo-smoke")

    const title = `통합 할 일 ${Date.now()}`
    const updatedTitle = `${title} 수정`

    const created = await browserApi<TodoResponse>(page, "/todos", {
      method: "POST",
      body: { title, priority: "HIGH" },
    })
    expect(created.status).toBe(201)
    expect(created.body.title).toBe(title)

    const listed = await browserApi<PageResponse<TodoResponse>>(page, "/todos")
    expect(listed.status).toBe(200)
    expect(listed.body.content.some((todo) => todo.todoId === created.body.todoId)).toBe(
      true,
    )

    const updated = await browserApi<TodoResponse>(
      page,
      `/todos/${created.body.todoId}`,
      {
        method: "PATCH",
        body: { title: updatedTitle, completed: true },
      },
    )
    expect(updated.status).toBe(200)
    expect(updated.body.title).toBe(updatedTitle)
    expect(updated.body.completed).toBe(true)

    const deleted = await browserApi<null>(page, `/todos/${created.body.todoId}`, {
      method: "DELETE",
    })
    expect(deleted.status).toBe(204)

    const afterDelete = await browserApi<PageResponse<TodoResponse>>(
      page,
      "/todos",
    )
    expect(afterDelete.status).toBe(200)
    expect(
      afterDelete.body.content.some((todo) => todo.todoId === created.body.todoId),
    ).toBe(false)
  })
})
