import type { ReactNode } from "react";

import { cx } from "@/lib/classes";

export type NoticeTone = "neutral" | "success" | "warning" | "danger";

const toneClasses: Record<NoticeTone, string> = {
  neutral: "border-border bg-surface-subtle text-ink",
  success: "border-success/40 bg-accent-soft text-ink",
  warning: "border-warning/40 bg-warning-soft text-ink",
  danger: "border-danger/40 bg-danger-soft text-ink",
};

export function Notice({
  children,
  className,
  title,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  tone?: NoticeTone;
}) {
  return (
    <aside
      className={cx(
        "grid gap-1 rounded-section border px-4 py-3",
        toneClasses[tone],
        className,
      )}
      role={tone === "danger" ? "alert" : undefined}
    >
      {title ? <p className="text-sm font-semibold">{title}</p> : null}
      <div className="text-sm leading-6 text-ink-muted">{children}</div>
    </aside>
  );
}
