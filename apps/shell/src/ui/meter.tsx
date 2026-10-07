import clsx from "clsx";

/** Thin horizontal bar showing 0–100. */
export function Meter({ value, tone = "default" }: { value: number; tone?: "default" | "danger" }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div class="h-1 overflow-hidden rounded-full bg-foreground/10">
      <div
        class={clsx("h-full rounded-full", tone === "danger" ? "bg-danger" : "bg-foreground")}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
