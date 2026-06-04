import { Route } from "react-router-dom"

import { RedirectIfAuthenticated } from "@/features/auth/components/RedirectIfAuthenticated"

import { SignupPageContainer } from "./pages/SignupPageContainer"

// /signup 라우트는 REQ-001 회원 가입 화면이다.
// 이미 인증된 사용자가 접근하면 RedirectIfAuthenticated 가 보호 진입점(/todos)으로 보낸다.
// 요건/경로/API 사용 추적 메타데이터는 SignupPageContainer 의 JSDoc 에 둔다 (routes.tsx 는 plumbing).
export const signupRoutes = (
  <>
    <Route
      path="/signup"
      element={
        <RedirectIfAuthenticated>
          <SignupPageContainer />
        </RedirectIfAuthenticated>
      }
    />
  </>
)
