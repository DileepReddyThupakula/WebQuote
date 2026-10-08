import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cx } from "@/lib/classes";

type SectionProps<T extends ElementType = "section"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  size?: "compact" | "default" | "spacious";
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const sizeClasses = {
  compact: "py-8 sm:py-12",
  default: "py-12 sm:py-16 lg:py-20",
  spacious: "py-14 sm:py-20 lg:py-24",
} as const;

export function Section<T extends ElementType = "section">({
  as,
  children,
  className,
  size = "default",
  ...props
}: SectionProps<T>) {
  const Component = as ?? "section";

  return (
    <Component className={cx(sizeClasses[size], className)} {...props}>
      {children}
    </Component>
  );
}
