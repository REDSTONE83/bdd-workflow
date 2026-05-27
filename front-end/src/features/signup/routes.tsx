import { Route } from "react-router-dom"

import { SignupPlaceholderPage } from "./pages/SignupPlaceholderPage"

// 가입 화면 placeholder. 실제 가입 화면 본문은 REQ-001 FE 후속 카드가 채운다.
export const signupRoutes = (
  <>
    <Route path="/signup" element={<SignupPlaceholderPage />} />
  </>
)
