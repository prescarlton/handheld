/**
 * Shared contract between the shell (UI in cog) and the system daemon.
 * The daemon pushes state over Server-Sent Events; the shell sends commands over POST.
 * Keep this file dependency-free so both sides can import it as-is.
 */

export const DAEMON_PORT = 7777;
export const API = {
  events: "/api/events",
  state: "/api/state",
  command: "/api/command",
  spotify: {
    /** Open in a browser to sign in. Redirects to Spotify, which redirects back to the daemon. */
    login: "/api/spotify/login",
    logout: "/api/spotify/logout",
    /** Spotify Web API proxy: `${web}/me/player` → https://api.spotify.com/v1/me/player. */
    web: "/api/spotify/web",
  },
} as const;

export interface BatteryState {
  /** 0–100, or null when no battery is detected (e.g. dev machine). */
  percent: number | null;
  charging: boolean;
}

export interface WifiState {
  connected: boolean;
  ssid: string | null;
  /** 0–100 signal quality, null when unknown. */
  signal: number | null;
}

export interface BluetoothState {
  powered: boolean;
  /** Display names of connected devices. */
  connected: string[];
}

export interface SystemState {
  battery: BatteryState;
  wifi: WifiState;
  bluetooth: BluetoothState;
  /** True when the daemon is running with mock providers. */
  mock: boolean;
}

export interface SpotifyStatus {
  /** False when the daemon has no SPOTIFY_CLIENT_ID. */
  configured: boolean;
  signedIn: boolean;
  /** Display name of the signed-in account. */
  user: string | null;
}

export type DaemonEvent =
  | { type: "system"; state: SystemState }
  | { type: "spotify"; status: SpotifyStatus }
  | { type: "log"; level: "info" | "warn" | "error"; message: string };

export type Command =
  | { type: "power.shutdown" }
  | { type: "power.reboot" }
  | { type: "bluetooth.setPowered"; on: boolean };

export type CommandResult = { ok: true } | { ok: false; error: string };
