import type { RequirementDetail } from "../../../lib/harness-data/types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { Card } from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import { LocationLink } from "../../../components/ui/location-link";
import { channelTone, coverageTone, testLocation } from "./detail-utils";
import { SectionHeader } from "./SectionHeader";

export function RequirementAcceptanceTab({ detail }: { detail: RequirementDetail }) {
  const coverageByCriterion = new Map(detail.coverage.map((row) => [row.criterion, row]));
  const scenarioByTitle = new Map(detail.scenarios.map((scenario) => [scenario.title, scenario]));

  return (
    <>
      <div>
        <section>
          <SectionHeader title="AC 목록" />
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
                        <div className="grid gap-1">
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
                      ) : "없음"}
                    </dd>
                    <dt className="text-xs font-semibold leading-5 text-muted-foreground">시나리오</dt>
                    <dd className="min-w-0 break-words text-xs leading-5 text-muted-foreground">
                      {scenarios.length > 0 ? (
                        <div className="grid gap-1">
                          {scenarios.map((scenarioTitle) => {
                            const scenario = scenarioByTitle.get(scenarioTitle);
                            return (
                              <div key={scenarioTitle} className="leading-5">
                                {scenario ? (
                                  <LocationLink
                                    file={scenario.file}
                                    line={scenario.line}
                                    label={`${scenario.file}:${scenario.line}`}
                                    aria-label={`${scenario.file}:${scenario.line} 시나리오 위치 바로가기`}
                                  />
                                ) : (
                                  scenarioTitle
                                )}
                              </div>
                            );
                          })}
                        </div>
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
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            {detail.blueBlockedBy.map((blocker) => <div key={blocker}>{blocker}</div>)}
          </div>
          {detail.blueBlockedBy.length === 0 ? <div className="mt-3 text-sm text-muted-foreground">없음</div> : null}
        </Card>
      </div>
    </>
  );
}
