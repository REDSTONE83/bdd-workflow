import { describe, expect, it } from "vitest";
import { terminologyBrowser } from "./fixtures";
import { filterTerminologyTerms, terminologyDomains } from "./terminology";

describe("terminology data helpers", () => {
  it("exposes terminology browser fields from the terminology index contract", () => {
    expect(terminologyBrowser.terms.length).toBeGreaterThan(0);
    expect(terminologyBrowser.terms.every((term) => term.key && term.status && term.sourceFile && term.ko && term.en && term.meaning)).toBe(true);
    expect(terminologyBrowser.terms.some((term) => term.allow.length > 0)).toBe(true);
    expect(terminologyBrowser.terms.some((term) => term.ban.length > 0)).toBe(true);
    expect(terminologyBrowser.terms.some((term) => Object.values(term.names).flat().length > 0)).toBe(true);
  });

  it("filters terminology terms by domain, status, and searchable fields", () => {
    expect(terminologyDomains(terminologyBrowser.terms)).toEqual(["harness", "todo", "ui"]);
    expect(filterTerminologyTerms(terminologyBrowser.terms, { query: "traceState", domain: "ALL", status: "ALL" }).map((term) => term.key)).toEqual([
      "harness.traceState",
    ]);
    expect(filterTerminologyTerms(terminologyBrowser.terms, { query: "모달", domain: "ALL", status: "ALL" }).map((term) => term.key)).toEqual([
      "ui.dialog",
    ]);
    expect(filterTerminologyTerms(terminologyBrowser.terms, { query: "", domain: "ui", status: "approved" }).map((term) => term.domain)).toEqual([
      "ui",
      "ui",
    ]);
    expect(filterTerminologyTerms(terminologyBrowser.terms, { query: "", domain: "ALL", status: "draft" }).map((term) => term.key)).toEqual([
      "todo.dueDate",
    ]);
  });
});
