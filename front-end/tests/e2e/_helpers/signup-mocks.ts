import type { Page, Route } from "@playwright/test"

// REQ-013: 회원 가입 API(/users/signup, REQ-001 계약) 를 옵션 기반으로 mock 한다.
// 201 성공 / 409 중복 이메일 / 500 일반 오류를 시연한다.
export type SignupRouteStatus = 201 | 409 | 500

export type InstallSignupRouteOptions = {
  status?: SignupRouteStatus
  onRequest?: () => void
}

export async function installSignupRoute(
  page: Page,
  options: InstallSignupRouteOptions = {},
): Promise<void> {
  const status = options.status ?? 201
  await page.route("**/users/signup", async (route: Route) => {
    options.onRequest?.()
    if (status === 201) {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          userId: "00000000-0000-0000-0000-0000000005ec",
          email: "newuser@example.com",
          name: "홍길동",
        }),
      })
      return
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({
        code: status === 409 ? "DUPLICATE_EMAIL" : "INTERNAL_ERROR",
        status,
        message:
          status === 409
            ? "이미 등록된 이메일입니다."
            : "회원 가입 처리 중 오류가 발생했습니다.",
        path: "/users/signup",
        timestamp: new Date().toISOString(),
      }),
    })
  })
}
