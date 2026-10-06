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

export type DaemonEvent =
  | { type: "system"; state: SystemState }
  | { type: "log"; level: "info" | "warn" | "error"; message: string };

export type Command =
  | { type: "power.shutdown" }
  | { type: "power.reboot" }
  | { type: "bluetooth.setPowered"; on: boolean };

export type CommandResult = { ok: true } | { ok: false; error: string };
