import { describe, expect, it } from "vitest";
import { requirementRows } from "../../lib/harness-data/fixtures";
import { REQUIREMENT_PICKER_DIALOG_VIEWPORT_HEIGHT_CLASS, filterRequirementPickerResults } from "./RequirementPickerDialog";

describe("RequirementPickerDialog search policy", () => {
  it("includes direct children when a parent requirement matches the query", () => {
    const results = filterRequirementPickerResults(requirementRows, "개인별").map((result) => ({
      id: result.requirement.id,
      inclusion: result.inclusion,
    }));

    expect(results).toEqual([
      { id: "REQ-021", inclusion: "direct" },
      { id: "REQ-022", inclusion: "parent" },
      { id: "REQ-023", inclusion: "parent" },
    ]);
  });

  it("does not automatically include the parent when a child requirement matches the query", () => {
    const results = filterRequirementPickerResults(requirementRows, "REQ-023").map((result) => result.requirement.id);

    expect(results).toEqual(["REQ-023"]);
  });

  it("uses a fixed viewport-based dialog height instead of content-driven max-height", () => {
    expect(REQUIREMENT_PICKER_DIALOG_VIEWPORT_HEIGHT_CLASS).toContain("h-[min(760px,calc(100vh-32px))]");
    expect(REQUIREMENT_PICKER_DIALOG_VIEWPORT_HEIGHT_CLASS).toContain("sm:h-[min(760px,calc(100vh-64px))]");
    expect(REQUIREMENT_PICKER_DIALOG_VIEWPORT_HEIGHT_CLASS).toContain("max-h-none");
    expect(REQUIREMENT_PICKER_DIALOG_VIEWPORT_HEIGHT_CLASS).not.toContain("max-h-[");
  });
});
