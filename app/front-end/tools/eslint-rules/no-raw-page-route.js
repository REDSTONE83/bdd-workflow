const E2E_PATH = "/tests/e2e/"

function normalizePath(filename) {
  return filename.replace(/\\/g, "/")
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Playwright page.route in live E2E tests; live smoke must use the real back-end through the Vite proxy.",
    },
    schema: [],
    messages: {
      noRouteMock:
        "Do not mock routes in live E2E tests. Use the real back-end through the Vite proxy.",
    },
  },
  create(context) {
    const filename = normalizePath(context.filename ?? context.getFilename())
    if (!filename.includes(E2E_PATH)) {
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
          context.report({ node: callee.property, messageId: "noRouteMock" })
        }
      },
    }
  },
}
