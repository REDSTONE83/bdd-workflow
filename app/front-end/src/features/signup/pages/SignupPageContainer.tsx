/**
 * @Requirement REQ-001
 * @Route /signup
 * @Page SignupPageContainer
 * @UsesApi POST /users/signup submit
 *
 * REQ-001 회원 가입 화면 컨테이너.
 * 표현 컴포넌트 SignupPage 에 실제 가입 API 호출과 라우팅 이동을 결합한다.
 * - onSubmit: src/api/signup 의 signup() 으로 REQ-001 가입 계약을 호출하고 SignupResult 를 돌려준다.
 * - onNavigateAfterSuccess: 가입 성공 시 /login 으로 이동하면서 가입 완료 안내 플래그를 전달한다.
 *   LoginPage 가 signupCompleted 쿼리를 감지해 안내를 표시하고 쿼리를 정리한다.
 */
import { useNavigate } from "react-router-dom"

import { signup } from "@/api/signup"

import { SignupPage } from "./SignupPage"

export function SignupPageContainer() {
  const navigate = useNavigate()
  return (
    <SignupPage
      onSubmit={signup}
      onNavigateAfterSuccess={() =>
        navigate("/login?signupCompleted=1", { replace: true })
      }
    />
  )
}

export default SignupPageContainer
