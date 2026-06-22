import { describe, expect, it } from "vitest";
import { appRequirementDetail as requirementDetail } from "../../../lib/harness-data/fixtures";
import { sourceLinksForRequirement } from "./detail-utils";

describe("sourceLinksForRequirement", () => {
  it("keeps artifact and source kinds distinguishable for badges", () => {
    const artifactItems = [requirementDetail.sourceFile, ...requirementDetail.linkedArtifacts];
    const artifactKinds = artifactItems.map((item) => item.kind);
    const artifactFiles = artifactItems.map((item) => item.file);
    const sourceItems = sourceLinksForRequirement(requirementDetail);
    const sourceKinds = sourceItems.map((item) => item.kind);

    expect(new Set(artifactKinds)).toEqual(new Set(["card", "scenario"]));
    expect(sourceItems.every((item) => !artifactFiles.includes(item.file))).toBe(true);
    expect(sourceKinds.some((kind) => artifactKinds.includes(kind))).toBe(false);
    expect(sourceKinds.some((kind) => kind.startsWith("api:"))).toBe(true);
    expect(sourceKinds.some((kind) => kind.startsWith("Request:"))).toBe(true);
    expect(sourceKinds.some((kind) => kind.startsWith("Response:"))).toBe(true);
    expect(sourceKinds.some((kind) => kind.startsWith("Entity:"))).toBe(true);
    expect(sourceKinds.some((kind) => kind.startsWith("Page:"))).toBe(true);
    expect(sourceKinds.some((kind) => kind.startsWith("Story:"))).toBe(true);
    expect(sourceKinds.some((kind) => kind.startsWith("Object:"))).toBe(false);
  });
});
