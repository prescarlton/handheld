# Handheld

Software for the custom handheld: a TypeScript shell rendered full-screen by
[cog](https://github.com/Igalia/cog) (WPE WebKit), plus a small system daemon that
talks to the hardware. Apps — Spotify first — are modules inside the shell.

```
apps/shell/          UI that runs in cog. Preact + signals, Tailwind 4, Vite.
  src/core/          input mapping, d-pad focus, navigation, daemon bridge, status bar
  src/apps/          one folder per app (launcher, spotify, settings)
  src/ui/            shared components (Screen, Action)
services/daemon/     Node service: battery / Wi-Fi / Bluetooth / power, serves the built shell
  src/providers/     linux.ts (sysfs, nmcli, bluetoothctl) and mock.ts for laptop dev
packages/protocol/   shared types + endpoint names for shell ↔ daemon
system/              systemd units, polkit rule, env file, install + deploy scripts
```

## How the pieces talk

```
buttons ──► key/gamepad events ──► cog (WPE WebKit) ──► shell
                                                        │  GET  /api/events   (SSE: system state)
                                                        │  POST /api/command  (power, bluetooth…)
                                                        ▼
                                               daemon @ 127.0.0.1:7777 ──► sysfs / nmcli / bluetoothctl
```

The daemon has zero runtime dependencies (plain `node:http` + Server-Sent Events) and
is bundled into one file with esbuild, so startup on the device stays fast.

## Develop on your laptop

```sh
pnpm install
pnpm dev            # daemon with mock hardware on :7777 + Vite on :5173
```

Open http://localhost:5173. Controls: arrows = d-pad, Enter/Z = A, Esc/X = B,
H = Home, M = Menu. A USB gamepad works too.

## Run on the device

```sh
pnpm install && pnpm build
sudo ./system/scripts/install.sh      # first time
./system/scripts/deploy.sh user@host  # later, from your laptop
```

Needs Node 20+, cog, NetworkManager, BlueZ and polkit on the device. Settings live
in `/etc/handheld/handheld.env` (set `COG_PLATFORM=wl` if you run under a Wayland compositor).

## Adding an app

1. Create `apps/shell/src/apps/<name>/<Name>.tsx` exporting a component.
2. Add an entry to `apps` in `apps/shell/src/apps/registry.ts`.

Mark anything selectable with `data-focusable` (add `tabIndex={0}` if it isn't a button
or link) and the shell handles d-pad navigation, A to activate and B to go back.
`data-autofocus` picks what's focused when the app opens. To take over buttons yourself
(games, scrubbing a track), call `useButtons((b) => …)` and return `true` for the ones
you handle.

Device state lives in the `systemState` signal (`src/core/bridge.ts`). Read
`systemState.value` in a component and it updates on its own. For values that change
often, pass a `computed` signal straight into JSX (see `StatusBar.tsx`) so only that text
node updates.

## Styling

Tailwind 4, configured in `apps/shell/src/styles.css`. Palette tokens live in `@theme`:
`mask`, `mask-deep`, `trace`, `silk`, `pad` (focus accent), `warn`. The root font size
scales with the screen, so rem-based utilities scale with it. Style d-pad focus with
`focus:` variants. Avoid large blurs and `backdrop-filter`; they're expensive on WPE.

## Not decided yet

- **Board / SBC.** `linux.ts` assumes a generic Linux image with NetworkManager and BlueZ;
  adjust once the hardware is picked.
- **Buttons.** Input expects key events (gpio-keys, a keyboard matrix) or a HID gamepad.
  Remap in `apps/shell/src/core/buttons.ts`.
- **Spotify playback.** The Web Playback SDK needs Widevine, which WPE builds usually
  don't ship, so the likely path is librespot/spotifyd as a local Connect device driven
  through the Web API. See the note in `apps/spotify/index.ts`.
- **Font.** Drop a bundled font into `apps/shell/public/fonts` and update `--font`.
