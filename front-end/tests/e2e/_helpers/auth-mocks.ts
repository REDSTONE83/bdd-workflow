import type { Page, Route } from "@playwright/test"

export type FakeUser = { id: string; email: string }

export const DEFAULT_USER: FakeUser = {
  id: "00000000-0000-0000-0000-000000000bdd",
  email: "user@example.com",
}

export type InstallAuthRoutesOptions = {
  authenticated?: FakeUser | null
  loginStatus?: number
  logoutStatus?: number
}

// /auth/me, /auth/login, /auth/logout 를 옵션 기반으로 한 번에 mock 한다.
// 테스트 도중 상태를 바꾸고 싶으면 같은 페이지에서 installAuthRoutes 를 다시 호출하거나,
// 호출 측에서 page.route 로 개별 라우트를 덮어쓴다.
export async function installAuthRoutes(
  page: Page,
  options: InstallAuthRoutesOptions = {},
): Promise<void> {
  let currentUser: FakeUser | null = options.authenticated ?? null
  const loginStatus = options.loginStatus ?? 204
  const logoutStatus = options.logoutStatus ?? 204

  await page.route("**/auth/me", async (route: Route) => {
    if (currentUser) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(currentUser),
      })
    } else {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          code: "UNAUTHORIZED",
          status: 401,
          message: "인증 정보 없음",
          path: "/auth/me",
          timestamp: new Date().toISOString(),
        }),
      })
    }
  })

  await page.route("**/auth/login", async (route: Route) => {
    // 로그인 성공 시 BE 가 ACCESS_TOKEN Cookie 를 발급한다 (Mock 으로 동일 효과).
    if (loginStatus === 204 && currentUser == null) {
      currentUser = DEFAULT_USER
    }
    await route.fulfill({
      status: loginStatus,
      contentType: loginStatus === 204 ? "text/plain" : "application/json",
      body:
        loginStatus === 204
          ? ""
          : JSON.stringify({
              code: "INVALID_CREDENTIALS",
              status: 401,
              message: "이메일 또는 비밀번호가 올바르지 않습니다.",
              path: "/auth/login",
              timestamp: new Date().toISOString(),
            }),
    })
  })

  await page.route("**/auth/logout", async (route: Route) => {
    if (logoutStatus === 204) {
      currentUser = null
    }
    await route.fulfill({
      status: logoutStatus,
      contentType: logoutStatus === 204 ? "text/plain" : "application/json",
      body:
        logoutStatus === 204
          ? ""
          : JSON.stringify({
              code: "INTERNAL_ERROR",
              status: 500,
              message: "로그아웃 처리 실패",
              path: "/auth/logout",
              timestamp: new Date().toISOString(),
            }),
    })
  })
}
