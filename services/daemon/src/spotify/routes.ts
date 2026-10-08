import type { IncomingMessage, ServerResponse } from "node:http";
import { API } from "@handheld/protocol";
import { type SpotifyAuth, WEB_API } from "./auth.ts";

/**
 * Handles /api/spotify/*. Returns false for paths it doesn't own.
 * `readBody` is the server's capped body reader.
 */
export async function handleSpotify(
  auth: SpotifyAuth,
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  readBody: (req: IncomingMessage) => Promise<string>,
): Promise<boolean> {
  const path = url.pathname;

  if (path === API.spotify.login && req.method === "GET") {
    if (!auth.configured) {
      page(
        res,
        500,
        "Spotify isn't set up",
        "Set SPOTIFY_CLIENT_ID for the daemon, then restart it.",
      );
      return true;
    }
    res.writeHead(302, { location: auth.loginUrl(), "cache-control": "no-store" }).end();
    return true;
  }

  if (path === "/api/spotify/callback" && req.method === "GET") {
    const error = url.searchParams.get("error");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (error || !code || !state) {
      page(res, 400, "Sign-in cancelled", error ?? "Spotify didn't send a code back.");
      return true;
    }
    try {
      const user = await auth.handleCallback(code, state);
      page(
        res,
        200,
        user ? `Signed in as ${user}` : "Signed in",
        "You can close this tab. The handheld is ready.",
      );
    } catch (err) {
      page(res, 400, "Sign-in failed", err instanceof Error ? err.message : String(err));
    }
    return true;
  }

  if (path === API.spotify.logout && req.method === "POST") {
    await auth.signOut();
    json(res, 200, { ok: true });
    return true;
  }

  if (path === API.spotify.web || path.startsWith(`${API.spotify.web}/`)) {
    await proxy(auth, req, res, url, readBody);
    return true;
  }

  return false;
}

/** Forwards to the Web API with the bearer token added. Retries once after a 401. */
async function proxy(
  auth: SpotifyAuth,
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  readBody: (req: IncomingMessage) => Promise<string>,
) {
  const method = req.method ?? "GET";
  const target = `${WEB_API}${url.pathname.slice(API.spotify.web.length)}${url.search}`;
  const body = method === "GET" || method === "HEAD" ? undefined : await readBody(req);

  const send = (token: string) =>
    fetch(target, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body ? { "content-type": req.headers["content-type"] ?? "application/json" } : {}),
      },
      body: body || undefined,
    });

  try {
    let token = await auth.accessToken();
    if (!token) return json(res, 401, { error: "signed_out" });

    let upstream = await send(token);
    if (upstream.status === 401) {
      token = await auth.accessToken({ forceRefresh: true });
      if (!token) return json(res, 401, { error: "signed_out" });
      upstream = await send(token);
    }

    const headers: Record<string, string> = {};
    const type = upstream.headers.get("content-type");
    if (type) headers["content-type"] = type;
    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter) headers["retry-after"] = retryAfter;
    res.writeHead(upstream.status, headers).end(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    json(res, 502, { error: "upstream", message: String(err) });
  }
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(body));
}

function page(res: ServerResponse, status: number, title: string, message: string) {
  const html = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; background: #18181b; color: #fafafa; margin: 0;
         min-height: 100vh; display: grid; place-items: center; padding: 16px; box-sizing: border-box; }
  p { color: #a1a1aa; }
</style>
<main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></main>`;
  res.writeHead(status, { "content-type": "text/html; charset=utf-8" }).end(html);
}

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}
