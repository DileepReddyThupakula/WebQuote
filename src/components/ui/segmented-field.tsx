import type { InputHTMLAttributes } from "react";

export type SegmentOption = {
  value: string;
  label: string;
};

type SegmentedFieldProps = {
  name: string;
  legend: string;
  options: readonly SegmentOption[];
  defaultValue?: string;
  value?: string;
  description?: string;
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
};

export function SegmentedField({
  defaultValue,
  description,
  legend,
  name,
  onChange,
  options,
  value,
}: SegmentedFieldProps) {
  const descriptionId = description ? `${name}-description` : null;

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold text-ink">{legend}</legend>
      {description ? (
        <p
          className="text-sm leading-6 text-ink-muted"
          id={descriptionId ?? undefined}
        >
          {description}
        </p>
      ) : null}
      <div
        aria-describedby={descriptionId ?? undefined}
        className="inline-grid w-full grid-cols-2 overflow-hidden rounded-control border border-border bg-surface sm:w-fit"
      >
        {options.map((option) => (
          <label
            className="relative flex min-h-11 cursor-pointer items-center justify-center border-r border-border px-4 text-sm font-semibold text-ink last:border-r-0 has-[:checked]:bg-accent-soft has-[:checked]:text-accent has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-55"
            key={option.value}
          >
            <input
              aria-label={option.label}
              className="absolute inset-0 cursor-pointer opacity-0"
              defaultChecked={defaultValue === option.value}
              name={name}
              onChange={onChange}
              type="radio"
              value={option.value}
              {...(value !== undefined
                ? { checked: value === option.value }
                : {})}
            />
            <span aria-hidden="true">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
