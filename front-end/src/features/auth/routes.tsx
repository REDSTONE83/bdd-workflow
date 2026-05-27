import { Route } from "react-router-dom"

import { RedirectIfAuthenticated } from "./components/RedirectIfAuthenticated"
import { LoginPage } from "./pages/LoginPage"

// /login 라우트는 이미 인증된 사용자가 접근하면 보호 진입점으로 보낸다.
// route별 @Requirement / @Route 추적은 LoginPage 의 JSDoc 에 둔다.
export const authRoutes = (
  <>
    <Route
      path="/login"
      element={
        <RedirectIfAuthenticated>
          <LoginPage />
        </RedirectIfAuthenticated>
      }
    />
  </>
)
