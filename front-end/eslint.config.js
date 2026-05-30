import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"

import noRawPageRoute from "./tools/eslint-rules/no-raw-page-route.js"

export default tseslint.config(
  {
    ignores: [
      ".cache",
      "coverage",
      "dist",
      "playwright-report",
      "storybook-static",
      "test-results",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "bdd-workflow": {
        rules: {
          "no-raw-page-route": noRawPageRoute,
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],
    },
  },
  {
    files: ["tests/e2e/**/*.{ts,tsx}"],
    rules: {
      "bdd-workflow/no-raw-page-route": "error",
    },
  },
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
)
