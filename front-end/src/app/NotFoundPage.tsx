import { Link } from "react-router-dom"

export function NotFoundPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-muted-foreground">
          요청한 주소에 해당하는 화면이 없습니다.
        </p>
        <Link
          to="/"
          className="inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          시작 화면으로 이동
        </Link>
      </div>
    </main>
  )
}

export default NotFoundPage
