#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync } from "node:fs"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const defaultFrontEndRoot = resolve(scriptDir, "..")
const workspaceRoot = resolve(defaultFrontEndRoot, "..", "..")

const DEFAULT_OPENAPI_INDEX = resolve(
  workspaceRoot,
  "build/app/indexes/openapi.index.json",
)
const DEFAULT_OUT_DIR = resolve(defaultFrontEndRoot, "src/api/generated")

function parseArgs(argv) {
  const options = {
    check: false,
    frontEndRoot: defaultFrontEndRoot,
    openapiIndex: DEFAULT_OPENAPI_INDEX,
    outDir: DEFAULT_OUT_DIR,
  }

  for (const arg of argv) {
    if (arg === "--check") {
      options.check = true
    } else if (arg.startsWith("--front-end-root=")) {
      options.frontEndRoot = resolve(arg.slice("--front-end-root=".length))
      options.outDir = resolve(options.frontEndRoot, "src/api/generated")
    } else if (arg.startsWith("--openapi-index=")) {
      options.openapiIndex = resolve(arg.slice("--openapi-index=".length))
    } else if (arg.startsWith("--out-dir=")) {
      options.outDir = resolve(arg.slice("--out-dir=".length))
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return options
}

function assertGeneratedBoundary(frontEndRoot, outDir) {
  const rel = relative(frontEndRoot, outDir)
  if (rel.startsWith("..") || rel === "" || rel.split(/[\\/]/).includes("..")) {
    throw new Error(`Output directory must be inside front-end: ${outDir}`)
  }
  if (relative(resolve(frontEndRoot, "src/api/generated"), outDir) !== "") {
    throw new Error("Output directory must be app/front-end/src/api/generated")
  }
}

async function readOpenApiIndex(openapiIndexPath) {
  const raw = await readFile(openapiIndexPath, "utf8")
  const parsed = JSON.parse(raw)

  if (!parsed.rawOpenApi || typeof parsed.rawOpenApi !== "object") {
    throw new Error(`OpenAPI index does not contain rawOpenApi: ${openapiIndexPath}`)
  }
  if (typeof parsed.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(parsed.sha256)) {
    throw new Error(`OpenAPI index does not contain canonical sha256: ${openapiIndexPath}`)
  }

  return parsed
}

async function generateSchema(rawOpenApi, schemaOutputPath) {
  const tempDir = mkdtempSync(join(tmpdir(), "bdd-openapi-"))
  try {
    const inputPath = join(tempDir, "openapi.json")
    await writeFile(inputPath, JSON.stringify(rawOpenApi, null, 2) + "\n")

    const cli = resolve(defaultFrontEndRoot, "node_modules/.bin/openapi-typescript")
    const result = spawnSync(cli, [inputPath, "--output", schemaOutputPath], {
      cwd: defaultFrontEndRoot,
      encoding: "utf8",
    })

    if (result.status !== 0) {
      throw new Error(
        [
          "openapi-typescript failed",
          result.stdout.trim(),
          result.stderr.trim(),
        ]
          .filter(Boolean)
          .join("\n"),
      )
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value))
}

function jsonNullableWireSchema(name) {
  if (name === "JsonNullableString") {
    return { type: "string", nullable: true }
  }
  if (name === "JsonNullableInteger") {
    return { type: "integer", format: "int32", nullable: true }
  }
  if (name === "JsonNullableBoolean") {
    return { type: "boolean", nullable: true }
  }
  if (name === "JsonNullableUUID") {
    return { type: "string", format: "uuid", nullable: true }
  }
  if (name === "JsonNullableLocalDate") {
    return { type: "string", format: "date", nullable: true }
  }
  if (name === "JsonNullablePriority") {
    return {
      type: "string",
      enum: ["HIGH", "MEDIUM", "LOW"],
      nullable: true,
    }
  }
  return null
}

function pageableQueryParameters(pageableSchema) {
  const properties = pageableSchema?.properties ?? {}
  return ["page", "size", "sort"].map((name) => ({
    name,
    in: "query",
    required: false,
    schema: cloneJson(properties[name] ?? { type: "string" }),
    ...(name === "sort" ? { style: "form", explode: true } : {}),
  }))
}

function isPageableQueryParameter(parameter) {
  return (
    parameter?.in === "query" &&
    parameter?.name === "pageable" &&
    parameter?.schema?.$ref === "#/components/schemas/Pageable"
  )
}

function overlayWireOpenApi(rawOpenApi) {
  const openApi = cloneJson(rawOpenApi)
  const schemas = openApi.components?.schemas ?? {}
  for (const name of Object.keys(schemas)) {
    const wireSchema = jsonNullableWireSchema(name)
    if (wireSchema) {
      schemas[name] = wireSchema
    }
  }

  const pageableSchema = schemas.Pageable
  for (const pathItem of Object.values(openApi.paths ?? {})) {
    for (const operation of Object.values(pathItem ?? {})) {
      if (!operation || typeof operation !== "object" || !Array.isArray(operation.parameters)) {
        continue
      }
      operation.parameters = operation.parameters.flatMap((parameter) =>
        isPageableQueryParameter(parameter)
          ? pageableQueryParameters(pageableSchema)
          : [parameter],
      )
    }
  }

  return openApi
}

function clientSource() {
  return `// Generated by tools/generate-api-client.mjs. Do not edit by hand.

import createClient from "openapi-fetch"
import type { paths } from "./schema"

export const apiClient = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
})

export type ApiClient = typeof apiClient
export type { components, operations, paths } from "./schema"
`
}

function indexSource() {
  return `// Generated by tools/generate-api-client.mjs. Do not edit by hand.

export { apiClient } from "./client"
export type { ApiClient, components, operations, paths } from "./client"
`
}

async function readOptional(path) {
  try {
    return await readFile(path, "utf8")
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null
    }
    throw error
  }
}

async function materialize({ frontEndRoot, openapiIndex, outDir, check }) {
  assertGeneratedBoundary(frontEndRoot, outDir)
  const index = await readOpenApiIndex(openapiIndex)
  await mkdir(outDir, { recursive: true })

  const tempDir = mkdtempSync(join(tmpdir(), "bdd-api-client-"))
  const schemaFileName = "schema.d.ts"
  const legacySchemaFileName = "schema.ts"
  const schemaPath = check ? join(tempDir, schemaFileName) : resolve(outDir, schemaFileName)
  try {
    await generateSchema(overlayWireOpenApi(index.rawOpenApi), schemaPath)
    const schema = await readFile(schemaPath, "utf8")
    const expected = new Map([
      [schemaFileName, schema],
      ["client.ts", clientSource()],
      ["index.ts", indexSource()],
      [".openapi-source.sha256", `${index.sha256}\n`],
    ])

    if (check) {
      const mismatches = []
      for (const [fileName, content] of expected) {
        const current = await readOptional(resolve(outDir, fileName))
        if (current !== content) {
          mismatches.push(fileName)
        }
      }
      if ((await readOptional(resolve(outDir, legacySchemaFileName))) !== null) {
        mismatches.push(legacySchemaFileName)
      }
      if (mismatches.length > 0) {
        throw new Error(
          `Generated API client is out of date: ${mismatches.join(", ")}. Run npm run api:generate.`,
        )
      }
      return
    }

    await rm(resolve(outDir, legacySchemaFileName), { force: true })
    for (const [fileName, content] of expected) {
      await writeFile(resolve(outDir, fileName), content)
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

try {
  await materialize(parseArgs(process.argv.slice(2)))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
