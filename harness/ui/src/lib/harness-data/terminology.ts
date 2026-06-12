import type { TermStatus, TerminologyTerm } from "./types";

export interface TerminologyFilters {
  query: string;
  domain: string;
  status: "ALL" | TermStatus;
}

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[\s_-]+/g, "");
}

function searchableValues(term: TerminologyTerm) {
  return [
    term.key,
    term.domain,
    term.status,
    term.sourceFile,
    term.ko,
    term.en,
    term.meaning,
    ...term.allow,
    ...term.ban,
    ...Object.values(term.names).flat(),
    term.note ?? "",
    term.reason ?? "",
  ];
}

export function filterTerminologyTerms(terms: TerminologyTerm[], filters: TerminologyFilters) {
  const query = normalize(filters.query.trim());

  return terms.filter((term) => {
    if (filters.domain !== "ALL" && term.domain !== filters.domain) return false;
    if (filters.status !== "ALL" && term.status !== filters.status) return false;
    if (!query) return true;
    return searchableValues(term).some((value) => normalize(value).includes(query));
  });
}

export function terminologyDomains(terms: TerminologyTerm[]) {
  return Array.from(new Set(terms.map((term) => term.domain))).sort((a, b) => a.localeCompare(b));
}
