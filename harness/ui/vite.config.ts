import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { handleHarnessApiRequest } from "./server/index";

const port = Number(process.env.HARNESS_UI_PORT ?? 5180);

export default defineConfig({
  plugins: [
    react(),
    {
      name: "harness-ui-api",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (!request.url?.startsWith("/api/")) {
            next();
            return;
          }
          void handleHarnessApiRequest(request, response);
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
