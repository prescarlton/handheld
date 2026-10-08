import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SpotifyStatus } from "@handheld/protocol";

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
export const WEB_API = "https://api.spotify.com/v1";

const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
].join(" ");

/** How long a started sign-in stays valid. */
const PENDING_TTL_MS = 10 * 60_000;
/** Refresh this long before the access token actually expires. */
const EXPIRY_MARGIN_MS = 60_000;

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms. */
  expiresAt: number;
  user: string | null;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export interface SpotifyAuthOptions {
  clientId: string | undefined;
  redirectUri: string;
  stateDir: string;
}

/**
 * Authorization Code + PKCE, kept in the daemon so tokens never reach the browser.
 * The session (including the rotating refresh token) is saved to `<stateDir>/spotify.json`.
 */
export class SpotifyAuth {
  private session: StoredSession | null = null;
  private pending = new Map<string, { verifier: string; createdAt: number }>();
  private refreshing: Promise<string> | null = null;
  private listeners = new Set<(status: SpotifyStatus) => void>();
  private readonly file: string;

  constructor(private readonly options: SpotifyAuthOptions) {
    this.file = join(options.stateDir, "spotify.json");
  }

  get configured(): boolean {
    return Boolean(this.options.clientId);
  }

  async load(): Promise<void> {
    try {
      this.session = JSON.parse(await readFile(this.file, "utf8")) as StoredSession;
    } catch {
      this.session = null;
    }
  }

  status(): SpotifyStatus {
    return {
      configured: this.configured,
      signedIn: this.session !== null,
      user: this.session?.user ?? null,
    };
  }

  onChange(listener: (status: SpotifyStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Starts a sign-in and returns the Spotify URL to send the browser to. */
  loginUrl(): string {
    const clientId = this.requireClientId();
    const now = Date.now();
    for (const [key, entry] of this.pending) {
      if (now - entry.createdAt > PENDING_TTL_MS) this.pending.delete(key);
    }

    const verifier = randomBytes(32).toString("base64url");
    const state = randomBytes(16).toString("base64url");
    this.pending.set(state, { verifier, createdAt: now });

    const url = new URL(AUTHORIZE_URL);
    url.search = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: this.options.redirectUri,
      code_challenge_method: "S256",
      code_challenge: createHash("sha256").update(verifier).digest().toString("base64url"),
      state,
      scope: SCOPES,
    }).toString();
    return url.toString();
  }

  /** Finishes a sign-in with the code Spotify redirected back with. Returns the display name. */
  async handleCallback(code: string, state: string): Promise<string | null> {
    const entry = this.pending.get(state);
    this.pending.delete(state);
    if (!entry || Date.now() - entry.createdAt > PENDING_TTL_MS) {
      throw new Error("This sign-in link expired or was already used. Start again.");
    }

    const token = await this.tokenRequest({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.options.redirectUri,
      code_verifier: entry.verifier,
    });
    if (!token.refresh_token) throw new Error("Spotify didn't return a refresh token");

    const user = await fetchDisplayName(token.access_token);
    await this.save({
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: Date.now() + token.expires_in * 1000,
      user,
    });
    return user;
  }

  /** A valid access token, refreshing first if needed. Null when signed out. */
  async accessToken({ forceRefresh = false } = {}): Promise<string | null> {
    const session = this.session;
    if (!session) return null;
    if (!forceRefresh && session.expiresAt - EXPIRY_MARGIN_MS > Date.now()) {
      return session.accessToken;
    }
    // Concurrent callers share one refresh; refresh tokens rotate, so a second one would fail.
    this.refreshing ??= this.refresh(session).finally(() => {
      this.refreshing = null;
    });
    try {
      return await this.refreshing;
    } catch (err) {
      if (err instanceof RevokedError) return null;
      throw err;
    }
  }

  async signOut(): Promise<void> {
    this.session = null;
    await rm(this.file, { force: true });
    this.emit();
  }

  private async refresh(session: StoredSession): Promise<string> {
    let token: TokenResponse;
    try {
      token = await this.tokenRequest({
        grant_type: "refresh_token",
        refresh_token: session.refreshToken,
      });
    } catch (err) {
      if (err instanceof TokenError && err.code === "invalid_grant") {
        // Revoked in Spotify account settings, or the app's access was removed.
        await this.signOut();
        throw new RevokedError();
      }
      throw err;
    }
    await this.save({
      ...session,
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? session.refreshToken,
      expiresAt: Date.now() + token.expires_in * 1000,
    });
    return token.access_token;
  }

  private async tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: this.requireClientId(), ...params }),
    });
    const body = (await res.json().catch(() => ({}))) as Partial<TokenResponse> & {
      error?: string;
      error_description?: string;
    };
    if (!res.ok || !body.access_token || !body.expires_in) {
      throw new TokenError(
        body.error ?? `http_${res.status}`,
        body.error_description ?? body.error ?? `Token request failed (${res.status})`,
      );
    }
    return body as TokenResponse;
  }

  private async save(session: StoredSession): Promise<void> {
    const changed = this.session?.user !== session.user || this.session === null;
    this.session = session;
    await mkdir(this.options.stateDir, { recursive: true, mode: 0o700 });
    const tmp = `${this.file}.tmp`;
    await writeFile(tmp, JSON.stringify(session, null, 2), { mode: 0o600 });
    await rename(tmp, this.file);
    if (changed) this.emit();
  }

  private emit(): void {
    const status = this.status();
    for (const listener of this.listeners) listener(status);
  }

  private requireClientId(): string {
    if (!this.options.clientId) throw new Error("SPOTIFY_CLIENT_ID isn't set");
    return this.options.clientId;
  }
}

class TokenError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

class RevokedError extends Error {}

async function fetchDisplayName(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${WEB_API}/me`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const me = (await res.json()) as { display_name?: string | null; id?: string };
    return me.display_name ?? me.id ?? null;
  } catch {
    return null;
  }
}
