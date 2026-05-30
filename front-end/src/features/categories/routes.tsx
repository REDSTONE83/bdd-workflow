import { Route } from "react-router-dom"

import { RequireAuth } from "@/features/auth/components/RequireAuth"

import { CategoriesPageContainer } from "./pages/CategoriesPageContainer"

// 보호 라우트. 비인증 사용자는 RequireAuth 가 /login 으로 보내며 현재 경로를 loginRedirect 로 전달한다.
// 요건/경로/API 사용 추적 메타데이터는 CategoriesPageContainer 의 JSDoc 에 둔다 (routes.tsx 는 plumbing).
export const categoriesRoutes = (
  <>
    <Route
      path="/categories"
      element={
        <RequireAuth>
          <CategoriesPageContainer />
        </RequireAuth>
      }
    />
  </>
)
