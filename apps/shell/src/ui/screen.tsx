import type { ComponentChildren } from "preact";
import { BackButton } from "./back-button.tsx";

type Props = {
  title: string;
  /** Shown beside the title, e.g. a status badge. */
  accessory?: ComponentChildren;
  children: ComponentChildren;
};

export function Screen({ title, accessory, children }: Props) {
  return (
    <section>
      <div class="mb-3 flex items-center gap-2">
        <BackButton />
        <h1 class="font-semibold text-[1.8rem] leading-[1.1] tracking-[-0.01em]">{title}</h1>
        {accessory}
      </div>
      {children}
    </section>
  );
}

export function Note({ children }: { children: ComponentChildren }) {
  return <p class="mt-3 min-h-[1.4em] text-[0.8rem] text-muted">{children}</p>;
}
