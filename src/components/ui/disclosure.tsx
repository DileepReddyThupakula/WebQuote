import type { ReactNode } from "react";

import { cx } from "@/lib/classes";

export function Disclosure({
  children,
  className,
  defaultOpen,
  summary,
}: {
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  summary: string;
}) {
  return (
    <details
      className={cx(
        "group rounded-section border border-border bg-surface",
        className,
      )}
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold text-ink outline-none marker:hidden group-open:border-b group-open:border-border [&::-webkit-details-marker]:hidden">
        {summary}
        <span aria-hidden="true" className="text-lg font-normal text-ink-muted">
          +
        </span>
      </summary>
      <div className="px-4 py-4 text-sm leading-6 text-ink-muted">
        {children}
      </div>
    </details>
  );
}
