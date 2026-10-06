import { defineConfig } from "vite";

const DAEMON = `http://127.0.0.1:${process.env.HANDHELD_PORT ?? 7777}`;

export default defineConfig({
  server: {
    port: 5173,
    proxy: { "/api": { target: DAEMON, changeOrigin: true } },
  },
  build: {
    // WPE WebKit is a modern engine; no need for legacy transforms.
    target: "safari16",
    outDir: "dist",
    emptyOutDir: true,
  },
});
