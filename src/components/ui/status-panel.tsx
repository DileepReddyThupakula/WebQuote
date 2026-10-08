import type { ReactNode } from "react";

import { cx } from "@/lib/classes";

export type StatusPanelTone = "empty" | "error" | "loading" | "unsupported";

const toneLabels: Record<StatusPanelTone, string> = {
  empty: "Nothing here yet",
  error: "Unable to continue",
  loading: "Working",
  unsupported: "Browser support needed",
};

const toneClasses: Record<StatusPanelTone, string> = {
  empty: "border-border bg-surface",
  error: "border-danger/40 bg-danger-soft",
  loading: "border-border bg-surface-subtle",
  unsupported: "border-warning/40 bg-warning-soft",
};

export function StatusPanel({
  action,
  children,
  className,
  id,
  title,
  tone = "empty",
}: {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id: string;
  title: string;
  tone?: StatusPanelTone;
}) {
  const headingId = `${id}-heading`;

  return (
    <section
      aria-busy={tone === "loading" ? true : undefined}
      aria-labelledby={headingId}
      className={cx(
        "grid gap-3 rounded-section border p-6",
        toneClasses[tone],
        className,
      )}
      id={id}
      role={
        tone === "error" ? "alert" : tone === "loading" ? "status" : undefined
      }
    >
      <p className="text-sm font-semibold uppercase tracking-[0.1em] text-accent">
        {toneLabels[tone]}
      </p>
      <h2
        className="text-xl font-semibold tracking-[-0.02em] text-ink"
        id={headingId}
      >
        {title}
      </h2>
      <div className="max-w-[42rem] text-sm leading-6 text-ink-muted">
        {children}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </section>
  );
}
