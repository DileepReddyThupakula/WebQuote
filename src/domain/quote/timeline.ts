import type { PricingConfigV1 } from "@/domain/quote/config/schema";
import type {
  EffortPoints,
  NormalizedQuoteInputV1,
  QuoteResultV1,
} from "@/domain/quote/types";

export function calculateTimeline(
  delivery: EffortPoints,
  input: NormalizedQuoteInputV1,
  config: PricingConfigV1,
): QuoteResultV1["timeline"] {
  const capacityQh =
    input.delivery.weeklyCapacityHours * config.units.quarterHoursPerHour;
  const weeks = (effortQh: number) =>
    Math.max(config.timeline.minimumWeeks, Math.ceil(effortQh / capacityQh));
  const lowWeeks = weeks(delivery.lowQh);
  const expectedWeeks = Math.max(lowWeeks, weeks(delivery.expectedQh));
  const highWeeks = Math.max(expectedWeeks, weeks(delivery.highQh));

  return {
    weeklyCapacityHours: input.delivery.weeklyCapacityHours,
    lowWeeks,
    expectedWeeks,
    highWeeks,
    requiresCapacityConfirmation: input.delivery.urgency !== "standard",
  };
}
