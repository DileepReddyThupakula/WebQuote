import type { SelectHTMLAttributes } from "react";

import { cx } from "@/lib/classes";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "aria-describedby" | "aria-invalid" | "id"
> & {
  id: string;
  label: string;
  options: readonly SelectOption[];
  description?: string | undefined;
  error?: string | undefined;
  optional?: boolean | undefined;
};

export function SelectField({
  className,
  description,
  error,
  id,
  label,
  options,
  optional,
  required,
  ...props
}: SelectFieldProps) {
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
        <p className="text-sm text-ink-muted" id={descriptionId ?? undefined}>
          {description}
        </p>
      ) : null}
      <select
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className={cx(
          "min-h-11 w-full rounded-control border bg-surface px-3.5 py-2.5 text-base text-ink shadow-control outline-none transition-colors hover:border-border-strong disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-ink-muted",
          error ? "border-danger" : "border-border",
          className,
        )}
        id={id}
        required={required}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
