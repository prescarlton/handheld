/**
 * Every physical control maps to one of these. Apps never see raw key codes,
 * so changing the hardware (keyboard matrix, gpio-keys, USB gamepad) only touches this file.
 */
export type Button = "up" | "down" | "left" | "right" | "a" | "b" | "menu" | "home";
export type Direction = Extract<Button, "up" | "down" | "left" | "right">;

export const isDirection = (b: Button): b is Direction =>
  b === "up" || b === "down" || b === "left" || b === "right";

/** Keyboard mapping. Works on a laptop and with gpio-keys / HID buttons that emit key events. */
const KEYMAP: Record<string, Button> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Enter: "a",
  z: "a",
  Escape: "b",
  Backspace: "b",
  x: "b",
  m: "menu",
  ContextMenu: "menu",
  h: "home",
  Home: "home",
};

/** Standard Gamepad API layout indices. */
const PADMAP: Record<number, Button> = {
  12: "up",
  13: "down",
  14: "left",
  15: "right",
  0: "a",
  1: "b",
  9: "menu",
  16: "home",
};

type Listener = (button: Button) => void;

export class Input {
  private listeners = new Set<Listener>();
  private padState = new Map<string, boolean>();
  private polling = false;

  start(): void {
    window.addEventListener("keydown", (event) => {
      const button = KEYMAP[event.key];
      if (!button) return;
      // Let text fields keep their own arrow/backspace handling.
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea") && button !== "home") return;
      event.preventDefault();
      this.emit(button);
    });

    window.addEventListener("gamepadconnected", () => {
      if (this.polling) return;
      this.polling = true;
      this.pollPads();
    });
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(button: Button): void {
    for (const listener of this.listeners) listener(button);
  }

  private pollPads = (): void => {
    const pads = navigator.getGamepads?.() ?? [];
    let any = false;
    for (const pad of pads) {
      if (!pad) continue;
      any = true;
      for (const [index, button] of Object.entries(PADMAP)) {
        const pressed = pad.buttons[Number(index)]?.pressed ?? false;
        const key = `${pad.index}:${index}`;
        if (pressed && !this.padState.get(key)) this.emit(button);
        this.padState.set(key, pressed);
      }
    }
    if (any) requestAnimationFrame(this.pollPads);
    else this.polling = false;
  };
}
