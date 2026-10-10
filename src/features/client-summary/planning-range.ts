export const PLANNING_RANGE_NOTE =
  "The lower figure is the price for the scope listed here. The upper figure applies only if the scope grows.";

export type ClientPlanningRange = Readonly<{
  lowMinor: number;
  highMinor: number;
}>;

/**
 * The range a client sees. It always starts at the final quoted amount (the
 * calculated recommendation or the user's override) and never reaches below
 * it, so it cannot reveal the private minimum safe price or contradict the
 * quote. The upside is the engine's own high-end spread
 * (`rangeHigh / recommended`) applied to the quoted amount and rounded up to
 * the quote's commercial rounding increment.
 */
export function clientPlanningRange(
  quoteMinor: number,
  pricing: Readonly<{
    recommendedMinor: number;
    rangeHighMinor: number;
    roundingIncrementMinor: number;
  }>,
): ClientPlanningRange {
  const { recommendedMinor, rangeHighMinor, roundingIncrementMinor } = pricing;
  if (
    quoteMinor <= 0 ||
    recommendedMinor <= 0 ||
    rangeHighMinor <= recommendedMinor
  ) {
    return { lowMinor: quoteMinor, highMinor: quoteMinor };
  }
  const scaled =
    (BigInt(quoteMinor) * BigInt(rangeHighMinor) +
      BigInt(recommendedMinor) -
      1n) /
    BigInt(recommendedMinor);
  const increment = BigInt(Math.max(1, roundingIncrementMinor));
  const rounded = ((scaled + increment - 1n) / increment) * increment;
  const capped =
    rounded > BigInt(Number.MAX_SAFE_INTEGER)
      ? Number.MAX_SAFE_INTEGER
      : Number(rounded);
  return { lowMinor: quoteMinor, highMinor: Math.max(quoteMinor, capped) };
}
