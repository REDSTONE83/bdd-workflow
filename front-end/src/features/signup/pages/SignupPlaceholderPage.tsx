/**
 * @Requirement REQ-011
 * @Route /signup
 * @Page SignupPlaceholderPage
 *
 * /signup placeholder. 실제 가입 화면 본문은 REQ-001 FE 후속 카드가 채운다.
 */
import { Link } from "react-router-dom"
export function SignupPlaceholderPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-xl font-semibold">가입 화면 준비 중</h1>
        <p className="text-sm text-muted-foreground">
          가입 화면은 아직 준비 중입니다. 잠시 후 다시 확인해 주세요.
        </p>
        <Link
          to="/login"
          className="inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          로그인 화면으로 돌아가기
        </Link>
      </div>
    </main>
  )
}

export default SignupPlaceholderPage
