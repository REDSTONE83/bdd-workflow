import { describe, expect, it } from "vitest"

import {
  DEFAULT_LOGIN_REDIRECT,
  TRUSTED_LOGIN_REDIRECTS,
  resolveLoginRedirect,
} from "./loginRedirect"

describe("resolveLoginRedirect", () => {
  it("신뢰 목록과 정확히 일치하는 값은 그대로 통과시킨다", () => {
    for (const trusted of TRUSTED_LOGIN_REDIRECTS) {
      expect(resolveLoginRedirect(trusted)).toBe(trusted)
    }
  })

  it("보호 진입점 /todos 와 /categories 는 신뢰 이동 대상이다 (REQ-014)", () => {
    expect(resolveLoginRedirect("/todos")).toBe("/todos")
    expect(resolveLoginRedirect("/categories")).toBe("/categories")
  })

  it.each([
    null,
    undefined,
    "",
    "https://evil.example.com/todos",
    "//evil.example.com",
    "/admin",
    "/todos?next=/admin",
    "/todos#x",
    "%2Ftodos",
    "/" + "a".repeat(300),
  ])("위험하거나 알려지지 않은 값 (%s) 은 기본 진입점으로 보낸다", (candidate) => {
    expect(resolveLoginRedirect(candidate)).toBe(DEFAULT_LOGIN_REDIRECT)
  })
})
