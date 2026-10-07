import "./styles.css";
import { render } from "preact";
import { connectBridge } from "./core/bridge.ts";
import { Input } from "./core/buttons.ts";
import { dispatchButton } from "./core/navigation.ts";
import { appRoot, Shell } from "./shell.tsx";

connectBridge();

const input = new Input();
input.on((button) => dispatchButton(button, appRoot.current));
input.start();

render(<Shell />, document.getElementById("root")!);
