import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DAEMON_PORT } from "@handheld/protocol";
import { LinuxProvider } from "./providers/linux.ts";
import { MockProvider } from "./providers/mock.ts";
import type { SystemProvider } from "./providers/types.ts";
import { startServer } from "./server.ts";
import { createStaticHandler } from "./static.ts";

const here = dirname(fileURLToPath(import.meta.url));
const useMock = process.env.HANDHELD_MOCK === "1" || process.platform !== "linux";
const port = Number(process.env.HANDHELD_PORT ?? DAEMON_PORT);
const host = process.env.HANDHELD_HOST ?? "127.0.0.1";
const shellDir = process.env.HANDHELD_SHELL_DIR ?? resolve(here, "../../../apps/shell/dist");

const provider: SystemProvider = useMock ? new MockProvider() : new LinuxProvider();

const { server, close } = startServer({
  provider,
  // On device the daemon also serves the built shell. In dev, Vite serves it instead.
  serveStatic: createStaticHandler(shellDir),
  pollMs: Number(process.env.HANDHELD_POLL_MS ?? 5000),
});

server.listen(port, host, () => {
  console.log(`handheld daemon on http://${host}:${port} (${provider.mock ? "mock" : "linux"} provider)`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    close();
    process.exit(0);
  });
}
