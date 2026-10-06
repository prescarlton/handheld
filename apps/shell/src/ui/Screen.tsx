import type { ComponentChildren } from "preact";

export function Screen({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <section>
      <h1 class="mb-3 text-[1.8rem] leading-[1.1] font-semibold tracking-[-0.01em]">{title}</h1>
      {children}
    </section>
  );
}

export function Note({ children }: { children: ComponentChildren }) {
  return <p class="mt-3 min-h-[1.4em] text-[0.8rem] text-trace">{children}</p>;
}
