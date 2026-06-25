import path from "node:path";
import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // JUnit 출력 경로. 예전에는 셸의 ${VAR:-default}로 넘겼으나 Windows cmd가 해석하지 못해
      // 설정에서 직접 읽는다. 러너(run.mjs)가 STORYBOOK_JUNIT_FILE을 절대경로로 주입한다.
      outputFile: {
        junit: process.env.STORYBOOK_JUNIT_FILE ?? "test-results/storybook-junit.xml",
      },
      projects: [
        {
          test: {
            name: "unit",
            include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
            environment: "node",
          },
        },
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(dirname, ".storybook"),
              storybookScript: "npm run storybook -- --ci",
              storybookUrl: "http://127.0.0.1:6007",
              tags: {
                include: ["test"],
              },
            }),
          ],
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({}),
              instances: [{ browser: "chromium" }],
            },
          },
        },
      ],
    },
  }),
);
