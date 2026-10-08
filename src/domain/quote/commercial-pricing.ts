import {
  applyBasisPoints,
  effortCost,
  moneyMinor,
  priceAtGrossMargin,
  roundMoneyUp,
} from "@/domain/quote/arithmetic";
import type { PricingConfigV1 } from "@/domain/quote/config/schema";
import type {
  BasisPoints,
  CommercialPriceRange,
  EffortPoints,
  MoneyMinor,
  NormalizedQuoteInputV1,
} from "@/domain/quote/types";

export function priceEffortRange(
  effort: EffortPoints,
  input: NormalizedQuoteInputV1,
  config: PricingConfigV1,
  urgencyRateBp?: BasisPoints,
  roundingIncrementOverride?: MoneyMinor,
): CommercialPriceRange {
  const scale = config.units.basisPointsScale;
  const increment =
    roundingIncrementOverride ??
    moneyMinor(
      config.currencies[input.project.currency]
        .commercialRoundingIncrementMinor,
    );
  const pricePoint = (effortQh: EffortPoints["lowQh"]) => {
    const atMargin = priceAtGrossMargin(
      effortCost(
        effortQh,
        input.pricing.hourlyValueMinor,
        config.units.quarterHoursPerHour,
      ),
      input.pricing.targetMarginBp,
      scale,
    );
    return urgencyRateBp
      ? moneyMinor(atMargin + applyBasisPoints(atMargin, urgencyRateBp, scale))
      : atMargin;
  };

  const rawLow = pricePoint(effort.lowQh);
  const rawExpected = pricePoint(effort.expectedQh);
  const rawHigh = pricePoint(effort.highQh);
  const low = roundMoneyUp(rawLow, increment);
  const recommended = moneyMinor(
    Math.max(low, roundMoneyUp(rawExpected, increment)),
  );
  const high = moneyMinor(
    Math.max(recommended, roundMoneyUp(rawHigh, increment)),
  );

  return {
    rawLowMinor: rawLow,
    rawExpectedMinor: rawExpected,
    rawHighMinor: rawHigh,
    lowMinor: low,
    recommendedMinor: recommended,
    highMinor: high,
  };
}
