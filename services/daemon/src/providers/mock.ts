import type { Command, CommandResult, SystemState } from "@handheld/protocol";
import type { SystemProvider } from "./types.ts";

/** Fake hardware for working on the shell from a laptop. Battery slowly drains/charges. */
export class MockProvider implements SystemProvider {
  readonly mock = true;
  private percent = 82;
  private charging = false;
  private btPowered = true;

  async read(): Promise<SystemState> {
    this.percent += this.charging ? 1 : -1;
    if (this.percent <= 15) this.charging = true;
    if (this.percent >= 100) this.charging = false;

    return {
      battery: { percent: this.percent, charging: this.charging },
      wifi: { connected: true, ssid: "dev-network", signal: 70 },
      bluetooth: { powered: this.btPowered, connected: this.btPowered ? ["Headphones"] : [] },
      mock: true,
    };
  }

  async run(command: Command): Promise<CommandResult> {
    switch (command.type) {
      case "bluetooth.setPowered":
        this.btPowered = command.on;
        return { ok: true };
      case "power.shutdown":
      case "power.reboot":
        console.log(`[mock] would run ${command.type}`);
        return { ok: true };
    }
  }
}
