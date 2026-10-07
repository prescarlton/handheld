import clsx from "clsx";

/** On/off indicator. Visual only: the row around it is the control. */
export function Switch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      class={clsx(
        "relative inline-block h-5 w-9 rounded-full transition-colors",
        on ? "bg-accent" : "bg-foreground/20",
      )}
    >
      <span
        class={clsx(
          "absolute top-0.5 left-0.5 size-4 rounded-full bg-foreground transition-transform",
          on && "translate-x-4",
        )}
      />
    </span>
  );
}
