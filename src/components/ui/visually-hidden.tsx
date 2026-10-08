import type { HTMLAttributes } from "react";

import { cx } from "@/lib/classes";

export function VisuallyHidden({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx(
        "absolute size-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)]",
        className,
      )}
      {...props}
    />
  );
}
