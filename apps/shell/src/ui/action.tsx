import type { JSX } from "preact";

type Props = JSX.HTMLAttributes<HTMLButtonElement> & { autofocus?: boolean };

/** Bordered button that lights up in the accent color when focused by the d-pad. */
export function Action({ autofocus, class: className, ...props }: Props) {
  return (
    <button
      {...props}
      data-focusable
      data-autofocus={autofocus ? "" : undefined}
      class={`rounded-[3px] border border-border px-3 py-2 focus:inset-ring focus:inset-ring-accent focus:border-accent focus:text-accent disabled:opacity-45 ${className ?? ""}`}
    />
  );
}
