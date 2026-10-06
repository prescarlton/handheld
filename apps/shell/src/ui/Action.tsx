import type { JSX } from "preact";

type Props = JSX.HTMLAttributes<HTMLButtonElement> & { autofocus?: boolean };

/** Bordered button that lights up gold when focused by the d-pad. */
export function Action({ autofocus, class: className, ...props }: Props) {
  return (
    <button
      {...props}
      data-focusable
      data-autofocus={autofocus ? "" : undefined}
      class={`rounded-[3px] border border-trace px-3 py-2 disabled:opacity-45 focus:border-pad focus:text-pad focus:inset-ring focus:inset-ring-pad ${className ?? ""}`}
    />
  );
}
