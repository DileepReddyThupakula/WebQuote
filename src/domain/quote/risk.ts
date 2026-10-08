import {
  basisPoints,
  multiplyRatioHalfUp,
  quarterHours,
} from "@/domain/quote/arithmetic";
import type { PricingConfigV1 } from "@/domain/quote/config/schema";
import type {
  EffortPoints,
  NormalizedQuoteInputV1,
  QuoteResultV1,
} from "@/domain/quote/types";

export function calculateRiskAndDelivery(
  planned: EffortPoints,
  input: NormalizedQuoteInputV1,
  config: PricingConfigV1,
): Readonly<{
  risk: QuoteResultV1["risk"];
  delivery: EffortPoints;
}> {
  const baseRate = config.risk.contingencyBaseBp[input.pricing.contingency];
  const adjustment = config.risk.adjustmentBp[input.pricing.riskLevel];
  const finalRate = Math.min(
    config.risk.maximumBp,
    Math.max(config.risk.minimumBp, baseRate + adjustment),
  );
  const contingencyQh = quarterHours(
    multiplyRatioHalfUp(
      planned.expectedQh,
      finalRate,
      config.units.basisPointsScale,
    ),
  );
  const riskAdjustedExpectedQh = quarterHours(
    planned.expectedQh + contingencyQh,
  );
  const safeEffortQh = quarterHours(
    Math.max(planned.highQh, riskAdjustedExpectedQh),
  );

  return {
    risk: {
      level: input.pricing.riskLevel,
      preference: input.pricing.contingency,
      baseRateBp: basisPoints(baseRate),
      adjustmentBp: adjustment,
      contingencyRateBp: basisPoints(finalRate),
      contingencyQh,
    },
    delivery: {
      lowQh: planned.lowQh,
      expectedQh: riskAdjustedExpectedQh,
      highQh: safeEffortQh,
    },
  };
}
