const E2E_PATH = "/tests/e2e/"
const API_ROUTE_HELPER = "/tests/e2e/_helpers/apiRoute.ts"

function normalizePath(filename) {
  return filename.replace(/\\/g, "/")
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw Playwright page.route in E2E tests; use routeApi() for document fallback.",
    },
    schema: [],
    messages: {
      useRouteApi:
        "Use routeApi(page, ...) from tests/e2e/_helpers/apiRoute.ts so document navigation falls back to the SPA.",
    },
  },
  create(context) {
    const filename = normalizePath(context.filename ?? context.getFilename())
    if (!filename.includes(E2E_PATH) || filename.endsWith(API_ROUTE_HELPER)) {
      return {}
    }

    return {
      CallExpression(node) {
        const callee = node.callee
        if (
          callee.type === "MemberExpression" &&
          !callee.computed &&
          callee.object.type === "Identifier" &&
          callee.object.name === "page" &&
          callee.property.type === "Identifier" &&
          callee.property.name === "route"
        ) {
          context.report({ node: callee.property, messageId: "useRouteApi" })
        }
      },
    }
  },
}
