import { openApp } from "../../core/navigation.ts";
import { Screen } from "../../ui/Screen.tsx";
import { apps } from "../registry.ts";

export function Launcher() {
  return (
    <Screen title="Apps">
      <ul class="border-t border-trace">
        {apps.map((app, index) => (
          <li key={app.id}>
            <button
              data-focusable
              data-autofocus={index === 0 ? "" : undefined}
              onClick={() => openApp(app.id)}
              class="group relative grid w-full border-b border-trace py-3 pr-3 pl-5 text-left focus:bg-mask-deep before:absolute before:inset-y-[25%] before:left-0 before:w-1.5 before:scale-y-0 before:bg-pad before:transition-transform before:duration-150 focus:before:scale-y-100 motion-reduce:before:transition-none"
            >
              <span class="text-[1.25rem] font-semibold group-focus:text-pad">{app.name}</span>
              <span class="text-[0.8rem] text-trace">{app.blurb}</span>
            </button>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
