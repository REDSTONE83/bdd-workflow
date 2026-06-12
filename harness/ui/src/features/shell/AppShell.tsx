/**
 * @Requirement REQ-030
 * @Page AppShell
 * @Route /*
 */
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Activity, BookOpenText, FileWarning, GitPullRequest, ListChecks, Play, ShieldCheck } from "lucide-react";
import type { ArtifactSummary } from "../../lib/harness-data/types";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { buttonVariants } from "../../components/ui/button";
import { Select } from "../../components/ui/select";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/requirements", label: "요건", icon: ListChecks },
  { to: "/terminology", label: "표준 용어", icon: BookOpenText },
  { to: "/gate", label: "게이트", icon: ShieldCheck },
  { to: "/change-sets", label: "Change Set", icon: GitPullRequest },
  { to: "/runs", label: "실행 화면", icon: Play },
];

const scopeOptions = [
  { value: "harness", label: "harness" },
  { value: "application", label: "application" },
];

export function AppShell({ model, children }: { model: ArtifactSummary; children: ReactNode }) {
  return (
    <div className="harness-surface">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">
          <div>
            <div className="text-lg font-semibold text-foreground">BDD Harness</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <span>범위</span>
              <Select defaultValue={model.scope} options={scopeOptions} aria-label="범위 선택" />
            </div>
            <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              generatedAt: {model.generatedAt ?? "산출물 없음"}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" aria-hidden="true" />
              {model.autoRefresh === "updated" ? "자동 갱신됨" : "자동 갱신 대기"}
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1440px] grid-cols-[220px_minmax(0,1fr)] gap-6 px-6">
        <aside className="border-r border-border py-6 pr-4" aria-label="좌측 주요 작업 영역">
          <nav className="sticky top-6 grid gap-1.5" aria-label="주요 작업 영역">
            <div className="px-2 pb-2 text-xs font-semibold tracking-normal text-muted-foreground">메뉴</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }),
                      "w-full justify-start px-3",
                      isActive && "border border-sky-200 bg-sky-50 text-sky-900",
                    )
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 py-6">
          {model.missing ? (
            <Alert variant="warning" className="mb-4">
              <AlertDescription>
                선택한 범위의 검증 산출물이 없다. `npm run harness:trace -- --requirement REQ-XXX` 또는 `npm run harness:validate`를 실행한다.
              </AlertDescription>
            </Alert>
          ) : null}
          {model.stale ? (
            <Alert variant="warning" className="mb-4 flex gap-3">
              <FileWarning className="h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <AlertTitle>오래된 데이터 경고</AlertTitle>
                <AlertDescription className="mt-1 break-all">{model.staleSources.join(", ")}</AlertDescription>
              </div>
            </Alert>
          ) : null}
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
