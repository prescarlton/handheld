import { useState } from "preact/hooks";
import { sendCommand, systemState } from "../../core/bridge.ts";
import { Group } from "../../ui/group.tsx";
import { Meter } from "../../ui/meter.tsx";
import { Row } from "../../ui/row.tsx";
import { RowButton } from "../../ui/row-button.tsx";
import { Note, Screen } from "../../ui/screen.tsx";
import { Switch } from "../../ui/switch.tsx";

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
  const batteryLow = battery.percent !== null && battery.percent <= 15 && !battery.charging;

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
    const result = await sendCommand({
      type: action === "shutdown" ? "power.shutdown" : "power.reboot",
    });
    if (!result.ok)
      setError(`Couldn't ${action === "shutdown" ? "shut down" : "restart"}: ${result.error}`);
  };

  // Moving focus off an armed row cancels it.
  const disarm = (action: PowerAction) => () => {
    if (armed === action) setArmed(null);
  };

  return (
    <Screen
      title="Settings"
      accessory={
        state.mock && (
          <span class="rounded-full bg-foreground/10 px-2 py-0.5 text-[0.7rem] text-muted">
            Simulated
          </span>
        )
      }
    >
      <Group label="Status">
        <Row
          label="Battery"
          footer={
            battery.percent !== null && (
              <Meter value={battery.percent} tone={batteryLow ? "danger" : "default"} />
            )
          }
        >
          {battery.percent === null ? (
            <span class="text-muted">No battery</span>
          ) : (
            <span class={batteryLow ? "text-danger" : undefined}>
              {battery.charging ? `Charging · ${battery.percent}%` : `${battery.percent}%`}
            </span>
          )}
        </Row>
        <Row label="Wi-Fi">
          {wifi.connected ? (
            <>
              {wifi.ssid ?? "Connected"}
              {wifi.signal !== null && <span class="ml-1.5 text-muted">{wifi.signal}%</span>}
            </>
          ) : (
            <span class="text-muted">Not connected</span>
          )}
        </Row>
      </Group>

      <Group label="Connections">
        <RowButton
          autofocus
          label="Bluetooth"
          detail={
            !bluetooth.powered
              ? "Off"
              : bluetooth.connected.length
                ? bluetooth.connected.join(", ")
                : "Nothing connected"
          }
          onClick={toggleBluetooth}
        >
          <Switch on={bluetooth.powered} />
        </RowButton>
      </Group>

      <Group label="Power">
        <RowButton
          label={armed === "reboot" ? "Press A again to restart" : "Restart"}
          tone={armed === "reboot" ? "danger" : "default"}
          onClick={() => power("reboot")}
          onBlur={disarm("reboot")}
        />
        <RowButton
          label={armed === "shutdown" ? "Press A again to shut down" : "Shut down"}
          tone={armed === "shutdown" ? "danger" : "default"}
          onClick={() => power("shutdown")}
          onBlur={disarm("shutdown")}
        />
      </Group>

      <Note>{error && <span class="text-danger">{error}</span>}</Note>
    </Screen>
  );
}
