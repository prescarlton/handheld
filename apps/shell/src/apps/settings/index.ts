import type { SystemState } from "@handheld/protocol";
import type { HandheldApp } from "../types.ts";

let unsubscribe: (() => void) | null = null;

export const settings: HandheldApp = {
  id: "settings",
  name: "Settings",
  blurb: "Battery, Wi-Fi, Bluetooth, power",
  mount({ root, bridge }) {
    root.innerHTML = `
      <section class="screen">
        <h1 class="screen-title">Settings</h1>
        <dl class="facts">
          <div><dt>Battery</dt><dd data-field="battery">–</dd></div>
          <div><dt>Wi-Fi</dt><dd data-field="wifi">–</dd></div>
          <div><dt>Bluetooth</dt><dd data-field="bluetooth">–</dd></div>
        </dl>
        <div class="actions">
          <button class="action" data-focusable data-autofocus data-action="bt">Turn Bluetooth off</button>
          <button class="action" data-focusable data-action="reboot">Restart</button>
          <button class="action" data-focusable data-action="shutdown">Shut down</button>
        </div>
        <p class="screen-note" data-field="note"></p>
      </section>`;

    const field = (name: string) => root.querySelector<HTMLElement>(`[data-field="${name}"]`)!;
    const btButton = root.querySelector<HTMLButtonElement>('[data-action="bt"]')!;
    const note = field("note");
    let armed: string | null = null;

    const render = (state: SystemState | null) => {
      if (!state) {
        note.textContent = "Can't reach the system service. Check that handheld-daemon is running.";
        return;
      }
      const { battery, wifi, bluetooth } = state;
      field("battery").textContent =
        battery.percent === null ? "No battery found" : `${battery.percent}%${battery.charging ? ", charging" : ""}`;
      field("wifi").textContent = wifi.connected ? `${wifi.ssid ?? "Connected"} (${wifi.signal ?? "?"}%)` : "Not connected";
      field("bluetooth").textContent = !bluetooth.powered
        ? "Off"
        : bluetooth.connected.length
          ? bluetooth.connected.join(", ")
          : "On, nothing connected";
      btButton.textContent = bluetooth.powered ? "Turn Bluetooth off" : "Turn Bluetooth on";
      btButton.dataset.on = String(bluetooth.powered);
      if (!armed) note.textContent = state.mock ? "Showing simulated hardware." : "";
    };
    unsubscribe = bridge.onState(render);

    root.querySelector(".actions")!.addEventListener("click", async (event) => {
      const action = (event.target as HTMLElement).closest<HTMLElement>("[data-action]")?.dataset.action;
      if (!action) return;

      if (action === "bt") {
        armed = null;
        const result = await bridge.send({ type: "bluetooth.setPowered", on: btButton.dataset.on !== "true" });
        if (!result.ok) note.textContent = `Bluetooth didn't change: ${result.error}`;
        return;
      }

      // Power actions need a second press so a stray A doesn't turn the device off.
      if (armed !== action) {
        armed = action;
        note.textContent = action === "shutdown" ? "Press A again to shut down." : "Press A again to restart.";
        return;
      }
      armed = null;
      const result = await bridge.send({ type: action === "shutdown" ? "power.shutdown" : "power.reboot" });
      if (!result.ok) note.textContent = `Couldn't ${action === "shutdown" ? "shut down" : "restart"}: ${result.error}`;
    });
  },
  unmount() {
    unsubscribe?.();
    unsubscribe = null;
  },
};
