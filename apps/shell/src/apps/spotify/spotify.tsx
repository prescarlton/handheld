import { API, DAEMON_PORT } from "@handheld/protocol";
import { spotifyStatus } from "../../core/bridge.ts";
import { Note, Screen } from "../../ui/screen.tsx";

/**
 * Spotify sign-in (PKCE, handled by the daemon so tokens stay out of the browser).
 */
export function Spotify() {
  const status = spotifyStatus.value;

  if (!status) {
    return (
      <Screen title="Spotify">
        <Note>Can't reach the system service. Check that handheld-daemon is running.</Note>
      </Screen>
    );
  }

  if (!status.configured) {
    return (
      <Screen title="Spotify">
        <p class="mb-3 max-w-[40ch]">
          Spotify isn't set up on this device. Add <code>SPOTIFY_CLIENT_ID</code> to the daemon's
          environment and restart it.
        </p>
      </Screen>
    );
  }

  return status.signedIn ? <SignedIn /> : <SignedOut />;
}

function SignedOut() {
  // The callback has to land on the daemon at 127.0.0.1, so sign in from a browser that can
  // reach it there: this machine in dev, or a laptop tunnelled to the device.
  const loginUrl = `http://127.0.0.1:${DAEMON_PORT}${API.spotify.login}`;
  return (
    <Screen title="Spotify">
      <p class="mb-3 max-w-[40ch]">Sign in from a computer to use your Spotify account here.</p>
      <ol class="mb-3 max-w-[44ch] list-decimal space-y-2 pl-5 text-[0.9rem]">
        <li>
          On your computer, run
          <code class="mt-1 block rounded bg-surface px-2 py-1 font-mono text-[0.8rem]">
            ssh -L {DAEMON_PORT}:127.0.0.1:{DAEMON_PORT} handheld
          </code>
        </li>
        <li>
          Then open
          <code class="mt-1 block break-all rounded bg-surface px-2 py-1 font-mono text-[0.8rem]">
            {loginUrl}
          </code>
        </li>
      </ol>
      <Note>This screen updates on its own once you've signed in.</Note>
    </Screen>
  );
}

function SignedIn() {
  return <Screen title="Spotify">{spotifyStatus.value?.user}</Screen>;
}
