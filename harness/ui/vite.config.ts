import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHarnessExpressApp } from "./server/index";

const port = Number(process.env.HARNESS_UI_PORT ?? 5180);
const dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(dirname, "..", "..").replace(/\\/g, "/");
process.env.VITE_WORKSPACE_ROOT ??= workspaceRoot;

export default defineConfig({
  plugins: [
    react(),
    {
      name: "harness-ui-api",
      configureServer(server) {
        const harnessApiApp = createHarnessExpressApp({ serveStatic: false });
        server.middlewares.use((request, response, next) => {
          if (!request.url?.startsWith("/api/")) {
            next();
            return;
          }
          // Express 앱은 Connect 미들웨어로 동작하지만 Vite 타입은 원시 req/res로 노출한다.
          (harnessApiApp as unknown as typeof server.middlewares)(request, response, next);
        });
      },
    },
  ],
  optimizeDeps: {
    include: ["storybook/test"],
  },
  server: {
    host: "127.0.0.1",
    port,
    strictPort: false,
  },
  preview: {
    host: "127.0.0.1",
    port,
  },
});
