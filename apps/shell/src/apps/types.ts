import type { Button } from "../core/buttons.ts";
import type { Bridge } from "../core/bridge.ts";

export interface AppContext {
  /** The element this app owns. Cleared by the host on unmount. */
  root: HTMLElement;
  bridge: Bridge;
  /** Open another app by id ("launcher" returns home). */
  open(appId: string): void;
}

export interface HandheldApp {
  id: string;
  name: string;
  /** One-line description shown in the launcher. */
  blurb: string;
  mount(ctx: AppContext): void | Promise<void>;
  /** Release timers, listeners, audio, etc. */
  unmount?(): void;
  /**
   * Return true if the app handled the button. Unhandled buttons fall back to
   * the host: d-pad moves focus, A activates, B goes back, Home goes home.
   */
  onButton?(button: Button): boolean;
}
