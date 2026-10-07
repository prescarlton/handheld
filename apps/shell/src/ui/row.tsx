import type { ComponentChildren } from "preact";

type Props = {
  label: ComponentChildren;
  /** Muted subtitle under the label. */
  detail?: ComponentChildren;
  /** Shown on the right. */
  children?: ComponentChildren;
  /** Shown full width under the row, e.g. a meter. */
  footer?: ComponentChildren;
};

/** A static, non-focusable row inside a Group. */
export function Row({ label, detail, children, footer }: Props) {
  return (
    <div class="rounded-lg px-3 py-3">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div>{label}</div>
          {detail && <div class="truncate text-[0.8rem] text-muted">{detail}</div>}
        </div>
        <div class="shrink-0 text-right">{children}</div>
      </div>
      {footer && <div class="mt-2">{footer}</div>}
    </div>
  );
}
