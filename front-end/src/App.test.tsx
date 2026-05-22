import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import App from "./App"

describe("App shell", () => {
  it("renders the front-end foundation summary", () => {
    render(<App />)

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Front-end foundation",
      }),
    ).toBeVisible()
    expect(screen.getByText("React 19 with TypeScript")).toBeVisible()
    expect(
      screen.getByRole("button", { name: "React / Vite / shadcn" }),
    ).toBeVisible()
  })
})
