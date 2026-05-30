// open redirect 방어: 신뢰 가능 보호 라우트 목록과 정확히 일치하는 값만 통과시키고,
// 그 외(외부 URL, protocol-relative, 비-보호 경로, 인코딩된 우회값, 너무 긴 값)는 기본 진입점으로.
export const TRUSTED_LOGIN_REDIRECTS = ["/todos", "/categories"] as const
export const DEFAULT_LOGIN_REDIRECT = "/todos"
const MAX_REDIRECT_LENGTH = 200

export function resolveLoginRedirect(candidate: string | null | undefined): string {
  if (candidate == null) return DEFAULT_LOGIN_REDIRECT
  if (typeof candidate !== "string") return DEFAULT_LOGIN_REDIRECT
  if (candidate.length === 0 || candidate.length > MAX_REDIRECT_LENGTH) {
    return DEFAULT_LOGIN_REDIRECT
  }
  // 보안: 단순 화이트리스트 정확 일치만 통과.
  // (외부 URL, protocol-relative, 인코딩된 우회값 모두 자동 차단)
  return (TRUSTED_LOGIN_REDIRECTS as readonly string[]).includes(candidate)
    ? candidate
    : DEFAULT_LOGIN_REDIRECT
}
