import clsx from "clsx";
import type { ComponentChildren, JSX } from "preact";

type Props = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "label"> & {
  label: ComponentChildren;
  /** Muted subtitle under the label. */
  detail?: ComponentChildren;
  autofocus?: boolean;
  tone?: "default" | "danger";
  /** Shown on the right. */
  children?: ComponentChildren;
};

/** A full-width, d-pad focusable row inside a Group. */
export function RowButton({
  label,
  detail,
  autofocus,
  tone = "default",
  children,
  ...props
}: Props) {
  const danger = tone === "danger";
  return (
    <button
      {...props}
      type="button"
      data-focusable
      data-autofocus={autofocus ? "" : undefined}
      data-highlighted={danger ? "" : undefined}
      class={clsx(
        "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition-[background-color,box-shadow] duration-150 disabled:opacity-45",
        danger
          ? "inset-ring-2 inset-ring-danger bg-danger/10"
          : "focus:inset-ring-2 focus:inset-ring-accent focus:bg-foreground/10",
      )}
    >
      <span class="min-w-0">
        <span class={clsx("block", danger && "text-danger")}>{label}</span>
        {detail && <span class="block truncate text-[0.8rem] text-muted">{detail}</span>}
      </span>
      {children && <span class="shrink-0">{children}</span>}
    </button>
  );
}
