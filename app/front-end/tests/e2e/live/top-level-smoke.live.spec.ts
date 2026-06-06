import { expect, type Page, test } from "@playwright/test"

const PASSWORD = "Password123!"

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

  test("실서버 할 일 관리 화면 여정이 동작한다", async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: "Requirement", description: "REQ-021" },
      {
        type: "Covers",
        description:
          "로그인 사용자는 할 일 화면에서 자신의 할 일을 확인하고 새 할 일을 만든 뒤 수정하고 완료 상태를 바꾸고 삭제할 수 있다",
      },
    )

    await signupAndLogin(page, "todo-smoke")
    await expect(page.getByRole("heading", { name: "할 일" })).toBeVisible()
    await expect(page.getByRole("button", { name: "새 할 일" })).toBeVisible()

    const title = `통합 할 일 ${Date.now()}`
    const updatedTitle = `${title} 수정`

    await page.getByRole("button", { name: "새 할 일" }).click()
    await page.getByLabel("제목", { exact: true }).fill(title)
    await page.getByLabel("우선순위", { exact: true }).selectOption("HIGH")
    await page.getByRole("button", { name: "만들기" }).click()

    const created = page.getByRole("listitem").filter({ hasText: title })
    await expect(created).toBeVisible()
    await expect(created).toContainText("미완료")

    await page.getByRole("button", { name: `${title} 수정` }).click()
    await page.getByLabel("제목", { exact: true }).fill(updatedTitle)
    await page.getByRole("button", { name: "저장" }).click()
    const updated = page.getByRole("listitem").filter({ hasText: updatedTitle })
    await expect(updated).toBeVisible()

    const checkbox = page.getByRole("checkbox", { name: `${updatedTitle} 완료` })
    await expect(checkbox).not.toBeChecked()
    await checkbox.click()
    await expect(checkbox).toBeChecked()
    await expect(updated).toContainText("완료")

    await page.getByRole("button", { name: `${updatedTitle} 삭제` }).click()
    await expect(page.getByText(`‘${updatedTitle}’ 할 일을 삭제할까요?`)).toBeVisible()
    await page.getByRole("button", { name: "삭제", exact: true }).click()
    await expect(
      page.getByRole("listitem").filter({ hasText: updatedTitle }),
    ).toHaveCount(0)
  })
})
