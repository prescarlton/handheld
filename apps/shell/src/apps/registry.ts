import type { HandheldApp } from "./types.ts";
import { Settings } from "./settings/Settings.tsx";
import { Spotify } from "./spotify/Spotify.tsx";

/** Add new apps here. Order is launcher order. */
export const apps: HandheldApp[] = [
  { id: "spotify", name: "Spotify", blurb: "Play music on this device", component: Spotify },
  { id: "settings", name: "Settings", blurb: "Battery, Wi-Fi, Bluetooth, power", component: Settings },
];
