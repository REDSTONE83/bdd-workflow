import type { RequirementDetail } from "../../../lib/harness-data/types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { channelTone, coverageTone, editorHref } from "./detail-utils";
import { SectionHeader } from "./SectionHeader";

function testEditorHref(test: string) {
  const [file] = test.split(" > ");
  return editorHref(file, 1);
}

export function RequirementAcceptanceTab({ detail }: { detail: RequirementDetail }) {
  const coverageByCriterion = new Map(detail.coverage.map((row) => [row.criterion, row]));
  const scenarioByTitle = new Map(detail.scenarios.map((scenario) => [scenario.title, scenario]));

  return (
    <>
      <div>
        <section>
          <SectionHeader title="AC 목록" description="요건 카드의 수용 기준 원문, 커버리지 판정, 연결 테스트와 시나리오를 항목별 카드로 확인한다." />
          <div className="grid gap-3">
            {detail.acceptanceCriteria.map((criterion) => {
              const coverage = coverageByCriterion.get(criterion.text);
              const tests = coverage?.tests ?? [];
              const scenarios = coverage?.scenarios ?? criterion.scenarios;
              const status = coverage?.status ?? criterion.status;
              const channel = coverage?.channel ?? criterion.channel;
              return (
                <Card key={criterion.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-mono text-sm font-semibold text-foreground">{criterion.id}</div>
                        <StatusBadge label={channel} tone={channelTone(channel)} />
                      </div>
                      <div className="mt-2 break-words text-sm font-medium text-foreground">{criterion.text}</div>
                    </div>
                    <StatusBadge label={status} tone={coverageTone(status)} />
                  </div>
                  <dl className="mt-3 grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-x-3 gap-y-3">
                    <dt className="text-xs font-semibold leading-5 text-muted-foreground">연결 테스트</dt>
                    <dd className="min-w-0 break-words text-xs leading-5 text-muted-foreground">
                      {tests.length > 0 ? (
                        <ul className="grid gap-1">
                          {tests.map((test) => (
                            <li key={test} className="leading-5">
                              <a
                                href={testEditorHref(test)}
                                aria-label={`${test} 테스트 바로가기`}
                                className="block break-all rounded-sm font-mono text-xs font-medium leading-5 text-sky-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                              >
                                {test}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : "없음"}
                    </dd>
                    <dt className="text-xs font-semibold leading-5 text-muted-foreground">시나리오</dt>
                    <dd className="min-w-0 break-words text-xs leading-5 text-muted-foreground">
                      {scenarios.length > 0 ? (
                        <ul className="grid gap-1">
                          {scenarios.map((scenarioTitle) => {
                            const scenario = scenarioByTitle.get(scenarioTitle);
                            return (
                              <li key={scenarioTitle} className="leading-5">
                                {scenario ? (
                                  <a
                                    href={editorHref(scenario.file, scenario.line)}
                                    aria-label={`${scenarioTitle} 시나리오 바로가기`}
                                    className="block break-words rounded-sm font-medium leading-5 text-sky-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                  >
                                    {scenarioTitle}
                                  </a>
                                ) : (
                                  scenarioTitle
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : "없음"}
                    </dd>
                  </dl>
                </Card>
              );
            })}
          </div>
          {detail.acceptanceCriteria.length === 0 ? <EmptyState>수용 기준이 없다.</EmptyState> : null}
        </section>
      </div>
      <div className="grid grid-cols-[1fr_1fr] gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">RED 사유</h2>
            <StatusBadge label={`${detail.redReasons.length}건`} tone={detail.redReasons.length > 0 ? "red" : "neutral"} />
          </div>
          {detail.redReasons.map((finding) => (
            <Alert key={`${finding.ruleId}-${finding.message}`} variant="destructive" className="mt-3">
              <AlertTitle>{finding.ruleId}</AlertTitle>
              <AlertDescription className="mt-1 break-words">{finding.message}</AlertDescription>
            </Alert>
          ))}
          {detail.redReasons.length === 0 ? <div className="mt-3 text-sm text-muted-foreground">없음</div> : null}
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">BLUE 차단 사유</h2>
            <StatusBadge label={`${detail.blueBlockedBy.length}건`} tone={detail.blueBlockedBy.length > 0 ? "warning" : "neutral"} />
          </div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {detail.blueBlockedBy.map((blocker) => <li key={blocker}>{blocker}</li>)}
          </ul>
          {detail.blueBlockedBy.length === 0 ? <div className="mt-3 text-sm text-muted-foreground">없음</div> : null}
        </Card>
      </div>
    </>
  );
}
