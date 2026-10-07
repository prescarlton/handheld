import { createRef } from "preact";
import { useLayoutEffect } from "preact/hooks";
import { Launcher } from "./apps/launcher/launcher.tsx";
import { apps } from "./apps/registry.ts";
import { focusFirst } from "./core/focus.ts";
import { currentAppId } from "./core/navigation.ts";
import { StatusBar } from "./core/status-bar.tsx";

/** The element the visible app renders into. Used for d-pad focus. */
export const appRoot = createRef<HTMLElement>();

export function Shell() {
  const id = currentAppId.value;
  const App = apps.find((app) => app.id === id)?.component ?? Launcher;

  // Each time an app opens, put focus on its [data-autofocus] element (or the first focusable).
  useLayoutEffect(() => {
    if (appRoot.current) focusFirst(appRoot.current);
  }, [id]);

  return (
    <div class="grid h-full grid-rows-[auto_1fr]">
      <StatusBar />
      <main ref={appRoot} class="overflow-y-auto p-3">
        <App key={id} />
      </main>
    </div>
  );
}
