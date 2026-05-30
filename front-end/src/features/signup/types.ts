// REQ-013: 회원 가입 화면 view model.
// SignupPage(표현), SignupPageContainer(결합), src/api/signup(호출)이 공유한다.

export type SignupInput = {
  name: string
  email: string
  password: string
}

export type SignupResult =
  | { status: "ok" }
  | { status: "duplicate-email" }
  | { status: "error"; message: string }
