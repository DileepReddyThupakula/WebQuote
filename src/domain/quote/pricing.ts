import {
  applyBasisPoints,
  basisPoints,
  effortCost,
  moneyMinor,
  priceAtGrossMargin,
  roundMoneyUp,
} from "@/domain/quote/arithmetic";
import type { PricingConfigV1 } from "@/domain/quote/config/schema";
import type {
  EffortPoints,
  NormalizedQuoteInputV1,
  PriceLedgerItem,
  QuoteResultV1,
} from "@/domain/quote/types";

export function calculatePricing(
  input: NormalizedQuoteInputV1,
  delivery: EffortPoints,
  config: PricingConfigV1,
): Readonly<{
  pricing: QuoteResultV1["pricing"];
  ledger: readonly PriceLedgerItem[];
}> {
  const scale = config.units.basisPointsScale;
  const hourlyValue = input.pricing.hourlyValueMinor;
  const margin = input.pricing.targetMarginBp;
  const currency = input.project.currency;
  const increment = moneyMinor(
    config.currencies[currency].commercialRoundingIncrementMinor,
  );

  const lowCost = effortCost(
    delivery.lowQh,
    hourlyValue,
    config.units.quarterHoursPerHour,
  );
  const expectedCost = effortCost(
    delivery.expectedQh,
    hourlyValue,
    config.units.quarterHoursPerHour,
  );
  const safeCost = effortCost(
    delivery.highQh,
    hourlyValue,
    config.units.quarterHoursPerHour,
  );
  const recommendedAtMargin = priceAtGrossMargin(expectedCost, margin, scale);
  const recommendedBeforeUrgency = moneyMinor(
    Math.max(safeCost, recommendedAtMargin),
  );
  const lowAtMargin = priceAtGrossMargin(lowCost, margin, scale);
  const rangeLowBeforeUrgency = moneyMinor(
    Math.min(recommendedBeforeUrgency, Math.max(safeCost, lowAtMargin)),
  );
  const rangeHighBeforeUrgency = moneyMinor(
    Math.max(
      recommendedBeforeUrgency,
      priceAtGrossMargin(safeCost, margin, scale),
    ),
  );

  const urgencyRate = basisPoints(config.urgency[input.delivery.urgency]);
  const addUrgency = (value: typeof safeCost) =>
    moneyMinor(value + applyBasisPoints(value, urgencyRate, scale));
  const minimumSafeRaw = addUrgency(safeCost);
  const rangeLowRaw = addUrgency(rangeLowBeforeUrgency);
  const recommendedRaw = addUrgency(recommendedBeforeUrgency);
  const rangeHighRaw = addUrgency(rangeHighBeforeUrgency);

  const minimumSafe = roundMoneyUp(minimumSafeRaw, increment);
  const rangeLow = moneyMinor(
    Math.max(minimumSafe, roundMoneyUp(rangeLowRaw, increment)),
  );
  const recommended = moneyMinor(
    Math.max(rangeLow, roundMoneyUp(recommendedRaw, increment)),
  );
  const rangeHigh = moneyMinor(
    Math.max(recommended, roundMoneyUp(rangeHighRaw, increment)),
  );
  const recommendedBeforeUrgencyRounded = roundMoneyUp(
    recommendedBeforeUrgency,
    increment,
  );
  const rawUrgencyFee = moneyMinor(recommendedRaw - recommendedBeforeUrgency);
  const displayedUrgencyFee = moneyMinor(
    recommended - recommendedBeforeUrgencyRounded,
  );

  const ledger: PriceLedgerItem[] = [
    {
      code: "expectedLaborValue",
      inputMinor: moneyMinor(0),
      deltaMinor: expectedCost,
      outputMinor: expectedCost,
      configPath: "input.pricing.hourlyValueMinor",
    },
    {
      code: "targetMarginAdjustment",
      inputMinor: expectedCost,
      deltaMinor: moneyMinor(recommendedAtMargin - expectedCost),
      outputMinor: recommendedAtMargin,
      rateBp: margin,
      configPath: "input.pricing.targetMarginBp",
    },
    {
      code: "safeFloorAdjustment",
      inputMinor: recommendedAtMargin,
      deltaMinor: moneyMinor(recommendedBeforeUrgency - recommendedAtMargin),
      outputMinor: recommendedBeforeUrgency,
      configPath: "commercial.safeFloor",
    },
    {
      code: "urgencySurcharge",
      inputMinor: recommendedBeforeUrgency,
      deltaMinor: rawUrgencyFee,
      outputMinor: recommendedRaw,
      rateBp: urgencyRate,
      configPath: `urgency.${input.delivery.urgency}`,
    },
    {
      code: "commercialRounding",
      inputMinor: recommendedRaw,
      deltaMinor: moneyMinor(recommended - recommendedRaw),
      outputMinor: recommended,
      configPath: `currencies.${currency}.commercialRoundingIncrementMinor`,
    },
  ];

  return {
    pricing: {
      currency,
      hourlyValueMinor: hourlyValue,
      targetMarginBp: margin,
      minimumSafeRawMinor: minimumSafeRaw,
      minimumSafeMinor: minimumSafe,
      recommendedBeforeUrgencyRawMinor: recommendedBeforeUrgency,
      recommendedBeforeUrgencyMinor: recommendedBeforeUrgencyRounded,
      recommendedRawMinor: recommendedRaw,
      recommendedMinor: recommended,
      rangeLowRawMinor: rangeLowRaw,
      rangeLowMinor: rangeLow,
      rangeHighRawMinor: rangeHighRaw,
      rangeHighMinor: rangeHigh,
      urgency: {
        level: input.delivery.urgency,
        rateBp: urgencyRate,
        rawFeeMinor: rawUrgencyFee,
        displayedFeeMinor: displayedUrgencyFee,
      },
      roundingIncrementMinor: increment,
    },
    ledger,
  };
}
