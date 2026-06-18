import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// REQ-011: dev server는 BE 8080을 같은 origin으로 proxy 한다.
// HttpOnly Cookie 가 cross-origin SameSite=Strict 제약 없이 전달되도록 한다.
//
// 주의: /todos 처럼 FE 페이지 경로와 BE API 경로가 동시에 존재하는 prefix 는
// 브라우저의 HTML 네비게이션은 FE 가 그대로 처리하고, XHR/fetch 만 BE 로 보낸다.
// 그렇지 않으면 /todos 진입이 BE 응답으로 가로채여 SPA 가 뜨지 않는다.
const BACKEND_ORIGIN = process.env.VITE_BACKEND_ORIGIN ?? "http://127.0.0.1:8080"
const PROXY_PREFIXES = [
  "/auth",
  "/users",
  "/todos",
  "/categories",
  "/v3/api-docs",
  "/swagger-ui",
]
const isHtmlNavigation = (accept: string | undefined) =>
  typeof accept === "string" && accept.includes("text/html")

const proxy = Object.fromEntries(
  PROXY_PREFIXES.map((prefix) => [
    prefix,
    {
      target: BACKEND_ORIGIN,
      changeOrigin: true,
      bypass(req: { url?: string; headers: Record<string, string | string[] | undefined> }) {
        if (isHtmlNavigation(req.headers["accept"] as string | undefined)) {
          // SPA fallback: index.html 을 그대로 돌려주고 React Router 가 경로를 처리한다.
          return "/index.html"
        }
        return undefined
      },
    },
  ]),
)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy,
  },
})
