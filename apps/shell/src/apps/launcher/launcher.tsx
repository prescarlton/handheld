import { computed, signal } from "@preact/signals";
import { openApp } from "../../core/navigation.ts";
import { apps } from "../registry.ts";

const now = signal(new Date());
setInterval(() => (now.value = new Date()), 10_000);

const clockText = computed(() =>
  now.value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M/i, ""),
);
const todayText = computed(() =>
  now.value.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  }),
);

export function Launcher() {
  return (
    <section class="mt-4">
      <div>
        <h1 class="font-bold font-mono text-8xl">{clockText}</h1>
        <h2 class="mb-8 font-mono text-xl">{todayText}</h2>
      </div>
      <div class="mb-8 flex h-24 items-center rounded-xl bg-surface p-3">
        {/* placeholder for album cover */}
        <div class="flex size-18 items-center justify-center rounded-lg bg-foreground/10 font-medium text-foreground" />
        <div class="ml-4 flex flex-col justify-center">
          <span class="font-medium text-foreground/50">Nothing playing</span>
          <span class="text-foreground/50 text-sm">—</span>
          <span class="text-foreground/50 text-sm">—</span>
        </div>
        {/* placeholder for play / pause button */}
        <div class="ml-auto flex h-12 w-12 items-center justify-center rounded-lg bg-foreground/10 font-medium text-foreground" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        {apps.map((app, i) => (
          <button
            data-focusable
            data-autofocus={i === 0 ? "" : undefined}
            key={app.id}
            class={`flex flex-col items-start gap-2 rounded-xl border border-border bg-foreground/10 p-4 font-medium text-foreground transition hover:bg-foreground/20 focus:bg-foreground/20`}
            onClick={() => openApp(app.id)}
            type="button"
            tabindex={i + 1}
          >
            <img src={app.icon} alt="" class="h-12 w-12" />
            <span>{app.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
