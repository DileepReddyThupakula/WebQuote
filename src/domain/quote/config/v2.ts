import { parsePricingConfigV1 } from "@/domain/quote/config/schema";
import { PRICING_CONFIG_V1_INPUT } from "@/domain/quote/config/v1";

const range = (lowHours: number, highHours: number) => ({
  lowQh: lowHours * 4,
  highQh: highHours * 4,
});

/**
 * Pricing model v2 = v1 effort calibration, unchanged, plus effort for the
 * revision rounds and post-launch support the quote commits to.
 *
 * No v1 effort, overhead, risk or price number is altered. New quotes use v2;
 * results already stored under v1 keep their own config identity and are never
 * recalculated.
 */
export const PRICING_CONFIG_V2 = parsePricingConfigV1({
  ...PRICING_CONFIG_V1_INPUT,
  identity: {
    ...PRICING_CONFIG_V1_INPUT.identity,
    configId: "webquote-v2-calibration",
    configVersion: "2.0.0",
    modelVersion: "webquote-pricing-v2",
    effectiveAt: "2026-10-10T00:00:00.000Z",
  },
  includedWork: {
    // The builder default is 2 rounds, which the project-foundation ranges are
    // assumed to cover. Rounds above this add effort; rounds below do not
    // discount it, because the foundation ranges are not decomposed per round.
    revisionRounds: { baselineRounds: 2 },
    postLaunchSupport: {
      // UNCALIBRATED PLACEHOLDER VALUES. They mirror the maintenance-tier
      // ranges so the model is at least internally consistent. Replace them
      // from real project data; do not present them as measured.
      calibration: "uncalibrated-placeholder",
      byDays: {
        "0": range(0, 0),
        "14": range(2, 4),
        "30": range(4, 8),
        "60": range(8, 16),
      },
    },
  },
});
