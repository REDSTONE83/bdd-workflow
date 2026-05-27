/**
 * @Requirement REQ-011
 */
import { BrowserRouter, Route, Routes } from "react-router-dom"

import App from "@/App"
import { AuthProvider } from "@/features/auth/AuthProvider"
import { RedirectIfAuthenticated } from "@/features/auth/components/RedirectIfAuthenticated"
import { RequireAuth } from "@/features/auth/components/RequireAuth"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { SignupPlaceholderPage } from "@/features/signup/pages/SignupPlaceholderPage"
import { TodosPlaceholderPage } from "@/features/todos/pages/TodosPlaceholderPage"

// REQ-011 Skeleton: 본 카드가 도입하는 라우트.
// - / : REQ-005 가 정의한 공개 앱 셸. 본 카드는 표시 동작을 바꾸지 않는다.
// - /login : 공개 화면. 이미 인증된 사용자는 /todos 로 이동시킨다.
// - /signup : 공개 placeholder.
// - /todos : 보호 화면 placeholder.
export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <LoginPage />
              </RedirectIfAuthenticated>
            }
          />
          <Route path="/signup" element={<SignupPlaceholderPage />} />
          <Route
            path="/todos"
            element={
              <RequireAuth>
                <TodosPlaceholderPage />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default AppRouter
