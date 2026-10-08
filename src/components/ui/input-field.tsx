import type { InputHTMLAttributes } from "react";

import { cx } from "@/lib/classes";

type InputFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "aria-describedby" | "aria-invalid" | "id"
> & {
  id: string;
  label: string;
  description?: string | undefined;
  error?: string | undefined;
  optional?: boolean | undefined;
  prefix?: string | undefined;
  suffix?: string | undefined;
};

export function InputField({
  className,
  description,
  error,
  id,
  label,
  optional,
  prefix,
  required,
  suffix,
  ...props
}: InputFieldProps) {
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
      <div
        className={cx(
          "relative flex min-h-11 items-center rounded-control border bg-surface shadow-control transition-colors focus-within:border-border-strong has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-surface-subtle has-[:disabled]:text-ink-muted has-[:disabled]:opacity-80",
          error ? "border-danger" : "border-border",
        )}
      >
        {prefix ? (
          <span className="control-affordance pl-3.5">{prefix}</span>
        ) : null}
        <input
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          className={cx(
            "min-h-11 min-w-0 flex-1 rounded-control bg-transparent px-3.5 py-2.5 text-base text-ink outline-none placeholder:text-ink-faint disabled:cursor-not-allowed",
            prefix ? "pl-2" : null,
            suffix ? "pr-2" : null,
            error ? "text-danger" : null,
            className,
          )}
          id={id}
          required={required}
          {...props}
        />
        {suffix ? (
          <span className="control-affordance pr-3.5">{suffix}</span>
        ) : null}
      </div>
      {error ? <span className="sr-only">This field has an error.</span> : null}
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
