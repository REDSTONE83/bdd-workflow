import type { RequirementDetail } from "../../../lib/harness-data/types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { Card } from "../../../components/ui/card";
import { coverageTone } from "./detail-utils";
import { SectionHeader } from "./SectionHeader";

export function RequirementAcceptanceTab({ detail }: { detail: RequirementDetail }) {
  const coverageByCriterion = new Map(detail.coverage.map((row) => [row.criterion, row]));

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
                      <div className="font-mono text-xs text-muted-foreground">{criterion.id}</div>
                      <div className="mt-2 break-words text-sm font-medium text-foreground">{criterion.text}</div>
                    </div>
                    <StatusBadge label={status} tone={coverageTone(status)} />
                  </div>
                  <dl className="mt-3 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">채널</dt>
                    <dd className="font-medium text-foreground">{channel}</dd>
                    <dt className="text-muted-foreground">연결 테스트</dt>
                    <dd className="break-words text-muted-foreground">
                      {tests.length > 0 ? (
                        <ul className="space-y-1">
                          {tests.map((test) => <li key={test} className="font-mono text-xs">{test}</li>)}
                        </ul>
                      ) : "없음"}
                    </dd>
                    <dt className="text-muted-foreground">시나리오</dt>
                    <dd className="break-words text-muted-foreground">{scenarios.length > 0 ? scenarios.join(", ") : "없음"}</dd>
                  </dl>
                </Card>
              );
            })}
          </div>
          {detail.acceptanceCriteria.length === 0 ? <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">수용 기준이 없다.</div> : null}
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
