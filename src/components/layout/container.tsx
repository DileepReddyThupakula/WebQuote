import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cx } from "@/lib/classes";

type ContainerProps<T extends ElementType = "div"> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function Container<T extends ElementType = "div">({
  as,
  children,
  className,
  ...props
}: ContainerProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      className={cx(
        "mx-auto w-full max-w-[80rem] px-4 sm:px-6 md:px-8 xl:px-10",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
