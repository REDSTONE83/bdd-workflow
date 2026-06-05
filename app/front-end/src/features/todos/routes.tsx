import { Route } from "react-router-dom"

import { RequireAuth } from "@/features/auth/components/RequireAuth"

import { TodosPlaceholderPage } from "./pages/TodosPlaceholderPage"

// 보호 라우트. 비인증 사용자는 /login 으로 보낸다.
export const todosRoutes = (
  <>
    <Route
      path="/todos"
      element={
        <RequireAuth>
          <TodosPlaceholderPage />
        </RequireAuth>
      }
    />
  </>
)
