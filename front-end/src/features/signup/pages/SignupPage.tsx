/**
 * @Requirement REQ-013
 * @Page SignupPage
 *
 * REQ-013 회원 가입 화면 표현(presentational) 컴포넌트.
 *
 * 책임:
 * - 실제 DOM과 Tailwind 스타일로 화면을 그린다 (REQ-011 LoginPage 와 같은 main + Card 패턴).
 * - 카드 구성: 제목, 사용자 이름 입력, 이메일 입력, 비밀번호 입력, 회원 가입 버튼,
 *   로그인 화면으로 돌아가는 링크.
 * - 폼 입력 반응, 클라이언트 측 검증 안내, submitting/serverRejection/success 상태 전환을
 *   직접 다룬다.
 * - 외부 API 호출과 가입 성공 후 라우팅 이동은 onSubmit / onNavigateAfterSuccess 콜백으로
 *   주입받는다. 실제 결합은 SignupPageContainer, Storybook 은 control 로 상태를 강제한다.
 */
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type { SignupInput, SignupResult } from "../types"

export type { SignupInput, SignupResult } from "../types"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// ASCII 출력 가능 문자(공백 포함 0x20-0x7E)만 허용 — REQ-001 비밀번호 정책과 동일하다.
const PASSWORD_ALLOWED_PATTERN = /^[\x20-\x7e]+$/

export type SignupPageProps = {
  /**
   * 가입 제출을 처리하는 콜백. Skeleton 에서는 Storybook control 이 결과를 강제하고,
   * 구현 단계에서 실제 API client 호출과 결합한다.
   */
  onSubmit: (input: SignupInput) => Promise<SignupResult>
  /**
   * 가입 성공 후 호출되는 콜백. 구현 단계에서
   * `navigate("/login?signupCompleted=1", { replace: true })` 로 결합한다.
   */
  onNavigateAfterSuccess?: () => void
  /** Storybook 에서 특정 상태를 시연하기 위한 초기 폼 값. */
  defaultValues?: Partial<SignupInput>
}

type FieldErrors = {
  name?: string
  email?: string
  password?: string
}

type FormError =
  | { kind: "duplicate-email" }
  | { kind: "other"; message: string }

export function SignupPage({
  onSubmit,
  onNavigateAfterSuccess,
  defaultValues,
}: SignupPageProps) {
  const [name, setName] = useState(defaultValues?.name ?? "")
  const [email, setEmail] = useState(defaultValues?.email ?? "")
  const [password, setPassword] = useState(defaultValues?.password ?? "")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<FormError | null>(null)

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {}
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) {
      errors.name = "사용자 이름을 입력해 주세요."
    } else if (trimmedName.length > 100) {
      errors.name = "사용자 이름은 100자 이하여야 합니다."
    }

    if (!trimmedEmail) {
      errors.email = "이메일을 입력해 주세요."
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = "이메일 형식으로 입력해 주세요."
    }

    if (!password) {
      errors.password = "비밀번호를 입력해 주세요."
    } else if (password.length < 8) {
      errors.password = "비밀번호는 8자 이상이어야 합니다."
    } else if (password.length > 72 || !PASSWORD_ALLOWED_PATTERN.test(password)) {
      errors.password = "사용할 수 없는 비밀번호입니다."
    }

    return errors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return // 응답 대기 중 추가 요청 차단
    const errors = validate()
    setFieldErrors(errors)
    if (errors.name || errors.email || errors.password) {
      setFormError(null)
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      const result = await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password,
      })
      if (result.status === "ok") {
        onNavigateAfterSuccess?.()
      } else if (result.status === "duplicate-email") {
        setFormError({ kind: "duplicate-email" })
        setPassword("")
      } else {
        setFormError({ kind: "other", message: result.message })
        setPassword("")
      }
    } catch {
      setFormError({
        kind: "other",
        message: "회원 가입 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      })
      setPassword("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl leading-none font-semibold tracking-tight">회원 가입</h1>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            {formError?.kind === "duplicate-email" && (
              <Alert variant="destructive">
                <AlertCircle aria-hidden="true" />
                <AlertTitle>이미 등록된 이메일입니다</AlertTitle>
                <AlertDescription>
                  <p>
                    이 이메일은 이미 사용 중입니다. 본인 계정이면{" "}
                    <Link to="/login" className="underline underline-offset-4">
                      로그인 화면으로 이동
                    </Link>
                    하거나 다른 이메일을 사용해 주세요.
                  </p>
                </AlertDescription>
              </Alert>
            )}
            {formError?.kind === "other" && (
              <Alert variant="destructive">
                <AlertCircle aria-hidden="true" />
                <AlertTitle>회원 가입에 실패했습니다</AlertTitle>
                <AlertDescription>{formError.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="signup-name">사용자 이름</Label>
              <Input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "signup-name-error" : undefined}
              />
              {fieldErrors.name && (
                <p id="signup-name-error" className="text-sm text-destructive">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="signup-email">이메일</Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="username"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "signup-email-error" : undefined}
              />
              {fieldErrors.email && (
                <p id="signup-email-error" className="text-sm text-destructive">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="signup-password">비밀번호</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password ? "signup-password-error" : undefined
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "비밀번호 가리기" : "비밀번호 보이기"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="signup-password-error" className="text-sm text-destructive">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <Button type="submit" disabled={submitting} aria-busy={submitting}>
              {submitting ? "가입 처리 중..." : "회원 가입"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            to="/login"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            이미 계정이 있으신가요? 로그인
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}

export default SignupPage
