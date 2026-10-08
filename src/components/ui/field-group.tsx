import type { ReactNode } from "react";

import { cx } from "@/lib/classes";

type FieldGroupProps = {
  children: ReactNode;
  className?: string;
  description?: string;
  legend: string;
};

export function FieldGroup({
  children,
  className,
  description,
  legend,
}: FieldGroupProps) {
  return (
    <fieldset className={cx("grid gap-4", className)}>
      <legend className="text-base font-semibold text-ink">{legend}</legend>
      {description ? (
        <p className="text-sm leading-6 text-ink-muted">{description}</p>
      ) : null}
      <div className="grid gap-5">{children}</div>
    </fieldset>
  );
}
