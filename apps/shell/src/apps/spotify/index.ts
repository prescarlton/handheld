import type { HandheldApp } from "../types.ts";

/**
 * Spotify client — placeholder.
 *
 * Planned shape (not built yet):
 * - Auth: Authorization Code + PKCE, handled by the daemon so tokens live outside the browser.
 * - Playback: the Web Playback SDK needs Widevine, which WPE WebKit usually lacks, so the likely
 *   route is librespot / spotifyd running as a local Spotify Connect device, driven through the
 *   Web API from this app.
 */
export const spotify: HandheldApp = {
  id: "spotify",
  name: "Spotify",
  blurb: "Play music on this device",
  mount({ root }) {
    root.innerHTML = `
      <section class="screen">
        <h1 class="screen-title">Spotify</h1>
        <p class="screen-copy">Sign in to play your library here. Sign-in isn't wired up yet.</p>
        <button class="action" data-focusable data-autofocus disabled>Connect Spotify</button>
        <p class="screen-note">Press B to go back.</p>
      </section>`;
  },
};
