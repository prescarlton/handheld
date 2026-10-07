import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Point at the CM4's daemon for live-reload-on-device: HANDHELD_DAEMON=http://handheld.local:7777
const DAEMON =
  process.env.HANDHELD_DAEMON ?? `http://127.0.0.1:${process.env.HANDHELD_PORT ?? 7777}`;

export default defineConfig({
  plugins: [preact(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { "/api": { target: DAEMON, changeOrigin: true } },
  },
  build: {
    target: "safari16",
    outDir: "dist",
    emptyOutDir: true,
  },
});
