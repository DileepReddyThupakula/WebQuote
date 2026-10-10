import type { QuoteResultV1 } from "@/domain/quote/types";

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
}

export function assertQuoteResultInvariants(result: QuoteResultV1): void {
  const effortPoints = [
    result.effort.direct,
    result.effort.complexityAdditional,
    result.effort.testingOverhead,
    result.effort.projectManagementOverhead,
    ...(result.effort.includedWork
      ? [
          result.effort.includedWork.revisionRounds,
          result.effort.includedWork.postLaunchSupport,
        ]
      : []),
    result.effort.planned,
    result.effort.delivery,
  ];
  for (const [index, effort] of effortPoints.entries()) {
    assertNonNegativeInteger(effort.lowQh, `Effort ${index} low`);
    assertNonNegativeInteger(effort.expectedQh, `Effort ${index} expected`);
    assertNonNegativeInteger(effort.highQh, `Effort ${index} high`);
    if (!(
      effort.lowQh <= effort.expectedQh && effort.expectedQh <= effort.highQh
    )) {
      throw new RangeError(`Effort ${index} points are not ordered.`);
    }
  }

  const expectedLedgerTotal = result.ledger.effort.reduce(
    (total, item) => total + item.amountQh,
    0,
  );
  if (expectedLedgerTotal !== result.effort.delivery.expectedQh) {
    throw new RangeError("Expected-effort ledger does not reconcile.");
  }

  const { pricing } = result;
  if (!(
    pricing.minimumSafeMinor <= pricing.rangeLowMinor &&
    pricing.rangeLowMinor <= pricing.recommendedMinor &&
    pricing.recommendedMinor <= pricing.rangeHighMinor
  )) {
    throw new RangeError("Commercial prices are not ordered.");
  }
  if (pricing.minimumSafeMinor < pricing.minimumSafeRawMinor) {
    throw new RangeError("Commercial rounding lowered the safe floor.");
  }
  if (pricing.recommendedMinor < pricing.recommendedRawMinor) {
    throw new RangeError("Commercial rounding lowered the recommendation.");
  }

  const finalPriceLedger = result.ledger.pricing.at(-1);
  if (finalPriceLedger?.outputMinor !== pricing.recommendedMinor) {
    throw new RangeError("Price ledger does not reconcile to recommendation.");
  }
  for (const item of result.ledger.pricing) {
    if (item.inputMinor + item.deltaMinor !== item.outputMinor) {
      throw new RangeError(
        `Price ledger item ${item.code} does not reconcile.`,
      );
    }
  }

  const milestonePercent = result.payment.milestones.reduce(
    (total, item) => total + item.percentBp,
    0,
  );
  const milestoneMoney = result.payment.milestones.reduce(
    (total, item) => total + item.amountMinor,
    0,
  );
  if (milestonePercent !== 10_000) {
    throw new RangeError("Milestone percentages do not total 100%.");
  }
  if (milestoneMoney !== pricing.recommendedMinor) {
    throw new RangeError("Milestone amounts do not reconcile to quote total.");
  }
}
