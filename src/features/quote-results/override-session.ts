import type { QuoteOverridesV1 } from "@/features/quote-results/overrides";

let current: QuoteOverridesV1 | null = null;
export function getSessionOverrides(): QuoteOverridesV1 | null {
  return current;
}
export function setSessionOverrides(value: QuoteOverridesV1): void {
  current = value;
}
export function clearSessionOverrides(): void {
  current = null;
}
