import type { HandheldApp } from "../types.ts";
import { apps } from "../registry.ts";

export const launcher: HandheldApp = {
  id: "launcher",
  name: "Home",
  blurb: "",
  mount({ root, open }) {
    root.innerHTML = `
      <section class="launcher">
        <h1 class="screen-title">Apps</h1>
        <ul class="app-list" role="list"></ul>
      </section>`;

    const list = root.querySelector("ul")!;
    for (const [index, app] of apps.entries()) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.className = "app-row";
      button.dataset.focusable = "";
      if (index === 0) button.dataset.autofocus = "";
      button.innerHTML = `<span class="app-name"></span><span class="app-blurb"></span>`;
      button.querySelector(".app-name")!.textContent = app.name;
      button.querySelector(".app-blurb")!.textContent = app.blurb;
      button.addEventListener("click", () => open(app.id));
      item.append(button);
      list.append(item);
    }
  },
};
