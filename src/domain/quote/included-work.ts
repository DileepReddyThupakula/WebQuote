import { quarterHours } from "@/domain/quote/arithmetic";
import type { PricingConfigV1 } from "@/domain/quote/config/schema";
import { effortPointsFromRange } from "@/domain/quote/effort";
import type {
  EffortPoints,
  NormalizedQuoteInputV1,
  QuoteResultV1,
} from "@/domain/quote/types";

export type IncludedWork = NonNullable<QuoteResultV1["effort"]["includedWork"]>;

function scale(effort: EffortPoints, times: number): EffortPoints {
  return {
    lowQh: quarterHours(effort.lowQh * times),
    expectedQh: quarterHours(effort.expectedQh * times),
    highQh: quarterHours(effort.highQh * times),
  };
}

/**
 * Effort for terms the quote commits to: included revision rounds above the
 * calibrated baseline and the post-launch support window. Returns null for
 * pricing models that predate this (v1), which leaves their results untouched.
 */
export function calculateIncludedWork(
  revisions: QuoteResultV1["revisions"],
  input: NormalizedQuoteInputV1,
  config: PricingConfigV1,
): IncludedWork | null {
  const included = config.includedWork;
  if (!included) return null;

  const roundsAboveBaseline = Math.max(
    0,
    input.delivery.includedRevisionRounds -
      included.revisionRounds.baselineRounds,
  );
  const support =
    included.postLaunchSupport.byDays[
      String(input.delivery.postLaunchSupportDays) as "0" | "14" | "30" | "60"
    ];
  if (!support) {
    throw new RangeError(
      `No post-launch support effort is configured for ${input.delivery.postLaunchSupportDays} days.`,
    );
  }

  return {
    baselineRounds: included.revisionRounds.baselineRounds,
    revisionRounds: scale(revisions.extraRoundEffort, roundsAboveBaseline),
    postLaunchSupport: effortPointsFromRange(
      support.lowQh,
      support.highQh,
      config,
    ),
    supportCalibration: included.postLaunchSupport.calibration,
  };
}
