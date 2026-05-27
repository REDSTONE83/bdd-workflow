import type { Page, Route } from "@playwright/test"

export type FakeUser = { id: string; email: string }

export const DEFAULT_USER: FakeUser = {
  id: "00000000-0000-0000-0000-000000000bdd",
  email: "user@example.com",
}

type AuthFlow = {
  meStatus: () => number
  meBody: () => FakeUser | null
  loginStatus: () => number
  logoutStatus: () => number
  loginCallCount: () => number
  setAuthenticatedAfterLogin: (user: FakeUser) => void
  setLoginStatus: (code: number) => void
  setLogoutStatus: (code: number) => void
  setUnauthenticated: () => void
}

export async function installAuthRoutes(page: Page, initial: {
  authenticated?: FakeUser | null
  loginStatus?: number
  logoutStatus?: number
} = {}): Promise<AuthFlow> {
  let currentUser: FakeUser | null = initial.authenticated ?? null
  let loginStatus = initial.loginStatus ?? 204
  let logoutStatus = initial.logoutStatus ?? 204
  let loginCount = 0

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
    loginCount += 1
    // 로그인 성공 시 BE 가 ACCESS_TOKEN Cookie 를 발급한다 (Mock 으로 동일 효과).
    if (loginStatus === 204 && currentUser == null) {
      // 호출 시점에 fallback user 설정해두지 않은 경우 기본값으로 인증 전환.
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

  return {
    meStatus: () => (currentUser ? 200 : 401),
    meBody: () => currentUser,
    loginStatus: () => loginStatus,
    logoutStatus: () => logoutStatus,
    loginCallCount: () => loginCount,
    setAuthenticatedAfterLogin: (user) => {
      currentUser = user
    },
    setLoginStatus: (code) => {
      loginStatus = code
    },
    setLogoutStatus: (code) => {
      logoutStatus = code
    },
    setUnauthenticated: () => {
      currentUser = null
    },
  }
}
