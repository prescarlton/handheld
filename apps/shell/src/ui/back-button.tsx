import { goBack } from "../core/navigation.ts";

/** Chevron that leaves the current app, same as the B button. */
export function BackButton({ onClick = goBack }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      data-focusable
      aria-label="Back"
      onClick={onClick}
      class="-ml-2 flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-[background-color,box-shadow,color] duration-150 focus:inset-ring-2 focus:inset-ring-accent focus:bg-foreground/10 focus:text-foreground"
    >
      <svg
        viewBox="0 0 24 24"
        class="size-6"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
