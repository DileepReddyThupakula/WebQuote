import {
  basisPoints,
  interpolateQuarterHours,
  multiplyRatioHalfUp,
  quarterHours,
  sumQuarterHours,
} from "@/domain/quote/arithmetic";
import { priceEffortRange } from "@/domain/quote/commercial-pricing";
import type { PricingConfigV1 } from "@/domain/quote/config/schema";
import type {
  EffortLineItem,
  NormalizedQuoteInputV1,
  QuoteResultV1,
} from "@/domain/quote/types";

const revisionEligibleCategories = new Set([
  "projectFoundation",
  "pages",
  "design",
  "content",
  "features",
  "integrations",
]);

export function calculateRevisions(
  lines: readonly EffortLineItem[],
  input: NormalizedQuoteInputV1,
  config: PricingConfigV1,
): QuoteResultV1["revisions"] {
  const eligible = lines.filter(({ category }) =>
    revisionEligibleCategories.has(category),
  );
  const eligibleLow = sumQuarterHours(
    eligible.map(({ effort }) => effort.lowQh),
  );
  const eligibleHigh = sumQuarterHours(
    eligible.map(({ effort }) => effort.highQh),
  );
  const lowQh = quarterHours(
    Math.max(
      config.revisions.minimumLowQh,
      multiplyRatioHalfUp(
        eligibleLow,
        config.revisions.lowRateBp,
        config.units.basisPointsScale,
      ),
    ),
  );
  const highQh = quarterHours(
    Math.max(
      config.revisions.minimumHighQh,
      multiplyRatioHalfUp(
        eligibleHigh,
        config.revisions.highRateBp,
        config.units.basisPointsScale,
      ),
    ),
  );
  const effort = {
    lowQh,
    expectedQh: interpolateQuarterHours(
      lowQh,
      highQh,
      basisPoints(config.expectedEffortPositionBp),
      config.units.basisPointsScale,
    ),
    highQh,
  };

  return {
    includedRounds: input.delivery.includedRevisionRounds,
    extraRoundEffort: effort,
    extraRoundPrice: priceEffortRange(effort, input, config),
  };
}
