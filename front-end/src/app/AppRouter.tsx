import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AuthProvider } from "@/features/auth/AuthProvider"
import { authRoutes } from "@/features/auth/routes"
import { signupRoutes } from "@/features/signup/routes"
import { todosRoutes } from "@/features/todos/routes"

import { NotFoundPage } from "./NotFoundPage"
import { RootRedirect } from "./RootRedirect"

// 본 파일은 BrowserRouter, AuthProvider, 라우트 합성만 담당한다.
// 각 라우트의 요건/path/page 메타데이터는 page 또는 RootRedirect 파일의 JSDoc 에서 관리한다.
export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          {authRoutes}
          {signupRoutes}
          {todosRoutes}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default AppRouter
