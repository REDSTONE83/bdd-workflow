import { Eye, EyeOff } from "lucide-react"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { resolveLoginRedirect } from "../loginRedirect"
import { useAuth } from "../useAuth"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type FieldErrors = {
  email?: string
  password?: string
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const emailRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  // (FE) 로그인 화면을 열면 이메일 입력에 자동으로 입력 포커스가 간다
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {}
    const trimmed = email.trim()
    if (!trimmed) {
      errors.email = "이메일을 입력해 주세요."
    } else if (!EMAIL_PATTERN.test(trimmed)) {
      errors.email = "이메일 형식으로 입력해 주세요."
    }
    if (!password) {
      errors.password = "비밀번호를 입력해 주세요."
    }
    return errors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return // (FE) 응답 대기 중 추가 요청 차단
    const errors = validate()
    setFieldErrors(errors)
    if (errors.email || errors.password) {
      setFormError(null)
      return
    }

    setSubmitting(true)
    setFormError(null)
    try {
      await login({ email: email.trim(), password })
      const target = resolveLoginRedirect(searchParams.get("loginRedirect"))
      navigate(target, { replace: true })
    } catch {
      // (FE) 실패 시 폼 상단 공통 안내 + 비밀번호만 비움
      setFormError("이메일 또는 비밀번호가 올바르지 않습니다.")
      setPassword("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl leading-none font-semibold tracking-tight">로그인</h1>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-email">이메일</Label>
              <Input
                id="login-email"
                ref={emailRef}
                type="email"
                autoComplete="username"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
              />
              {fieldErrors.email && (
                <p id="login-email-error" className="text-sm text-destructive">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-password">비밀번호</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password ? "login-password-error" : undefined
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
                <p id="login-password-error" className="text-sm text-destructive">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <Button type="submit" disabled={submitting} aria-busy={submitting}>
              {submitting ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            to="/signup"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            계정이 없으신가요? 가입하기
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}

export default LoginPage
