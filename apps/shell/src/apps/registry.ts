import { Settings } from "./settings/settings.tsx";
import { Spotify } from "./spotify/spotify.tsx";
import type { HandheldApp } from "./types.ts";

/** Add new apps here. Order is launcher order. */
export const apps: HandheldApp[] = [
  { id: "spotify", name: "Spotify", blurb: "Play music on this device", component: Spotify },
  {
    id: "settings",
    name: "Settings",
    blurb: "Battery, Wi-Fi, Bluetooth, power",
    component: Settings,
  },
];
