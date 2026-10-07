import { signal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { type Button, isDirection } from "./buttons.ts";
import { moveFocus } from "./focus.ts";

/** Id of the visible app. "launcher" is home. */
export const currentAppId = signal("launcher");

export function openApp(id: string): void {
  currentAppId.value = id;
}

/** Leave the current app. Apps are one level deep, so this is always home. */
export function goBack(): void {
  openApp("launcher");
}

type ButtonHandler = (button: Button) => boolean;
const handlers: ButtonHandler[] = [];

/**
 * Take over buttons while the calling component is mounted (games, scrubbing,
 * on-screen keyboards). Return true for buttons you handle; the rest fall
 * through to the default d-pad / A / B behaviour. Latest-mounted handler wins.
 */
export function useButtons(handler: ButtonHandler): void {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    const entry: ButtonHandler = (button) => ref.current(button);
    handlers.push(entry);
    return () => {
      const index = handlers.indexOf(entry);
      if (index !== -1) handlers.splice(index, 1);
    };
  }, []);
}

/** Wired to Input in main.tsx. */
export function dispatchButton(button: Button, appRoot: HTMLElement | null): void {
  if (button === "home") {
    openApp("launcher");
    return;
  }

  for (let i = handlers.length - 1; i >= 0; i--) {
    if (handlers[i]?.(button)) return;
  }

  if (!appRoot) return;
  if (isDirection(button)) {
    moveFocus(appRoot, button);
  } else if (button === "a") {
    (document.activeElement as HTMLElement | null)?.click();
  } else if (button === "b" && currentAppId.value !== "launcher") {
    goBack();
  }
}
