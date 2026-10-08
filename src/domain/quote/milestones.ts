import {
  basisPoints,
  moneyMinor,
  multiplyRatioFloor,
} from "@/domain/quote/arithmetic";
import type { PricingConfigV1 } from "@/domain/quote/config/schema";
import type {
  NormalizedQuoteInputV1,
  QuoteResultV1,
} from "@/domain/quote/types";

type MilestoneDefinition = Readonly<{
  code: string;
  label: string;
  percentBp: number;
}>;

function elevateDeposit(
  schedule: readonly MilestoneDefinition[],
  targetDepositBp: number,
): readonly MilestoneDefinition[] {
  const mutable = schedule.map((item) => ({ ...item }));
  const first = mutable[0];
  if (!first || first.percentBp >= targetDepositBp) return mutable;

  const increase = targetDepositBp - first.percentBp;
  const middle = mutable.slice(1, -1);
  const reducible = middle.reduce(
    (total, item) => total + Math.max(0, item.percentBp - 1),
    0,
  );
  if (reducible < increase) {
    throw new RangeError(
      "Milestone schedule cannot fund the elevated deposit.",
    );
  }

  first.percentBp = targetDepositBp;
  let remaining = increase;
  for (const [index, item] of middle.entries()) {
    const available = Math.max(0, item.percentBp - 1);
    const reduction =
      index === middle.length - 1
        ? remaining
        : Math.min(
            remaining,
            multiplyRatioFloor(increase, available, reducible),
          );
    mutable[index + 1]!.percentBp -= reduction;
    remaining -= reduction;
  }
  return mutable;
}

export function calculateMilestones(
  recommendedMinor: QuoteResultV1["pricing"]["recommendedMinor"],
  highWeeks: number,
  complexity: QuoteResultV1["complexity"],
  input: NormalizedQuoteInputV1,
  config: PricingConfigV1,
): QuoteResultV1["payment"] {
  const baseSchedule =
    complexity.level === "advanced" ||
    highWeeks > config.milestones.mediumMaxWeeks
      ? config.milestones.schedules.long
      : highWeeks > config.milestones.shortMaxWeeks
        ? config.milestones.schedules.medium
        : config.milestones.schedules.short;
  const elevated =
    input.pricing.riskLevel === config.milestones.elevatedByRisk ||
    (input.delivery.urgency !== "standard" &&
      config.milestones.elevatedByUrgency.includes(input.delivery.urgency));
  const schedule = elevated
    ? elevateDeposit(baseSchedule, config.milestones.elevatedDepositBp)
    : baseSchedule;

  let allocated = 0;
  const milestones = schedule.map((item, index) => {
    const isLast = index === schedule.length - 1;
    const amount = isLast
      ? recommendedMinor - allocated
      : multiplyRatioFloor(
          recommendedMinor,
          item.percentBp,
          config.units.basisPointsScale,
        );
    allocated += amount;
    return {
      code: item.code,
      label: item.label,
      percentBp: basisPoints(item.percentBp),
      amountMinor: moneyMinor(amount),
    };
  });
  const deposit = milestones[0]!;

  return {
    depositPercentBp: deposit.percentBp,
    depositAmountMinor: deposit.amountMinor,
    milestones,
  };
}
