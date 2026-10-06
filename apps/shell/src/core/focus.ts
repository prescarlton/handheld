import type { Direction } from "./buttons.ts";

/**
 * D-pad navigation works on real DOM focus, independent of Preact.
 * Mark anything selectable with `data-focusable`. Buttons and links are focusable
 * already; give other elements `tabIndex={0}` as well.
 */
const FOCUSABLE = "[data-focusable]:not([disabled])";

export function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null,
  );
}

export function focusFirst(root: HTMLElement): void {
  const preferred = root.querySelector<HTMLElement>("[data-autofocus]:not([disabled])");
  (preferred ?? focusables(root)[0])?.focus();
}

/** Move to the nearest focusable element in the pressed direction. */
export function moveFocus(root: HTMLElement, direction: Direction): boolean {
  const items = focusables(root);
  const current = document.activeElement as HTMLElement | null;
  if (!current || !items.includes(current)) {
    items[0]?.focus();
    return Boolean(items[0]);
  }

  const from = center(current.getBoundingClientRect());
  let best: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const item of items) {
    if (item === current) continue;
    const to = center(item.getBoundingClientRect());
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    const primary =
      direction === "up" ? -dy : direction === "down" ? dy : direction === "left" ? -dx : dx;
    if (primary <= 1) continue;
    const secondary = direction === "up" || direction === "down" ? Math.abs(dx) : Math.abs(dy);

    // Weight sideways drift so straight lines win over diagonals.
    const score = primary + secondary * 2;
    if (score < bestScore) {
      bestScore = score;
      best = item;
    }
  }

  if (best) {
    best.focus();
    best.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  return Boolean(best);
}

function center(rect: DOMRect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
