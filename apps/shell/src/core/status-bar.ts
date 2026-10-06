import type { Bridge } from "./bridge.ts";

export function mountStatusBar(root: HTMLElement, bridge: Bridge): void {
  root.innerHTML = `
    <span class="status-clock"></span>
    <span class="status-right">
      <span class="status-wifi"></span>
      <span class="status-battery"></span>
    </span>`;

  const clock = root.querySelector<HTMLElement>(".status-clock")!;
  const wifi = root.querySelector<HTMLElement>(".status-wifi")!;
  const battery = root.querySelector<HTMLElement>(".status-battery")!;

  const tick = () => {
    clock.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };
  tick();
  setInterval(tick, 10_000);

  bridge.onState((state) => {
    root.classList.toggle("is-offline", !state);
    if (!state) {
      wifi.textContent = "";
      battery.textContent = "No system link";
      return;
    }
    wifi.textContent = state.wifi.connected ? (state.wifi.ssid ?? "Wi-Fi") : "Offline";
    const { percent, charging } = state.battery;
    battery.textContent = percent === null ? "AC" : `${percent}%${charging ? " charging" : ""}`;
    battery.classList.toggle("is-low", percent !== null && percent <= 15 && !charging);
  });
}
