import type { ComponentType } from "preact";

export interface HandheldApp {
  id: string;
  name: string;
  /** One line shown under the name in the launcher. */
  blurb: string;
  /** The app's screen. Unmounted when the user leaves the app. */
  component: ComponentType;
}
