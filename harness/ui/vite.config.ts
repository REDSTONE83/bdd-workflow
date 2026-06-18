import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const port = Number(process.env.HARNESS_UI_PORT ?? 5180);

export default defineConfig({
  plugins: [react()],
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
