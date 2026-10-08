# Handheld

Software for the custom handheld: a TypeScript shell rendered full-screen by
[cog](https://github.com/Igalia/cog) (WPE WebKit), plus a small system daemon that
talks to the hardware. Apps — Spotify first — are modules inside the shell.

```
apps/shell/          UI that runs in cog. Preact + signals, Tailwind 4, Vite.
  src/core/          input mapping, d-pad focus, navigation, daemon bridge, status bar
  src/apps/          one folder per app (launcher, spotify, settings)
  src/ui/            shared components (screen, row, row-button, action, switch, meter…)
services/daemon/     Node service: battery / Wi-Fi / Bluetooth / power, Spotify auth, serves the built shell
  src/providers/     linux.ts (sysfs, nmcli, bluetoothctl) and mock.ts for laptop dev
  src/spotify/       PKCE sign-in, token storage, Web API proxy
packages/protocol/   shared types + endpoint names for shell ↔ daemon
system/              systemd units, polkit rule, env file, install + deploy scripts
```

## How the pieces talk

```
buttons ──► key/gamepad events ──► cog (WPE WebKit) ──► shell
                                                        │  GET  /api/events        (SSE: system + Spotify status)
                                                        │  POST /api/command       (power, bluetooth…)
                                                        │  *    /api/spotify/web/* (Web API proxy)
                                                        ▼
                                               daemon @ 127.0.0.1:7777 ──► sysfs / nmcli / bluetoothctl
                                                                       └─► api.spotify.com (token attached)
```

The daemon has zero runtime dependencies (plain `node:http` + Server-Sent Events) and
is bundled into one file with esbuild, so startup on the device stays fast.

## Develop on your laptop

```sh
pnpm install
pnpm dev            # daemon with mock hardware on :7777 + Vite on :5173
```

Open http://localhost:5173. Controls: arrows = d-pad, Enter/Z = A, Esc/Backspace/X = B,
H/Home = Home, M = Menu. A USB gamepad works too. The daemon loads `services/daemon/.env`
on start (see Spotify below) and keeps state in `services/daemon/.state` (gitignored).

## Run on the device

```sh
pnpm install && pnpm build
sudo ./system/scripts/install.sh      # first time
./system/scripts/deploy.sh user@host  # later, from your laptop
```

Needs Node 20+, cog, NetworkManager, BlueZ and polkit on the device. Settings live
in `/etc/handheld/handheld.env` (set `COG_PLATFORM=wl` if you run under a Wayland compositor).

## Spotify sign-in

The daemon does Authorization Code + PKCE and keeps the tokens; the shell only talks to
`/api/spotify/web/*`, which the daemon forwards to the Web API with the token attached.

1. Create an app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
   with the Web API, add the redirect URI `http://127.0.0.1:7777/api/spotify/callback`
   (exactly; `localhost` isn't accepted), and add your account under User Management.
2. Put the Client ID in `services/daemon/.env` for dev, or `/etc/handheld/handheld.env` on
   the device: `SPOTIFY_CLIENT_ID=…`. Restart the daemon.
3. Open `http://127.0.0.1:7777/api/spotify/login` in a browser. On the device, tunnel first
   from your laptop: `ssh -L 7777:127.0.0.1:7777 user@handheld`, then open the same URL there.

The session is saved to `spotify.json` in `HANDHELD_STATE_DIR` (`/var/lib/handheld` on the
device, `services/daemon/.state` in dev). Playback control needs Premium and plays on a
Spotify Connect device (phone, computer, or librespot on the handheld later). In development
mode, Spotify only lists songs for playlists you own or collaborate on.

## Adding an app

1. Create `apps/shell/src/apps/<name>/<name>.tsx` exporting a component. Filenames are
   kebab-case throughout the shell (`back-button.tsx`, `status-bar.tsx`).
2. Add an entry to `apps` in `apps/shell/src/apps/registry.ts`.

Mark anything selectable with `data-focusable` (add `tabIndex={0}` if it isn't a button
or link) and the shell handles d-pad navigation, A to activate and B to go back.
`data-autofocus` picks what's focused when the app opens. To take over buttons yourself
(games, scrubbing a track), call `useButtons((b) => …)` and return `true` for the ones
you handle.

Daemon state lives in signals in `src/core/bridge.ts`: `systemState` (battery, Wi-Fi,
Bluetooth…) and `spotifyStatus` (configured / signed in / user). Read `.value` in a
component and it updates on its own. For values that change often, pass a `computed`
signal straight into JSX (see `status-bar.tsx`) so only that text node updates.

## Styling

Tailwind 4, configured in `apps/shell/src/styles.css`. Palette tokens live in `@theme`:
`background`, `surface`, `border`, `muted`, `foreground`, `accent` (reserved for focus),
`danger` — e.g. `bg-surface`, `text-muted`. The root font size scales with the screen
(`clamp(12px, 3.2vmin, 22px)`), so rem-based utilities scale with it. Style d-pad focus with
`focus:` variants. Avoid large blurs and `backdrop-filter`; they're expensive on WPE.

## Not decided yet

- **Board / SBC.** `linux.ts` assumes a generic Linux image with NetworkManager and BlueZ;
  adjust once the hardware is picked.
- **Buttons.** Input expects key events (gpio-keys, a keyboard matrix) or a HID gamepad.
  Remap in `apps/shell/src/core/buttons.ts`.
- **Font.** `--font-sans` falls back to IBM Plex Sans / Inter / system-ui. Bundle the pick
  into `apps/shell/public/fonts` (doesn't exist yet) and update `--font-sans`.
