import { QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AuthProvider } from "@/features/auth/AuthProvider"
import { authRoutes } from "@/features/auth/routes"
import { categoriesRoutes } from "@/features/categories/routes"
import { signupRoutes } from "@/features/signup/routes"
import { todosRoutes } from "@/features/todos/routes"

import { NotFoundPage } from "./NotFoundPage"
import { createQueryClient } from "./queryClient"
import { RootRedirect } from "./RootRedirect"

// 본 파일은 QueryClientProvider, BrowserRouter, AuthProvider, 라우트 합성만 담당한다.
// 각 라우트의 요건/path/page 메타데이터는 page 또는 RootRedirect 파일의 JSDoc 에서 관리한다.
export function AppRouter() {
  // 앱 수명 동안 단일 QueryClient. render 경로에서 매번 새로 만들지 않도록 useState 초기화로 한 번만 생성한다.
  const [queryClient] = useState(createQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            {authRoutes}
            {signupRoutes}
            {todosRoutes}
            {categoriesRoutes}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default AppRouter
