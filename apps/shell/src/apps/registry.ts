import type { HandheldApp } from "./types.ts";
import { settings } from "./settings/index.ts";
import { spotify } from "./spotify/index.ts";

/** Add new apps here. Order is launcher order. */
export const apps: HandheldApp[] = [spotify, settings];
