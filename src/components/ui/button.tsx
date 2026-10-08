import type { ButtonHTMLAttributes } from "react";

import { cx } from "@/lib/classes";

export type ButtonVariant = "primary" | "secondary" | "tertiary";

const baseClasses =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-semibold transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-55";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white font-medium hover:bg-accent-hover active:bg-accent-pressed",
  secondary:
    "border border-border-strong bg-surface text-ink hover:bg-surface-subtle active:bg-canvas",
  tertiary: "text-accent underline-offset-4 hover:underline",
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  className?: string,
): string {
  return cx(baseClasses, variantClasses[variant], className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName(variant, className)}
      type={type}
      {...props}
    />
  );
}
