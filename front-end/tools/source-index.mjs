#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

let ts
try {
  ts = await import("typescript")
} catch (error) {
  console.error(
    "front-end source index requires the front-end TypeScript dependency. Run `cd front-end && npm install` first.",
  )
  console.error(error.message)
  process.exit(1)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseCliArgs(argv) {
  const cfg = {
    frontEndRoot: path.resolve(__dirname, ".."),
    repoRoot: null,
    outFile: null,
  }
  for (const arg of argv) {
    if (arg.startsWith("--front-end-root=")) {
      cfg.frontEndRoot = path.resolve(arg.slice("--front-end-root=".length))
    } else if (arg.startsWith("--repo-root=")) {
      cfg.repoRoot = path.resolve(arg.slice("--repo-root=".length))
    } else if (arg.startsWith("--out=")) {
      cfg.outFile = path.resolve(arg.slice("--out=".length))
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  cfg.repoRoot ||= path.resolve(cfg.frontEndRoot, "..")
  cfg.outFile ||= path.join(cfg.repoRoot, "build", "harness", "indexes", "front-end.source-index.json")
  return cfg
}

const cli = parseCliArgs(process.argv.slice(2))
const frontEndRoot = cli.frontEndRoot
const repoRoot = cli.repoRoot
const outFile = cli.outFile
const outDir = path.dirname(outFile)

const REQUIREMENT_PATTERN = /^REQ-\d{3,}$/
const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"])
const SKIP_DIRS = new Set([
  ".cache",
  ".storybook",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "storybook-static",
  "test-results",
])

function repoRelative(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/")
}

function frontEndRelative(filePath) {
  return path.relative(frontEndRoot, filePath).replace(/\\/g, "/")
}

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return []
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".")) {
      if (SKIP_DIRS.has(entry.name)) {
        return []
      }
    }
    if (SKIP_DIRS.has(entry.name)) {
      return []
    }

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return walk(fullPath)
    }
    return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [fullPath] : []
  })
}

function parseSourceFile(filePath) {
  const source = fs.readFileSync(filePath, "utf8")
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
}

function isString(node) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
}

function stringValue(node) {
  return isString(node) ? node.text : null
}

function unwrapExpression(node) {
  let current = node
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isTypeAssertionExpression(current) ||
      (ts.isSatisfiesExpression && ts.isSatisfiesExpression(current)))
  ) {
    current = current.expression
  }
  return current
}

function objectLiteralExpression(node) {
  const expression = unwrapExpression(node)
  return expression && ts.isObjectLiteralExpression(expression) ? expression : null
}

function propertyNameText(name) {
  if (!name) {
    return null
  }
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text
  }
  return null
}

function objectProperty(objectLiteral, names) {
  const object = objectLiteralExpression(objectLiteral)
  if (!object) {
    return null
  }
  const wanted = new Set(Array.isArray(names) ? names : [names])
  for (const prop of object.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      continue
    }
    if (wanted.has(propertyNameText(prop.name))) {
      return prop.initializer
    }
  }
  return null
}

function nestedObjectProperty(objectLiteral, pathParts) {
  let current = objectLiteral
  for (const part of pathParts) {
    current = objectProperty(current, part)
    if (!current) {
      return null
    }
  }
  return current
}

function stringArray(node) {
  if (!node) {
    return []
  }
  if (isString(node)) {
    return [node.text]
  }
  if (!ts.isArrayLiteralExpression(node)) {
    return []
  }
  return node.elements.map(stringValue).filter((value) => value !== null)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function requirementValues(node) {
  return unique(stringArray(node)).filter((value) => REQUIREMENT_PATTERN.test(value))
}

function extractRequirementsFromObject(objectLiteral) {
  return requirementValues(objectProperty(objectLiteral, ["requirements", "requirementIds", "Requirement"]))
}

function extractRouteFromObject(objectLiteral) {
  const route = objectProperty(objectLiteral, ["route", "path", "routePath"])
  return route ? stringValue(route) : null
}

function extractPageFromObject(objectLiteral) {
  const page = objectProperty(objectLiteral, ["page", "screen", "name"])
  return page ? stringValue(page) : null
}

function parseUsesApiLine(line, lineNumber) {
  const raw = line.match(/@UsesApi\b(.*)$/)?.[1]?.trim() ?? ""
  const parts = raw.split(/\s+/).filter(Boolean)
  const method = parts[0]?.toUpperCase() ?? null
  const apiPath = parts[1] ?? null
  const trigger = parts.slice(2).join(" ") || null

  if (!method || !HTTP_METHODS.has(method) || !apiPath || !apiPath.startsWith("/") || apiPath.includes("?")) {
    return {
      invalid: {
        line: lineNumber,
        value: raw,
        message: "@UsesApi must use: @UsesApi METHOD /openapi/path [trigger]. METHOD is GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS and path must not include a query string.",
      },
    }
  }

  return {
    usage: {
      method,
      path: apiPath,
      trigger,
      line: lineNumber,
    },
  }
}

function objectText(node, sourceFile) {
  return node.getText(sourceFile)
}

function exportedVariableDeclarations(sourceFile) {
  const declarations = []
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue
    }
    const exported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    if (!exported) {
      continue
    }
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) {
        declarations.push(declaration)
      }
    }
  }
  return declarations
}

function exportedFunctions(sourceFile) {
  return sourceFile.statements.filter((statement) => {
    if (!ts.isFunctionDeclaration(statement) || !statement.name) {
      return false
    }
    return statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  })
}

function variableObjectLiteral(sourceFile, name) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue
    }
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
        return objectLiteralExpression(declaration.initializer)
      }
    }
  }
  return null
}

function defaultExportObject(sourceFile) {
  for (const statement of sourceFile.statements) {
    if (!ts.isExportAssignment(statement)) {
      continue
    }
    const directObject = objectLiteralExpression(statement.expression)
    if (directObject) {
      return directObject
    }
    if (ts.isIdentifier(statement.expression)) {
      return variableObjectLiteral(sourceFile, statement.expression.text)
    }
  }
  return null
}

function leadingMetadata(sourceText) {
  const headLines = sourceText.split(/\r?\n/).slice(0, 60)
  const head = headLines.join("\n")
  const requirements = unique(
    [...head.matchAll(/@Requirement\s+((?:REQ-\d{3,}\s*,?\s*)+)/g)].flatMap((match) =>
      match[1].split(/[,\s]+/).filter((value) => REQUIREMENT_PATTERN.test(value)),
    ),
  )
  const route = head.match(/@Route\s+(\S+)/)?.[1] ?? null
  const page = head.match(/@Page\s+(.+)$/m)?.[1]?.trim() ?? null
  const usesApis = []
  const invalidUsesApis = []
  for (let index = 0; index < headLines.length; index += 1) {
    const line = headLines[index]
    if (!/@UsesApi\b/.test(line)) {
      continue
    }
    const parsed = parseUsesApiLine(line, index + 1)
    if (parsed.usage) {
      usesApis.push(parsed.usage)
    }
    if (parsed.invalid) {
      invalidUsesApis.push(parsed.invalid)
    }
  }
  return { requirements, route, page, usesApis, invalidUsesApis }
}

function fileHarnessMetadata(sourceText) {
  // FE 표준: 컴포넌트/페이지 파일은 파일 상단 JSDoc 의 @Requirement / @Route / @Page 만 사용한다.
  // 별도 `export const harness = {...}` 객체는 React Fast Refresh 와 충돌하므로 금지.
  // Storybook story 의 객체 메타데이터는 storyRequirements() 가 별도로 처리한다.
  const { requirements, route, page, usesApis, invalidUsesApis } = leadingMetadata(sourceText)
  return {
    requirements: unique(requirements),
    route,
    page,
    usesApis,
    invalidUsesApis,
  }
}

function isPageFile(fileRel) {
  return /(^|\/)pages\/.+\.tsx$/.test(fileRel) || /Page\.tsx$/.test(fileRel)
}

function pageNameFromSource(sourceFile, fileRel, metadata) {
  if (metadata.page) {
    return metadata.page
  }
  const functions = exportedFunctions(sourceFile)
  const namedPage = functions.find((fn) => /Page$/.test(fn.name.text))
  if (namedPage) {
    return namedPage.name.text
  }
  const exportedVars = exportedVariableDeclarations(sourceFile)
  const variablePage = exportedVars.find((decl) => /Page$/.test(decl.name.text))
  if (variablePage) {
    return variablePage.name.text
  }
  return path.basename(fileRel, path.extname(fileRel))
}

function collectPages(sourceFile, sourceText, filePath, metadata) {
  const fileRel = repoRelative(filePath)
  const feRel = frontEndRelative(filePath)
  if (!isPageFile(feRel) || metadata.requirements.length === 0) {
    return []
  }
  return [
    {
      source: "front-end",
      requirements: metadata.requirements,
      name: pageNameFromSource(sourceFile, feRel, metadata),
      route: metadata.route,
      file: fileRel,
      line: 1,
    },
  ]
}

function collectRoutes(sourceFile, filePath, metadata) {
  const fileRel = repoRelative(filePath)
  const routes = []

  if (metadata.route && metadata.requirements.length > 0) {
    routes.push({
      source: "front-end",
      requirements: metadata.requirements,
      path: metadata.route,
      component: metadata.page,
      file: fileRel,
      line: 1,
    })
  }

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const routePath = extractRouteFromObject(node)
      const routeRequirements = extractRequirementsFromObject(node)
      // 진짜 라우트 정의 객체(createBrowserRouter 등)는 element/component 키를 가진다.
      // 컴포넌트 메타데이터 객체가 잘못 라우트로 등록되는 것을 막기 위한 가드.
      const component = objectProperty(node, ["component", "element"])
      if (routePath && routeRequirements.length > 0 && component) {
        routes.push({
          source: "front-end",
          requirements: routeRequirements,
          path: routePath,
          component: objectText(component, sourceFile),
          file: fileRel,
          line: lineOf(sourceFile, node),
        })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  const byIdentity = new Map()
  for (const route of routes) {
    const key = `${route.file}:${route.path}:${route.requirements.join(",")}`
    const existing = byIdentity.get(key)
    if (!existing || (!existing.component && route.component)) {
      byIdentity.set(key, route)
    }
  }
  return [...byIdentity.values()]
}

function storyRequirements(defaultObject, storyObject, fileMetadata) {
  const locations = [
    ["parameters", "harness", "requirements"],
    ["parameters", "harness", "requirementIds"],
    ["parameters", "requirements"],
    ["parameters", "requirementIds"],
  ]

  for (const parts of locations) {
    const storyValue = storyObject ? nestedObjectProperty(storyObject, parts) : null
    const storyRequirements = requirementValues(storyValue)
    if (storyRequirements.length > 0) {
      return storyRequirements
    }
  }

  for (const parts of locations) {
    const defaultValue = defaultObject ? nestedObjectProperty(defaultObject, parts) : null
    const defaultRequirements = requirementValues(defaultValue)
    if (defaultRequirements.length > 0) {
      return defaultRequirements
    }
  }

  return fileMetadata.requirements
}

function collectStories(sourceFile, filePath, metadata) {
  const fileRel = repoRelative(filePath)
  if (!/\.stories\.tsx?$/.test(fileRel)) {
    return []
  }

  const defaultObject = defaultExportObject(sourceFile)
  const title = defaultObject ? stringValue(objectProperty(defaultObject, "title")) : null
  const component = defaultObject ? objectProperty(defaultObject, "component") : null
  const stories = []

  for (const declaration of exportedVariableDeclarations(sourceFile)) {
    const storyName = declaration.name.text
    if (["harness", "requirements", "requirementIds"].includes(storyName)) {
      continue
    }
    const storyObject = declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer)
      ? declaration.initializer
      : null
    const requirements = storyRequirements(defaultObject, storyObject, metadata)
    if (requirements.length === 0) {
      continue
    }
    stories.push({
      source: "front-end",
      requirements,
      title,
      component: component ? objectText(component, sourceFile) : null,
      story: storyName,
      file: fileRel,
      line: lineOf(sourceFile, declaration),
    })
  }

  return stories
}

function callText(node, sourceFile) {
  return node.expression.getText(sourceFile)
}

function isTestCaseCall(node, sourceFile) {
  if (!ts.isCallExpression(node)) {
    return false
  }
  const text = callText(node, sourceFile)
  return ["test", "test.only", "test.skip", "test.fixme"].includes(text)
}

function isDescribeCall(node, sourceFile) {
  if (!ts.isCallExpression(node)) {
    return false
  }
  return ["test.describe", "test.describe.only", "test.describe.skip"].includes(callText(node, sourceFile))
}

function callbackBlock(callExpression) {
  const callback = callExpression.arguments[1]
  if (
    callback &&
    (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) &&
    callback.body &&
    ts.isBlock(callback.body)
  ) {
    return callback.body
  }
  return null
}

function isAnnotationsPush(node) {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) {
    return false
  }
  if (node.expression.name.text !== "push") {
    return false
  }
  const target = node.expression.expression
  return ts.isPropertyAccessExpression(target) && target.name.text === "annotations"
}

function annotationFromObject(objectLiteral) {
  const type = stringValue(objectProperty(objectLiteral, "type"))
  const description = stringValue(objectProperty(objectLiteral, "description"))
  if (!type || !description) {
    return null
  }
  return { type, description }
}

function collectAnnotations(block) {
  const annotations = []
  const dynamicAnnotationLines = []

  function visit(node) {
    if (isAnnotationsPush(node)) {
      for (const arg of node.arguments) {
        if (ts.isObjectLiteralExpression(arg)) {
          const annotation = annotationFromObject(arg)
          if (annotation) {
            annotations.push({ ...annotation, line: lineOf(block.getSourceFile(), arg) })
          } else {
            dynamicAnnotationLines.push(lineOf(block.getSourceFile(), arg))
          }
        } else {
          dynamicAnnotationLines.push(lineOf(block.getSourceFile(), arg))
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(block)

  return { annotations, dynamicAnnotationLines }
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "test"
}

function collectPlaywrightTests(sourceFile, filePath, issues, textChannels) {
  const fileRel = repoRelative(filePath)
  const tests = []

  function visit(node, describeStack) {
    if (isDescribeCall(node, sourceFile)) {
      const title = stringValue(node.arguments[0])
      const block = callbackBlock(node)
      if (title && block) {
        for (const child of block.statements) {
          visit(child, [...describeStack, title])
        }
        return
      }
    }

    if (isTestCaseCall(node, sourceFile)) {
      const title = stringValue(node.arguments[0])
      const block = callbackBlock(node)
      if (title && block) {
        const { annotations, dynamicAnnotationLines } = collectAnnotations(block)
        const requirements = unique(
          annotations
            .filter((annotation) => ["Requirement", "REQ"].includes(annotation.type))
            .map((annotation) => annotation.description)
            .filter((value) => REQUIREMENT_PATTERN.test(value)),
        )
        const covers = unique(
          annotations
            .filter((annotation) => annotation.type === "Covers")
            .map((annotation) => annotation.description),
        )

        for (const line of dynamicAnnotationLines) {
          issues.push({
            severity: "warning",
            kind: "DYNAMIC_TEST_ANNOTATION",
            message: "Playwright BDD annotation must be a literal object with type and description.",
            location: { file: fileRel, line },
          })
        }

        if (requirements.length > 0 || covers.length > 0) {
          const line = lineOf(sourceFile, node)
          const titlePath = [...describeStack, title]
          const identityNoLine = `${fileRel} > ${titlePath.join(" > ")}`
          const identity = `${fileRel}:${line} > ${titlePath.join(" > ")}`
          const testEntry = {
            source: "front-end",
            kind: "playwright",
            requirements,
            className: path.basename(fileRel),
            method: slug(title),
            identity,
            resultKeys: [identityNoLine],
            displayName: title,
            titlePath,
            covers,
            file: fileRel,
            line,
          }
          tests.push(testEntry)

          for (const coversValue of covers) {
            textChannels.push({
              channel: "FE.Covers",
              content: coversValue,
              file: fileRel,
              line,
              source: identity,
              requirements,
            })
          }
          textChannels.push({
            channel: "FE.TestTitle",
            content: title,
            file: fileRel,
            line,
            source: identity,
            requirements,
          })
        }
        return
      }
    }

    ts.forEachChild(node, (child) => visit(child, describeStack))
  }

  visit(sourceFile, [])
  return tests
}

// REQ-006 Skeleton: src/api/** 모듈에서 (method, path) 쌍을 수집한다.
// 화면 컴포넌트의 직접 호출은 별도 룰이 잡으므로 여기서는 보지 않는다.
// 추출 패턴은 SDK/생성 도구 선택 전 단계라 잠정적이다:
//   - client.METHOD(path, ...) 형태 (예: client.get("/users/signup"))
//   - fetch(path, { method: "POST" }) 형태
//   - 템플릿 리터럴은 첫 부분만 본다(예: `/users/${id}` → `/users/`)
// Skeleton에서는 최소 패턴만 잡고 정확도는 후속 단계에서 보강한다.
const FE_API_DIR_SEGMENT = `${path.sep}api${path.sep}`
const HTTP_METHOD_RE = /^(get|post|put|patch|delete|head|options)$/i

function isInFrontEndApiModule(filePath) {
  const norm = filePath.includes("\\") ? filePath.replace(/\\/g, "/") : filePath
  return /\/src\/api\//.test(norm)
}

function literalPathFromArg(arg) {
  if (!arg) return null
  if (isString(arg)) return arg.text
  if (ts.isTemplateExpression(arg)) {
    return arg.head.text || null
  }
  if (ts.isNoSubstitutionTemplateLiteral(arg)) {
    return arg.text
  }
  return null
}

function methodFromPropertyAccess(node) {
  if (!ts.isPropertyAccessExpression(node)) return null
  const name = node.name?.text ?? ""
  if (HTTP_METHOD_RE.test(name)) return name.toUpperCase()
  return null
}

function collectFrontEndApiCalls(sourceFile, filePath) {
  if (!isInFrontEndApiModule(filePath)) return []
  const fileRel = repoRelative(filePath)
  const calls = []

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression
      const method = methodFromPropertyAccess(callee)
      if (method) {
        const literalPath = literalPathFromArg(node.arguments[0])
        if (literalPath) {
          calls.push({
            source: "front-end",
            method,
            path: literalPath,
            file: fileRel,
            line: lineOf(sourceFile, node),
          })
        }
      } else if (ts.isIdentifier(callee) && callee.text === "fetch") {
        const literalPath = literalPathFromArg(node.arguments[0])
        const opts = node.arguments[1]
        let fetchMethod = "GET"
        if (opts && ts.isObjectLiteralExpression(opts)) {
          const methodProp = objectProperty(opts, "method")
          const methodValue = methodProp ? stringValue(methodProp) : null
          if (methodValue) fetchMethod = methodValue.toUpperCase()
        }
        if (literalPath) {
          calls.push({
            source: "front-end",
            method: fetchMethod,
            path: literalPath,
            file: fileRel,
            line: lineOf(sourceFile, node),
          })
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return calls
}

function isDirectFetchExpression(expression) {
  const callee = unwrapExpression(expression)
  if (ts.isIdentifier(callee) && callee.text === "fetch") {
    return true
  }
  if (ts.isPropertyAccessExpression(callee) && callee.name.text === "fetch") {
    const target = unwrapExpression(callee.expression)
    return ts.isIdentifier(target) && ["window", "globalThis"].includes(target.text)
  }
  return false
}

function collectDirectFetchBoundaryIssues(sourceFile, filePath) {
  const feRel = frontEndRelative(filePath)
  if (!feRel.startsWith("src/") || isInFrontEndApiModule(filePath)) {
    return []
  }

  const fileRel = repoRelative(filePath)
  const issues = []

  function visit(node) {
    if (ts.isCallExpression(node) && isDirectFetchExpression(node.expression)) {
      issues.push({
        severity: "error",
        kind: "DIRECT_FETCH_OUTSIDE_API",
        message: "Application source must call HTTP APIs through front-end/src/api/**, not direct fetch.",
        location: {
          file: fileRel,
          line: lineOf(sourceFile, node),
          identity: node.expression.getText(sourceFile),
        },
        evidence: {
          allowedBoundary: "front-end/src/api/**",
          callee: node.expression.getText(sourceFile),
        },
      })
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return issues
}

function collectTextChannelsFromSurfaces(surfaces, textChannels) {
  for (const page of surfaces.pages) {
    textChannels.push({
      channel: "FE.Page",
      content: page.name,
      file: page.file,
      line: page.line,
      source: page.name,
      requirements: page.requirements,
    })
  }
  for (const route of surfaces.routes) {
    textChannels.push({
      channel: "FE.Route",
      content: route.path,
      file: route.file,
      line: route.line,
      source: route.component ?? route.path,
      requirements: route.requirements,
    })
  }
  for (const story of surfaces.stories) {
    textChannels.push({
      channel: "FE.Story",
      content: [story.title, story.story].filter(Boolean).join(" / "),
      file: story.file,
      line: story.line,
      source: story.story,
      requirements: story.requirements,
    })
  }
}

function main() {
  const srcRoot = path.join(frontEndRoot, "src")
  const e2eRoot = path.join(frontEndRoot, "tests", "e2e")
  const issues = []
  const textChannels = []
  const pages = []
  const routes = []
  const stories = []
  const tests = []
  const apiCalls = []

  for (const filePath of walk(srcRoot)) {
    const sourceText = fs.readFileSync(filePath, "utf8")
    const sourceFile = parseSourceFile(filePath)
    const metadata = fileHarnessMetadata(sourceText)
    pages.push(...collectPages(sourceFile, sourceText, filePath, metadata))
    routes.push(...collectRoutes(sourceFile, filePath, metadata))
    stories.push(...collectStories(sourceFile, filePath, metadata))
    apiCalls.push(...collectFrontEndApiCalls(sourceFile, filePath))
    issues.push(...collectDirectFetchBoundaryIssues(sourceFile, filePath))
  }

  for (const filePath of walk(e2eRoot)) {
    if (!/\.spec\.tsx?$/.test(filePath)) {
      continue
    }
    const sourceFile = parseSourceFile(filePath)
    tests.push(...collectPlaywrightTests(sourceFile, filePath, issues, textChannels))
  }

  collectTextChannelsFromSurfaces({ pages, routes, stories }, textChannels)

  for (const test of tests) {
    if (test.covers.length > 0 && test.requirements.length === 0) {
      issues.push({
        severity: "warning",
        kind: "COVERS_WITHOUT_REQUIREMENT",
        message: "FE BDD test has Covers metadata but no Requirement metadata.",
        location: { file: test.file, line: test.line },
      })
    }
    if (test.requirements.length > 0 && test.covers.length === 0) {
      issues.push({
        severity: "warning",
        kind: "REQUIREMENT_WITHOUT_COVERS",
        message: "FE BDD test has Requirement metadata but no Covers metadata, so it does not cover an AC.",
        location: { file: test.file, line: test.line },
      })
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    frontEndRoot: repoRelative(frontEndRoot),
    pages,
    routes,
    stories,
    tests,
    apiCalls,
    textChannels,
    issues,
  }

  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`)
  console.log(
    `front-end.source-index.json: ${pages.length} page(s), ${routes.length} route(s), ${stories.length} story/stories, ${tests.length} BDD test(s), ${apiCalls.length} api call(s), ${issues.length} issue(s)`,
  )
}

main()
