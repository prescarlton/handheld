import "./styles.css";
import { launcher } from "./apps/launcher/index.ts";
import { apps } from "./apps/registry.ts";
import { AppHost } from "./core/app-host.ts";
import { Bridge } from "./core/bridge.ts";
import { Input } from "./core/buttons.ts";
import { mountStatusBar } from "./core/status-bar.ts";

const bridge = new Bridge();
bridge.connect();

mountStatusBar(document.getElementById("status")!, bridge);

const host = new AppHost(document.getElementById("app")!, bridge, [launcher, ...apps]);
const input = new Input();
input.on((button) => host.handle(button));
input.start();

void host.open("launcher");
