import type { TextareaHTMLAttributes } from "react";

import { cx } from "@/lib/classes";

type TextareaFieldProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "aria-describedby" | "aria-invalid" | "id"
> & {
  id: string;
  label: string;
  description?: string | undefined;
  error?: string | undefined;
  optional?: boolean | undefined;
};

export function TextareaField({
  className,
  description,
  error,
  id,
  label,
  optional,
  required,
  ...props
}: TextareaFieldProps) {
  const descriptionId = description ? `${id}-description` : null;
  const errorId = error ? `${id}-error` : null;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ");

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-ink" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
        {optional ? (
          <span className="ml-1 font-normal text-ink-muted">(optional)</span>
        ) : null}
      </label>
      {description ? (
        <p
          className="text-sm leading-6 text-ink-muted"
          id={descriptionId ?? undefined}
        >
          {description}
        </p>
      ) : null}
      <textarea
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className={cx(
          "min-h-32 w-full resize-y rounded-control border bg-surface px-3.5 py-2.5 text-base text-ink shadow-control outline-none transition-colors placeholder:text-ink-faint hover:border-border-strong disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-ink-muted",
          error ? "border-danger" : "border-border",
          className,
        )}
        id={id}
        required={required}
        {...props}
      />
      {error ? (
        <p
          className="text-sm font-medium text-danger"
          id={errorId ?? undefined}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
