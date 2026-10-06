import { computed, signal } from "@preact/signals";
import { systemState } from "./bridge.ts";

const now = signal(new Date());
setInterval(() => (now.value = new Date()), 10_000);

// Passing signals straight into JSX updates just that text or attribute,
// so the status bar never re-renders as a whole.
const clockText = computed(() => now.value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));

const wifiText = computed(() => {
  const s = systemState.value;
  if (!s) return "";
  return s.wifi.connected ? (s.wifi.ssid ?? "Wi-Fi") : "Offline";
});

const batteryText = computed(() => {
  const s = systemState.value;
  if (!s) return "No system link";
  const { percent, charging } = s.battery;
  return percent === null ? "AC" : `${percent}%${charging ? " charging" : ""}`;
});

const batteryClass = computed(() => {
  const s = systemState.value;
  const low = !s || (s.battery.percent !== null && s.battery.percent <= 15 && !s.battery.charging);
  return low ? "text-warn" : "text-silk";
});

export function StatusBar() {
  return (
    <header aria-label="Device status" class="flex items-center justify-between bg-mask-deep px-3 py-1.5 text-[0.8rem] tabular-nums">
      <span>{clockText}</span>
      <span class="flex gap-3 text-trace">
        <span>{wifiText}</span>
        <span class={batteryClass}>{batteryText}</span>
      </span>
    </header>
  );
}
