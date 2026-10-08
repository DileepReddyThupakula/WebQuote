import type {
  BasisPoints,
  MoneyMinor,
  QuarterHours,
} from "@/domain/quote/types";

function assertNonNegativeSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
}

export function moneyMinor(value: number): MoneyMinor {
  assertNonNegativeSafeInteger(value, "Money");
  return value as MoneyMinor;
}

export function basisPoints(value: number): BasisPoints {
  assertNonNegativeSafeInteger(value, "Basis points");
  return value as BasisPoints;
}

export function quarterHours(value: number): QuarterHours {
  assertNonNegativeSafeInteger(value, "Quarter-hours");
  return value as QuarterHours;
}

function toSafeNumber(value: bigint, name: string): number {
  const converted = Number(value);
  if (!Number.isSafeInteger(converted)) {
    throw new RangeError(`${name} exceeds the safe integer range.`);
  }
  return converted;
}

export function divideHalfUp(numerator: number, denominator: number): number {
  assertNonNegativeSafeInteger(numerator, "Numerator");
  if (!Number.isSafeInteger(denominator) || denominator <= 0) {
    throw new RangeError("Denominator must be a positive safe integer.");
  }

  const numeratorBig = BigInt(numerator);
  const denominatorBig = BigInt(denominator);
  const rounded = (numeratorBig * 2n + denominatorBig) / (denominatorBig * 2n);
  return toSafeNumber(rounded, "Rounded division");
}

export function multiplyRatioHalfUp(
  value: number,
  numerator: number,
  denominator: number,
): number {
  assertNonNegativeSafeInteger(value, "Value");
  assertNonNegativeSafeInteger(numerator, "Ratio numerator");
  if (!Number.isSafeInteger(denominator) || denominator <= 0) {
    throw new RangeError("Ratio denominator must be a positive safe integer.");
  }

  const product = BigInt(value) * BigInt(numerator);
  const denominatorBig = BigInt(denominator);
  const rounded = (product * 2n + denominatorBig) / (denominatorBig * 2n);
  return toSafeNumber(rounded, "Ratio result");
}

export function multiplyRatioFloor(
  value: number,
  numerator: number,
  denominator: number,
): number {
  assertNonNegativeSafeInteger(value, "Value");
  assertNonNegativeSafeInteger(numerator, "Ratio numerator");
  if (!Number.isSafeInteger(denominator) || denominator <= 0) {
    throw new RangeError("Ratio denominator must be a positive safe integer.");
  }

  return toSafeNumber(
    (BigInt(value) * BigInt(numerator)) / BigInt(denominator),
    "Floored ratio result",
  );
}

export function interpolateQuarterHours(
  lowQh: QuarterHours,
  highQh: QuarterHours,
  positionBp: BasisPoints,
  basisPointsScale: number,
): QuarterHours {
  if (highQh < lowQh) {
    throw new RangeError("Effort range high must not be below low.");
  }

  return quarterHours(
    lowQh + multiplyRatioHalfUp(highQh - lowQh, positionBp, basisPointsScale),
  );
}

export function effortCost(
  effortQh: QuarterHours,
  hourlyValueMinor: MoneyMinor,
  quarterHoursPerHour: number,
): MoneyMinor {
  if (!Number.isSafeInteger(quarterHoursPerHour) || quarterHoursPerHour <= 0) {
    throw new RangeError(
      "Quarter-hours per hour must be a positive safe integer.",
    );
  }
  const numerator = BigInt(effortQh) * BigInt(hourlyValueMinor);
  const denominator = BigInt(quarterHoursPerHour);
  const rounded = (numerator * 2n + denominator) / (denominator * 2n);
  return moneyMinor(toSafeNumber(rounded, "Effort cost"));
}

export function priceAtGrossMargin(
  costMinor: MoneyMinor,
  marginBp: BasisPoints,
  basisPointsScale: number,
): MoneyMinor {
  if (marginBp >= basisPointsScale) {
    throw new RangeError("Gross margin must be below 100%.");
  }
  return moneyMinor(
    multiplyRatioHalfUp(
      costMinor,
      basisPointsScale,
      basisPointsScale - marginBp,
    ),
  );
}

export function applyBasisPoints(
  value: MoneyMinor,
  rateBp: BasisPoints,
  basisPointsScale: number,
): MoneyMinor {
  return moneyMinor(multiplyRatioHalfUp(value, rateBp, basisPointsScale));
}

export function roundMoneyUp(
  value: MoneyMinor,
  incrementMinor: MoneyMinor,
): MoneyMinor {
  if (incrementMinor <= 0) {
    throw new RangeError("Commercial rounding increment must be positive.");
  }
  if (value === 0) {
    return moneyMinor(0);
  }

  const rounded =
    ((BigInt(value) + BigInt(incrementMinor) - 1n) / BigInt(incrementMinor)) *
    BigInt(incrementMinor);
  return moneyMinor(toSafeNumber(rounded, "Commercial rounding result"));
}

export function sumQuarterHours(values: readonly QuarterHours[]): QuarterHours {
  return quarterHours(values.reduce((total, value) => total + value, 0));
}
