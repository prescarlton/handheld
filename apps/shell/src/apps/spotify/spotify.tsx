import { Action } from "../../ui/Action.tsx";
import { Note, Screen } from "../../ui/Screen.tsx";

/**
 * Spotify client — placeholder.
 *
 * Planned shape (not built yet):
 * - Auth: Authorization Code + PKCE, handled by the daemon so tokens live outside the browser.
 * - Playback: the Web Playback SDK needs Widevine, which WPE WebKit usually lacks, so the likely
 *   route is librespot / spotifyd running as a local Spotify Connect device, driven through the
 *   Web API from this app.
 */
export function Spotify() {
  return (
    <Screen title="Spotify">
      <p class="mb-3 max-w-[36ch]">
        Sign in to play your library here. Sign-in isn't wired up yet.
      </p>
      <Action autofocus disabled>
        Connect Spotify
      </Action>
      <Note>Press B to go back.</Note>
    </Screen>
  );
}
