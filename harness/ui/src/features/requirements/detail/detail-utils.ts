import type { AnchorHTMLAttributes } from "react";
import { editorHref } from "../../../components/ui/location-link";
import type {
  AcceptanceCoverageRow,
  LinkedArtifact,
  RequirementDataShape,
  RequirementDetail,
  RequirementScenario,
  RequirementUiSurface,
} from "../../../lib/harness-data/types";

export { editorHref };

export function linkTargetProps(href: string): Partial<Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel">> {
  return href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {};
}

export function shapeTone(shape: RequirementDataShape) {
  if (shape.kind === "Request") return "warning" as const;
  if (shape.kind === "Response") return "blue" as const;
  return "neutral" as const;
}

export function uiSurfaceLabel(surface: RequirementUiSurface) {
  if (surface.storybookTitle && surface.storybookStory) {
    return `${surface.storybookTitle} / ${surface.storybookStory}`;
  }
  return surface.route ? `${surface.name} ${surface.route}` : surface.name;
}

export function coverageTone(status: string) {
  if (status === "PASS") return "green" as const;
  if (status === "FAIL") return "red" as const;
  if (status === "MISSING") return "warning" as const;
  return "neutral" as const;
}

export function channelTone(channel: string) {
  if (channel === "UI") return "blue" as const;
  if (channel === "API") return "warning" as const;
  if (channel === "E2E") return "green" as const;
  if (channel === "STATIC") return "inactive" as const;
  return "neutral" as const;
}

export function uniqueTests(rows: AcceptanceCoverageRow[]) {
  return Array.from(new Set(rows.flatMap((row) => row.tests)));
}

export function testLocation(test: string) {
  const [rawLocation] = test.split(" > ");
  const match = rawLocation.match(/^(.*):(\d+)$/);
  const file = match?.[1] ?? rawLocation;
  const line = match?.[2] ? Number(match[2]) : 1;
  return { file, line, label: `${file}:${line}` };
}

export function coverageRowsForScenario(detail: RequirementDetail, scenario: RequirementScenario) {
  return detail.coverage.filter((row) => scenario.covers.includes(row.criterion));
}

export function artifactKindMeta(kind: string) {
  const [rawCategory, ...detailParts] = kind.split(":");
  const category = rawCategory.toLowerCase();
  const detail = detailParts.join(":");

  if (category === "card") return { label: "요건 카드", name: detail, tone: "blue" as const };
  if (category === "scenario") return { label: "수용 시나리오", name: detail, tone: "green" as const };
  if (category === "api") return { label: "API 설계", name: detail, tone: "neutral" as const };
  if (rawCategory === "Request") return { label: "Request", name: detail, tone: "warning" as const };
  if (rawCategory === "Response") return { label: "Response", name: detail, tone: "blue" as const };
  if (rawCategory === "Entity") return { label: "DB 설계", name: detail, tone: "green" as const };
  if (rawCategory === "Page") return { label: "UI Page", name: detail, tone: "blue" as const };
  if (rawCategory === "Route") return { label: "UI Route", name: detail, tone: "neutral" as const };
  if (rawCategory === "Story") return { label: "UI Story", name: detail, tone: "warning" as const };
  if (category === "story") return { label: "Story", name: detail, tone: "warning" as const };

  return { label: rawCategory, name: detail, tone: "neutral" as const };
}

export function sourceLinksForRequirement(detail: RequirementDetail): LinkedArtifact[] {
  const sourceLinks = [
    ...detail.apiSurfaces.map((api) => ({ kind: `api:${api.operationId}`, file: api.file, line: api.line })),
    ...detail.dataShapes
      .filter((shape) => shape.kind !== "Object")
      .map((shape) => ({ kind: `${shape.kind}:${shape.name}`, file: shape.file, line: shape.line })),
    ...detail.entitySurfaces.map((entity) => ({ kind: `Entity:${entity.table}`, file: entity.file, line: entity.line ?? 1 })),
    ...detail.uiSurfaces.map((surface) => ({ kind: `${surface.kind}:${surface.name}`, file: surface.file, line: surface.line })),
  ];

  return sourceLinks.filter(
    (item, index, items) =>
      items.findIndex((other) => `${other.kind}-${other.file}-${other.line}` === `${item.kind}-${item.file}-${item.line}`) === index,
  );
}
