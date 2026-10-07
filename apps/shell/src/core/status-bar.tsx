import { computed, signal } from "@preact/signals";
import clsx from "clsx";
import { systemState } from "./bridge.ts";

const now = signal(new Date());
setInterval(() => (now.value = new Date()), 10_000);

// Passing signals straight into JSX updates just that text or attribute,
// so the status bar never re-renders as a whole.
const clockText = computed(() =>
  now.value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
);

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
  return clsx("font-mono", low ? "text-danger" : "text-foreground");
});

export function StatusBar() {
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: a top-level <header> is a banner landmark, which can be labelled
    <header
      aria-label="Device status"
      class="flex items-center justify-between px-3 py-1.5 text-[0.8rem] tabular-nums"
    >
      <span class="font-mono">{clockText}</span>
      <span class="flex gap-3 text-muted">
        <span>{wifiText}</span>
        <span class={batteryClass}>{batteryText}</span>
      </span>
    </header>
  );
}
