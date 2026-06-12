import type { RequirementDetail } from "../../../lib/harness-data/types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Card } from "../../../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../components/ui/collapsible";
import { EmptyState } from "../../../components/ui/empty-state";
import { LocationLink } from "../../../components/ui/location-link";
import { SectionHeader } from "./SectionHeader";

function nullableLabel(value: boolean | null) {
  if (value === false) return "NOT NULL";
  if (value === true) return "NULL";
  return null;
}

function nullableTone(value: boolean | null) {
  if (value === false) return "warning" as const;
  if (value === true) return "blue" as const;
  return "neutral" as const;
}

function optionalBooleanLabel(value: boolean | null) {
  if (value === true) return "예";
  if (value === false) return "아니오";
  return null;
}

export function RequirementEntitiesTab({ detail }: { detail: RequirementDetail }) {
  return (
    <>
      <SectionHeader title="Entity" />
      <div className="grid gap-3" role="list" aria-label="연결된 Entity">
        {detail.entitySurfaces.map((entity) => (
          <Card key={`${entity.className}-${entity.table}`} className="p-4" role="listitem">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="break-all font-mono text-sm font-semibold text-foreground">{entity.table}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>JPA Entity</span>
                  <span className="break-words font-medium text-foreground">{entity.className}</span>
                  {entity.listeners.length > 0 ? (
                    <>
                      <span aria-hidden="true">/</span>
                      <span className="break-words">listener {entity.listeners.join(", ")}</span>
                    </>
                  ) : null}
                </div>
                <LocationLink className="mt-2" file={entity.file} line={entity.line ?? 1} />
              </div>
              <StatusBadge label={`${entity.requirements.length} REQ`} tone={entity.requirements.length > 0 ? "blue" : "neutral"} />
            </div>
            <Collapsible className="mt-3 text-sm">
              <CollapsibleTrigger>
                컬럼 목록
                <span className="ml-2 font-normal text-muted-foreground">{entity.columns.length}개</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-0">
                <div className="divide-y divide-border">
                  {entity.columns.map((column) => (
                    <div key={`${entity.className}-${column.fieldName}-${column.columnName}`} className="grid gap-2 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="break-all font-mono font-medium text-foreground">{column.columnName}</div>
                        <span className="break-words font-mono text-xs text-muted-foreground">{column.fieldName}</span>
                        {column.primaryKey ? <StatusBadge label="PK" tone="warning" size="sm" /> : null}
                        {nullableLabel(column.nullable) ? (
                          <StatusBadge label={nullableLabel(column.nullable)!} tone={nullableTone(column.nullable)} size="sm" />
                        ) : null}
                      </div>
                      <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                        {column.length !== null ? (
                          <>
                            <dt className="text-muted-foreground">길이</dt>
                            <dd className="text-foreground">{column.length}</dd>
                          </>
                        ) : null}
                        {optionalBooleanLabel(column.unique) ? (
                          <>
                            <dt className="text-muted-foreground">고유</dt>
                            <dd className="text-foreground">{optionalBooleanLabel(column.unique)}</dd>
                          </>
                        ) : null}
                        {optionalBooleanLabel(column.updatable) ? (
                          <>
                            <dt className="text-muted-foreground">수정 가능</dt>
                            <dd className="text-foreground">{optionalBooleanLabel(column.updatable)}</dd>
                          </>
                        ) : null}
                        <dt className="text-muted-foreground">JPA Field</dt>
                        <dd className="break-words font-mono text-foreground">{column.fieldName}</dd>
                        <dt className="text-muted-foreground">Java 타입</dt>
                        <dd className="break-all font-mono text-foreground">{column.javaType}</dd>
                        {column.generation !== null ? (
                          <>
                            <dt className="text-muted-foreground">생성 전략</dt>
                            <dd className="break-all text-foreground">{column.generation}</dd>
                          </>
                        ) : null}
                        {column.requirements.length > 0 ? (
                          <>
                            <dt className="text-muted-foreground">연결 요건</dt>
                            <dd className="break-words font-mono text-foreground">{column.requirements.join(", ")}</dd>
                          </>
                        ) : null}
                      </dl>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
        {detail.entitySurfaces.length === 0 ? <EmptyState>연결된 Entity가 없다.</EmptyState> : null}
      </div>
    </>
  );
}
