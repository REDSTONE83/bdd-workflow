export function requirementDetailPath(requirementId: string, search = "") {
  return `/requirements/${requirementId}${search}`;
}

export function requirementListPath(search = "") {
  return `/requirements${search}`;
}
