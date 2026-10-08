import type { InputHTMLAttributes } from "react";

import { cx } from "@/lib/classes";

type CheckboxFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "aria-describedby" | "aria-invalid" | "id" | "type"
> & {
  id: string;
  label: string;
  description?: string | undefined;
  error?: string | undefined;
  optional?: boolean | undefined;
};

export function CheckboxField({
  className,
  description,
  error,
  id,
  label,
  optional,
  ...props
}: CheckboxFieldProps) {
  const descriptionId = description ? `${id}-description` : null;
  const errorId = error ? `${id}-error` : null;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ");

  return (
    <div className="grid gap-2">
      <label
        className="flex min-h-11 items-start gap-3 text-sm text-ink"
        htmlFor={id}
      >
        <input
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          className={cx(
            "mt-0.5 size-5 shrink-0 rounded-[0.25rem] border-border-strong accent-accent disabled:cursor-not-allowed disabled:opacity-55",
            className,
          )}
          id={id}
          type="checkbox"
          {...props}
        />
        <span className="grid gap-1">
          <span className="font-semibold">{label}</span>
          {optional ? (
            <span className="font-normal text-ink-muted">(optional)</span>
          ) : null}
          {description ? (
            <span
              className="font-normal text-ink-muted"
              id={descriptionId ?? undefined}
            >
              {description}
            </span>
          ) : null}
        </span>
      </label>
      {error ? (
        <p
          className="pl-8 text-sm font-medium text-danger"
          id={errorId ?? undefined}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
