import {
  API,
  type Command,
  type CommandResult,
  type DaemonEvent,
  type SystemState,
} from "@handheld/protocol";
import { signal } from "@preact/signals";

/**
 * Latest state pushed by the daemon, or null while it's unreachable.
 * Components that read `systemState.value` update on their own.
 */
export const systemState = signal<SystemState | null>(null);

let source: EventSource | null = null;

export function connectBridge(): void {
  if (source) return;
  source = new EventSource(API.events);
  source.onmessage = (message: MessageEvent<string>) => {
    const event = JSON.parse(message.data) as DaemonEvent;
    if (event.type === "system") systemState.value = event.state;
    else console[event.level === "info" ? "log" : event.level](`[daemon] ${event.message}`);
  };
  // EventSource reconnects on its own; clearing state shows the UI is offline meanwhile.
  source.onerror = () => {
    systemState.value = null;
  };
}

export async function sendCommand(command: Command): Promise<CommandResult> {
  try {
    const res = await fetch(API.command, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(command),
    });
    return (await res.json()) as CommandResult;
  } catch (err) {
    return { ok: false, error: `Daemon unreachable: ${String(err)}` };
  }
}
