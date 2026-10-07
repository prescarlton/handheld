import type { ComponentChildren } from "preact";

/*
 * Rows are rounded-lg inside a rounded-xl card with p-1, so a focused row's ring
 * follows the card's curve with an even gap. Dividers are inset hairlines drawn on
 * each row after the first, hidden around a highlighted row so it reads as one pill.
 */
const card = [
  "flex flex-col rounded-xl bg-surface p-1",
  // Every row gets an out-of-flow ::before, so the hide rules below never add a flex item.
  "[&>*]:relative [&>*]:before:absolute",
  "[&>*+*]:before:inset-x-3 [&>*+*]:before:top-0 [&>*+*]:before:h-px [&>*+*]:before:bg-border [&>*+*]:before:content-['']",
  "[&>*:focus]:before:opacity-0 [&>*:focus+*]:before:opacity-0",
  "[&>[data-highlighted]]:before:opacity-0 [&>[data-highlighted]+*]:before:opacity-0",
].join(" ");

/** A labelled card of rows, separated by dividers. */
export function Group({ label, children }: { label: string; children: ComponentChildren }) {
  return (
    <section class="mb-4">
      <h2 class="mb-1.5 px-1 text-[0.7rem] text-muted uppercase tracking-wide">{label}</h2>
      <div class={card}>{children}</div>
    </section>
  );
}
