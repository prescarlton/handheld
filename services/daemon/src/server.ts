import { createServer, type ServerResponse } from "node:http";
import { API, type Command, type DaemonEvent, type SystemState } from "@handheld/protocol";
import type { SystemProvider } from "./providers/types.ts";
import type { SpotifyAuth } from "./spotify/auth.ts";
import { handleSpotify } from "./spotify/routes.ts";

interface ServerOptions {
  provider: SystemProvider;
  serveStatic?: (req: import("node:http").IncomingMessage, res: ServerResponse) => Promise<void>;
  pollMs: number;
  spotify?: SpotifyAuth;
}

export function startServer({ provider, serveStatic, pollMs, spotify }: ServerOptions) {
  const clients = new Set<ServerResponse>();
  let latest: SystemState | null = null;

  const broadcast = (event: DaemonEvent) => {
    const frame = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of clients) client.write(frame);
  };

  const poll = async () => {
    try {
      latest = await provider.read();
      broadcast({ type: "system", state: latest });
    } catch (err) {
      broadcast({ type: "log", level: "error", message: String(err) });
    }
  };

  void poll();
  const timer = setInterval(poll, pollMs);
  const stopSpotify = spotify?.onChange((status) => broadcast({ type: "spotify", status }));

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname === API.events && req.method === "GET") {
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      });
      res.write("retry: 2000\n\n");
      if (latest) res.write(`data: ${JSON.stringify({ type: "system", state: latest })}\n\n`);
      if (spotify) {
        res.write(`data: ${JSON.stringify({ type: "spotify", status: spotify.status() })}\n\n`);
      }
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }

    if (url.pathname === API.state && req.method === "GET") {
      latest ??= await provider.read();
      return json(res, 200, latest);
    }

    if (url.pathname === API.command && req.method === "POST") {
      let command: Command;
      try {
        command = JSON.parse(await readBody(req)) as Command;
      } catch {
        return json(res, 400, { ok: false, error: "Body must be a JSON command" });
      }
      const result = await provider.run(command);
      void poll(); // reflect changes right away
      return json(res, result.ok ? 200 : 500, result);
    }

    if (spotify && url.pathname.startsWith("/api/spotify/")) {
      if (await handleSpotify(spotify, req, res, url, readBody)) return;
    }

    if (url.pathname.startsWith("/api/"))
      return json(res, 404, { ok: false, error: "Unknown endpoint" });

    if (serveStatic) return serveStatic(req, res);
    res.writeHead(404).end();
  });

  return {
    server,
    close() {
      clearInterval(timer);
      stopSpotify?.();
      for (const client of clients) client.end();
      server.close();
    },
  };
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(body));
}

function readBody(req: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => {
      data += chunk;
      if (data.length > 64_000) reject(new Error("Body too large"));
    });
    req.on("end", () => resolveBody(data));
    req.on("error", reject);
  });
}
