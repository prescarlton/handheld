import type { Command, CommandResult, SystemState } from "@handheld/protocol";

/**
 * A provider owns everything hardware-specific. The rest of the daemon only
 * sees SystemState snapshots and forwards Commands.
 */
export interface SystemProvider {
  readonly mock: boolean;
  read(): Promise<SystemState>;
  run(command: Command): Promise<CommandResult>;
}
