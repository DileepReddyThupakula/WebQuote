import type { InputHTMLAttributes } from "react";

import { cx } from "@/lib/classes";

export type RadioOption = {
  value: string;
  label: string;
  description?: string;
};

type RadioGroupFieldProps = {
  name: string;
  legend: string;
  options: readonly RadioOption[];
  value?: string;
  defaultValue?: string;
  description?: string | undefined;
  error?: string | undefined;
  optional?: boolean | undefined;
  variant?: "list" | "cards";
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
};

export function RadioGroupField({
  defaultValue,
  description,
  error,
  legend,
  name,
  onChange,
  optional,
  options,
  value,
  variant = "list",
}: RadioGroupFieldProps) {
  const descriptionId = description ? `${name}-description` : null;
  const errorId = error ? `${name}-error` : null;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ");

  return (
    <fieldset
      className="grid gap-2"
      aria-describedby={describedBy || undefined}
    >
      <legend className="text-sm font-semibold text-ink">
        {legend}
        {optional ? (
          <span className="ml-1 font-normal text-ink-muted">(optional)</span>
        ) : null}
      </legend>
      {description ? (
        <p
          className="text-sm leading-6 text-ink-muted"
          id={descriptionId ?? undefined}
        >
          {description}
        </p>
      ) : null}
      <div
        className={cx(
          "grid gap-2",
          variant === "cards" ? "sm:grid-cols-2" : null,
        )}
      >
        {options.map((option) => (
          <label
            className={cx(
              "flex min-h-11 cursor-pointer items-start gap-3 rounded-control border p-3 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-55",
              variant === "cards"
                ? "border-border bg-surface"
                : "border-transparent",
            )}
            key={option.value}
          >
            <input
              aria-describedby={describedBy || undefined}
              className="mt-0.5 size-5 shrink-0 accent-accent"
              name={name}
              onChange={onChange}
              type="radio"
              value={option.value}
              {...(value !== undefined
                ? { checked: value === option.value }
                : { defaultChecked: defaultValue === option.value })}
            />
            <span className="grid gap-1">
              <span className="text-sm font-semibold text-ink">
                {option.label}
              </span>
              {option.description ? (
                <span className="text-sm leading-6 text-ink-muted">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p
          className="text-sm font-medium text-danger"
          id={errorId ?? undefined}
        >
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
