import type { RequirementDetail } from "../../../lib/harness-data/types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { LocationLink } from "../../../components/ui/location-link";
import { coverageRowsForScenario, testLocation, uniqueTests } from "./detail-utils";
import { SectionHeader } from "./SectionHeader";

const stepKeywordClassNames = {
  Given: "border-emerald-200 bg-emerald-50 text-emerald-800",
  When: "border-amber-200 bg-amber-50 text-amber-800",
  Then: "border-sky-200 bg-sky-50 text-sky-800",
  And: "border-slate-200 bg-slate-50 text-slate-700",
} as const;

type StepKeyword = keyof typeof stepKeywordClassNames;

function scenarioStepParts(step: string): { keyword?: StepKeyword; text: string } {
  const match = step.match(/^(Given|When|Then|And)\s+(.*)$/);
  if (!match) return { text: step };
  return { keyword: match[1] as StepKeyword, text: match[2] };
}

export function RequirementScenariosTab({ detail }: { detail: RequirementDetail }) {
  return (
    <>
      <SectionHeader title="시나리오" />
      <div className="grid gap-3" role="list" aria-label="연결된 시나리오">
        {detail.scenarios.map((scenario) => {
          const coverageRows = coverageRowsForScenario(detail, scenario);
          const tests = uniqueTests(coverageRows);
          return (
            <Card key={`${scenario.file}-${scenario.line}`} className="p-4 text-sm" role="listitem">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-words font-semibold text-foreground">{scenario.title}</div>
                  <LocationLink className="mt-1" file={scenario.file} line={scenario.line} />
                </div>
                <StatusBadge label={scenario.status} tone="blue" />
              </div>
              <div className="mt-3">
                <div className="text-xs font-semibold text-muted-foreground">연결 테스트</div>
                {tests.length > 0 ? (
                  <div className="mt-2 grid gap-1">
                    {tests.map((test) => {
                      const location = testLocation(test);
                      return (
                        <LocationLink
                          key={test}
                          file={location.file}
                          line={location.line}
                          label={location.label}
                          aria-label={`${location.label} 테스트 위치 바로가기`}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-2 text-muted-foreground">없음</div>
                )}
              </div>
              <div className="mt-3">
                <div className="text-xs font-semibold text-muted-foreground">Given/When/Then</div>
                <div className="mt-2 grid gap-1 text-muted-foreground">
                  {scenario.steps.map((step) => {
                    const stepParts = scenarioStepParts(step);
                    if (!stepParts.keyword) {
                      return <div key={step} className="break-words text-sm leading-5">{stepParts.text}</div>;
                    }

                    return (
                      <div key={step} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-2 text-sm leading-5">
                        <span
                          className={`inline-flex h-5 w-16 items-center justify-center rounded border px-2 text-xs font-semibold ${stepKeywordClassNames[stepParts.keyword]}`}
                        >
                          {stepParts.keyword}
                        </span>
                        <span className="min-w-0 break-words">{stepParts.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
        {detail.scenarios.length === 0 ? <EmptyState>연결된 시나리오가 없다.</EmptyState> : null}
      </div>
    </>
  );
}
