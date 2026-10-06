import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { promisify } from "node:util";
import type { BatteryState, BluetoothState, Command, CommandResult, SystemState, WifiState } from "@handheld/protocol";
import type { SystemProvider } from "./types.ts";

const exec = promisify(execFile);
const POWER_SUPPLY = "/sys/class/power_supply";

/**
 * Real device provider for a Linux SBC.
 * - Battery: /sys/class/power_supply (works with most fuel-gauge drivers)
 * - Wi-Fi:   nmcli (NetworkManager)
 * - BT:      bluetoothctl (BlueZ)
 * Swap any of these out once the hardware is settled.
 */
export class LinuxProvider implements SystemProvider {
  readonly mock = false;

  async read(): Promise<SystemState> {
    const [battery, wifi, bluetooth] = await Promise.all([
      this.readBattery(),
      this.readWifi(),
      this.readBluetooth(),
    ]);
    return { battery, wifi, bluetooth, mock: false };
  }

  async run(command: Command): Promise<CommandResult> {
    try {
      switch (command.type) {
        case "power.shutdown":
          await exec("systemctl", ["poweroff"]);
          break;
        case "power.reboot":
          await exec("systemctl", ["reboot"]);
          break;
        case "bluetooth.setPowered":
          await exec("bluetoothctl", ["power", command.on ? "on" : "off"]);
          break;
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  private async readBattery(): Promise<BatteryState> {
    try {
      const supplies = await readdir(POWER_SUPPLY);
      for (const name of supplies) {
        const type = (await readSys(`${POWER_SUPPLY}/${name}/type`)) ?? "";
        if (type !== "Battery") continue;
        const capacity = await readSys(`${POWER_SUPPLY}/${name}/capacity`);
        const status = await readSys(`${POWER_SUPPLY}/${name}/status`);
        return {
          percent: capacity ? Number(capacity) : null,
          charging: status === "Charging" || status === "Full",
        };
      }
    } catch {
      // fall through
    }
    return { percent: null, charging: false };
  }

  private async readWifi(): Promise<WifiState> {
    try {
      const { stdout } = await exec("nmcli", ["-t", "-f", "ACTIVE,SSID,SIGNAL", "dev", "wifi"]);
      const active = stdout.split("\n").find((line) => line.startsWith("yes:"));
      if (!active) return { connected: false, ssid: null, signal: null };
      // SSIDs can contain escaped colons; signal is always the last field.
      const rest = active.slice(4);
      const sep = rest.lastIndexOf(":");
      return {
        connected: true,
        ssid: rest.slice(0, sep).replace(/\\:/g, ":") || null,
        signal: Number(rest.slice(sep + 1)) || null,
      };
    } catch {
      return { connected: false, ssid: null, signal: null };
    }
  }

  private async readBluetooth(): Promise<BluetoothState> {
    try {
      const { stdout: show } = await exec("bluetoothctl", ["show"]);
      const powered = /Powered:\s+yes/.test(show);
      if (!powered) return { powered, connected: [] };
      const { stdout: devices } = await exec("bluetoothctl", ["devices", "Connected"]);
      const connected = devices
        .split("\n")
        .map((line) => line.match(/^Device\s+\S+\s+(.+)$/)?.[1])
        .filter((name): name is string => Boolean(name));
      return { powered, connected };
    } catch {
      return { powered: false, connected: [] };
    }
  }
}

async function readSys(path: string): Promise<string | null> {
  try {
    return (await readFile(path, "utf8")).trim();
  } catch {
    return null;
  }
}
