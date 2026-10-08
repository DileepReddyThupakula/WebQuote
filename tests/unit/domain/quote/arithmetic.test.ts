import {
  applyBasisPoints,
  basisPoints,
  divideHalfUp,
  effortCost,
  interpolateQuarterHours,
  moneyMinor,
  multiplyRatioFloor,
  multiplyRatioHalfUp,
  priceAtGrossMargin,
  quarterHours,
  roundMoneyUp,
  sumQuarterHours,
} from "@/domain/quote/arithmetic";

describe("domain arithmetic", () => {
  it.each([
    [0, 3, 0],
    [1, 2, 1],
    [1, 3, 0],
    [2, 3, 1],
    [3, 2, 2],
  ])("rounds %i / %i half up to %i", (numerator, denominator, expected) => {
    expect(divideHalfUp(numerator, denominator)).toBe(expected);
  });

  it("keeps effort-cost multiplication exact before division", () => {
    expect(
      effortCost(quarterHours(90_000_000), moneyMinor(100_000_000), 4),
    ).toBe(2_250_000_000_000_000);
  });

  it("performs exact ratio math without binary currency arithmetic", () => {
    expect(multiplyRatioHalfUp(101, 1_500, 10_000)).toBe(15);
    expect(multiplyRatioFloor(101, 1_500, 10_000)).toBe(15);
    expect(
      applyBasisPoints(moneyMinor(10_001), basisPoints(1_500), 10_000),
    ).toBe(1_500);
  });

  it("interpolates quarter-hour ranges at configurable positions", () => {
    expect(
      interpolateQuarterHours(
        quarterHours(40),
        quarterHours(64),
        basisPoints(0),
        10_000,
      ),
    ).toBe(40);
    expect(
      interpolateQuarterHours(
        quarterHours(40),
        quarterHours(64),
        basisPoints(5_000),
        10_000,
      ),
    ).toBe(52);
    expect(
      interpolateQuarterHours(
        quarterHours(40),
        quarterHours(64),
        basisPoints(10_000),
        10_000,
      ),
    ).toBe(64);
  });

  it("calculates effort cost and gross-margin price correctly", () => {
    expect(effortCost(quarterHours(5), moneyMinor(10_000), 4)).toBe(12_500);
    expect(
      priceAtGrossMargin(moneyMinor(80_000), basisPoints(2_000), 10_000),
    ).toBe(100_000);
    expect(
      priceAtGrossMargin(moneyMinor(100), basisPoints(5_000), 10_000),
    ).toBe(200);
  });

  it.each([
    [0, 1_000, 0],
    [1_000, 1_000, 1_000],
    [1_001, 1_000, 2_000],
    [1_999, 1_000, 2_000],
    [2_000, 1_000, 2_000],
    [9_999_999, 1_000, 10_000_000],
  ])("rounds %i upward to increment %i", (value, increment, expected) => {
    expect(roundMoneyUp(moneyMinor(value), moneyMinor(increment))).toBe(
      expected,
    );
  });

  it("sums branded quarter-hours", () => {
    expect(
      sumQuarterHours([quarterHours(1), quarterHours(2), quarterHours(3)]),
    ).toBe(6);
  });

  it.each([
    () => moneyMinor(-1),
    () => moneyMinor(1.5),
    () => basisPoints(Number.NaN),
    () => quarterHours(Number.POSITIVE_INFINITY),
    () => divideHalfUp(1, 0),
    () => multiplyRatioHalfUp(1, 1, 0),
    () => multiplyRatioFloor(1, 1, 0),
    () =>
      interpolateQuarterHours(
        quarterHours(2),
        quarterHours(1),
        basisPoints(0),
        10_000,
      ),
    () => priceAtGrossMargin(moneyMinor(100), basisPoints(10_000), 10_000),
    () => roundMoneyUp(moneyMinor(100), moneyMinor(0)),
  ])("rejects invalid numeric operations", (operation) => {
    expect(operation).toThrow(RangeError);
  });

  it("rejects results outside the safe integer range", () => {
    expect(() => multiplyRatioHalfUp(Number.MAX_SAFE_INTEGER, 2, 1)).toThrow(
      /safe integer range/,
    );
  });
});
