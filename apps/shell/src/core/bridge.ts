import { API, type Command, type CommandResult, type DaemonEvent, type SystemState } from "@handheld/protocol";

type StateListener = (state: SystemState | null) => void;

/** The shell's only connection to the system daemon. */
export class Bridge {
  private state: SystemState | null = null;
  private listeners = new Set<StateListener>();
  private source: EventSource | null = null;

  connect(): void {
    this.source = new EventSource(API.events);
    this.source.onmessage = (message: MessageEvent<string>) => {
      const event = JSON.parse(message.data) as DaemonEvent;
      if (event.type === "system") this.setState(event.state);
      else console[event.level === "info" ? "log" : event.level](`[daemon] ${event.message}`);
    };
    // EventSource reconnects on its own; clear state so the UI shows it's offline.
    this.source.onerror = () => this.setState(null);
  }

  get current(): SystemState | null {
    return this.state;
  }

  onState(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  async send(command: Command): Promise<CommandResult> {
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

  private setState(state: SystemState | null): void {
    this.state = state;
    for (const listener of this.listeners) listener(state);
  }
}
