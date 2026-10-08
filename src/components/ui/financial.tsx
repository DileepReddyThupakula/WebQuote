import type { ReactNode } from "react";

import { cx } from "@/lib/classes";

export type SupportedCurrency = "INR" | "USD" | "GBP" | "EUR";

const currencyLocales: Record<SupportedCurrency, string> = {
  INR: "en-IN",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "en-IE",
};

export function formatMinorUnits(
  amountMinor: number,
  currency: SupportedCurrency,
): string {
  return new Intl.NumberFormat(currencyLocales[currency], {
    currency,
    currencyDisplay: "symbol",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(amountMinor / 100);
}

export function MoneyDisplay({
  amountMinor,
  currency,
  className,
  size = "default",
}: {
  amountMinor: number;
  currency: SupportedCurrency;
  className?: string;
  size?: "default" | "large";
}) {
  return (
    <span
      className={cx(
        "numeric font-semibold tracking-[-0.025em] text-ink",
        size === "large" ? "text-4xl sm:text-5xl" : "text-xl",
        className,
      )}
    >
      {formatMinorUnits(amountMinor, currency)}
    </span>
  );
}

export function MetricPair({
  label,
  value,
  detail,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
}) {
  return (
    <div className="grid gap-1 border-l border-border pl-4">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-base font-semibold text-ink">{value}</dd>
      {detail ? <p className="text-sm text-ink-faint">{detail}</p> : null}
    </div>
  );
}

export function PriceRange({
  low,
  high,
  currency,
  label = "Recommended planning range",
}: {
  low: number;
  high: number;
  currency: SupportedCurrency;
  label?: string;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-semibold text-ink-muted">{label}</p>
      <p className="numeric text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl">
        {formatMinorUnits(low, currency)}
        <span className="px-2 text-ink-faint">–</span>
        {formatMinorUnits(high, currency)}
      </p>
    </div>
  );
}

export function DefinitionValue({
  label,
  value,
  detail,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border py-3 last:border-b-0">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-sm font-semibold text-ink">
        {value}
        {detail ? (
          <span className="ml-2 font-normal text-ink-faint">{detail}</span>
        ) : null}
      </dd>
    </div>
  );
}
