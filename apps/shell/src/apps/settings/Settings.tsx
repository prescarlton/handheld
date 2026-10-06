import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import { sendCommand, systemState } from "../../core/bridge.ts";
import { Action } from "../../ui/Action.tsx";
import { Note, Screen } from "../../ui/Screen.tsx";

type PowerAction = "shutdown" | "reboot";

export function Settings() {
  const state = systemState.value;
  const [armed, setArmed] = useState<PowerAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!state) {
    return (
      <Screen title="Settings">
        <Note>Can't reach the system service. Check that handheld-daemon is running.</Note>
      </Screen>
    );
  }

  const { battery, wifi, bluetooth } = state;

  const toggleBluetooth = async () => {
    setArmed(null);
    const result = await sendCommand({ type: "bluetooth.setPowered", on: !bluetooth.powered });
    setError(result.ok ? null : `Bluetooth didn't change: ${result.error}`);
  };

  // Power actions need a second press so a stray A doesn't turn the device off.
  const power = async (action: PowerAction) => {
    setError(null);
    if (armed !== action) {
      setArmed(action);
      return;
    }
    setArmed(null);
    const result = await sendCommand({ type: action === "shutdown" ? "power.shutdown" : "power.reboot" });
    if (!result.ok) setError(`Couldn't ${action === "shutdown" ? "shut down" : "restart"}: ${result.error}`);
  };

  const note =
    error ??
    (armed === "shutdown"
      ? "Press A again to shut down."
      : armed === "reboot"
        ? "Press A again to restart."
        : state.mock
          ? "Showing simulated hardware."
          : "");

  return (
    <Screen title="Settings">
      <dl class="mb-3 grid gap-1.5">
        <Fact label="Battery">
          {battery.percent === null ? "No battery found" : `${battery.percent}%${battery.charging ? ", charging" : ""}`}
        </Fact>
        <Fact label="Wi-Fi">
          {wifi.connected ? `${wifi.ssid ?? "Connected"} (${wifi.signal ?? "?"}%)` : "Not connected"}
        </Fact>
        <Fact label="Bluetooth">
          {!bluetooth.powered ? "Off" : bluetooth.connected.length ? bluetooth.connected.join(", ") : "On, nothing connected"}
        </Fact>
      </dl>

      <div class="flex flex-wrap gap-1.5">
        <Action autofocus onClick={toggleBluetooth}>
          {bluetooth.powered ? "Turn Bluetooth off" : "Turn Bluetooth on"}
        </Action>
        <Action onClick={() => power("reboot")}>Restart</Action>
        <Action onClick={() => power("shutdown")}>Shut down</Action>
      </div>

      <Note>{note}</Note>
    </Screen>
  );
}

function Fact({ label, children }: { label: string; children: ComponentChildren }) {
  return (
    <div class="flex justify-between gap-3">
      <dt class="text-trace">{label}</dt>
      <dd class="text-right">{children}</dd>
    </div>
  );
}
