import type { QuoteResultV1 } from "@/domain/quote";
import { formatMoney } from "@/features/client-summary/document";

/**
 * Change-order prices that are computed from the freelancer's hourly value and
 * margin (one hour of rate, or a rate with a rush premium). They must never
 * appear in client-facing output: a client could divide them back to the rate.
 */
export const RATE_DERIVED_CODES = ["hourlyOutOfScope", "urgentChange"] as const;

export const RATE_DERIVED_LABEL_PATTERN =
  /hourly out-of-scope|out-of-scope hourly|urgent change/i;

export function rateDerivedPrices(
  result: QuoteResultV1,
): readonly { code: string; minor: number; text: string }[] {
  return result.changeOrders
    .filter((order) =>
      (RATE_DERIVED_CODES as readonly string[]).includes(order.code),
    )
    .map((order) => ({
      code: order.code,
      minor: order.price.recommendedMinor,
      text: formatMoney(order.price.recommendedMinor, result.pricing.currency),
    }));
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Fails if the text carries a rate-derived label, or one of the rate-derived
 * prices as a standalone amount. `displayedMinors` lists amounts the client
 * document legitimately shows, so a coincidentally equal price is not flagged.
 */
export function findRateDerivedLeaks(
  text: string,
  result: QuoteResultV1,
  displayedMinors: ReadonlySet<number>,
): string[] {
  const leaks: string[] = [];
  const label = text.match(RATE_DERIVED_LABEL_PATTERN);
  if (label) leaks.push(`label: ${label[0]}`);
  for (const price of rateDerivedPrices(result)) {
    if (displayedMinors.has(price.minor)) continue;
    const pattern = new RegExp(`(?<![\\d.,])${escape(price.text)}(?![\\d,])`);
    if (pattern.test(text)) leaks.push(`${price.code}: ${price.text}`);
  }
  return leaks;
}
