/**
 * @Requirement REQ-005
 * @Route /
 * @Page Front-end foundation
 */
import { ArrowRight, CheckCircle2, Code2, Layers3 } from "lucide-react"

import { Button } from "@/components/ui/button"

const foundations = [
  "React 19 with TypeScript",
  "Vite 7 build pipeline",
  "Tailwind CSS 4 via @tailwindcss/vite",
  "shadcn/ui component registry ready",
]

function App() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-6 py-6">
        <header className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Layers3 className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">BDD Workflow</p>
              <h1 className="text-xl font-semibold tracking-normal">Front-end foundation</h1>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Code2 className="size-4" aria-hidden="true" />
            React / Vite / shadcn
          </Button>
        </header>

        <div className="grid flex-1 items-center gap-8 py-10 md:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Baseline app</p>
              <h2 className="max-w-2xl text-4xl font-semibold tracking-normal text-balance md:text-5xl">
                A typed React UI base is ready for BDD-driven front-end work.
              </h2>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                This shell keeps the stack small: Vite for development, Tailwind for styling,
                and shadcn/ui conventions for reusable components.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button>
                Start a screen
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button variant="secondary">Add Storybook next</Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold">Configured foundation</h3>
            <div className="mt-5 grid gap-3">
              {foundations.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-md border bg-background p-3"
                >
                  <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
