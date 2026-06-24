import type { RequirementDataField, RequirementDataShape } from "../../../lib/harness-data/types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../components/ui/collapsible";

const MAX_CONTRACT_SHAPE_DEPTH = 3;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function referencedShapesForField(field: RequirementDataField, shapes: RequirementDataShape[]) {
  const references = new Map<string, RequirementDataShape>();
  for (const shape of shapes) {
    const boundary = `(^|[^A-Za-z0-9_$])${escapeRegExp(shape.name)}($|[^A-Za-z0-9_$])`;
    if (!new RegExp(boundary).test(field.type)) continue;
    const existing = references.get(shape.name);
    if (!existing || (shape.kind === "Object" && existing.kind !== "Object")) {
      references.set(shape.name, shape);
    }
  }
  return [...references.values()];
}

function shapeForName(name: string, label: string, shapes: RequirementDataShape[]) {
  const preferredKind = label === "Request" || label === "Response" ? label : null;
  return shapes.find((shape) => shape.name === name && shape.kind === preferredKind) ?? shapes.find((shape) => shape.name === name);
}

export function ContractShapeFields({
  fields,
  shapes,
  depth = 0,
  ancestry = [],
}: {
  fields: RequirementDataField[];
  shapes: RequirementDataShape[];
  depth?: number;
  ancestry?: string[];
}) {
  return (
    <div className="divide-y divide-border rounded-md border border-border">
      {fields.map((field) => {
        const references = referencedShapesForField(field, shapes);
        return (
          <div key={`${ancestry.join(".")}-${field.name}`} className="grid grid-cols-[1fr_1fr_4rem] gap-2 p-2">
            <div className="break-words font-medium text-foreground">{field.name}</div>
            <div className="break-words font-mono text-xs text-muted-foreground">{field.type}</div>
            <div className="text-xs text-muted-foreground">{field.required ? "필수" : "선택"}</div>
            {field.description ? <div className="col-span-3 break-words text-xs text-muted-foreground">{field.description}</div> : null}
            {references.length > 0 ? (
              <div className="col-span-3 space-y-2 pt-1">
                {references.map((reference) => {
                  const hasCycle = ancestry.includes(reference.name);
                  const isMaxDepth = depth >= MAX_CONTRACT_SHAPE_DEPTH;
                  return (
                    <Collapsible key={`${field.name}-${reference.name}`} className="bg-muted/20">
                      <CollapsibleTrigger className="text-xs">
                        참조 객체
                        <span className="ml-2 font-mono font-normal text-muted-foreground">{reference.name}</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mb-2">
                          <div className="text-sm font-semibold text-foreground">{reference.name}</div>
                        </div>
                        {hasCycle ? (
                          <div className="text-xs text-muted-foreground">순환 참조라 이 단계에서 멈춘다.</div>
                        ) : isMaxDepth ? (
                          <div className="text-xs text-muted-foreground">최대 표시 깊이에 도달해 하위 필드를 접는다.</div>
                        ) : (
                          <ContractShapeFields fields={reference.fields} shapes={shapes} depth={depth + 1} ancestry={[...ancestry, reference.name]} />
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function ContractShapeDetails({ label, names, shapes }: { label: string; names: string[]; shapes: RequirementDataShape[] }) {
  const linkedShapes = names.map((name) => ({ name, shape: shapeForName(name, label, shapes) }));

  return (
    <Collapsible className="text-sm">
      <CollapsibleTrigger>
        {label}
        <span className="ml-2 font-normal text-muted-foreground">{names.length > 0 ? names.join(", ") : "없음"}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {linkedShapes.length > 0 ? (
          <div className="space-y-3">
            {linkedShapes.map(({ name, shape }) => (
              <section key={`${label}-${name}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-foreground">{name}</div>
                  {!shape ? <StatusBadge label="정보 없음" /> : null}
                </div>
                {shape ? (
                  <div className="mt-2">
                    <ContractShapeFields fields={shape.fields} shapes={shapes} ancestry={[shape.name]} />
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-muted-foreground">연결된 구성 정보가 아직 없다.</div>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">연결된 {label}가 없다.</div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
