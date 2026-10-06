import type { AppContext, HandheldApp } from "../apps/types.ts";
import type { Bridge } from "./bridge.ts";
import { isDirection, type Button } from "./buttons.ts";
import { focusables, focusFirst, moveFocus } from "./focus.ts";

/** Owns the one visible app and routes buttons to it. */
export class AppHost {
  private current: HandheldApp | null = null;
  private byId: Map<string, HandheldApp>;

  constructor(
    private root: HTMLElement,
    private bridge: Bridge,
    apps: HandheldApp[],
  ) {
    this.byId = new Map(apps.map((app) => [app.id, app]));
  }

  async open(appId: string): Promise<void> {
    const next = this.byId.get(appId);
    if (!next || next === this.current) return;

    this.current?.unmount?.();
    this.root.replaceChildren();
    this.root.dataset.app = next.id;
    this.current = next;

    const ctx: AppContext = { root: this.root, bridge: this.bridge, open: (id) => void this.open(id) };
    await next.mount(ctx);

    for (const el of focusables(this.root)) if (!el.hasAttribute("tabindex")) el.tabIndex = 0;
    focusFirst(this.root);
  }

  handle(button: Button): void {
    if (button === "home") {
      void this.open("launcher");
      return;
    }
    if (this.current?.onButton?.(button)) return;

    if (isDirection(button)) {
      moveFocus(this.root, button);
    } else if (button === "a") {
      (document.activeElement as HTMLElement | null)?.click();
    } else if (button === "b" && this.current?.id !== "launcher") {
      void this.open("launcher");
    }
  }
}
