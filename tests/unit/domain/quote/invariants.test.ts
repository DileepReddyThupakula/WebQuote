import {
  calculateQuote,
  moneyMinor,
  PRICING_CONFIG_V1,
  quarterHours,
} from "@/domain/quote";
import type {
  PricingConfigV1,
  PricingConfigV1Input,
} from "@/domain/quote/config/schema";
import { calculateComplexity } from "@/domain/quote/complexity";
import { assertQuoteResultInvariants } from "@/domain/quote/invariants";
import { calculateMilestones } from "@/domain/quote/milestones";
import { normalizeQuoteInput } from "@/domain/quote/normalization";
import type { QuoteResultV1 } from "@/domain/quote/types";
import { makeQuoteInput } from "../../../fixtures/quotes/v1";
import { calculateResult } from "./helpers";

type DeepMutable<T> = T extends number | string | boolean | null | undefined
  ? T
  : T extends readonly (infer Item)[]
    ? DeepMutable<Item>[]
    : T extends object
      ? { -readonly [Key in keyof T]: DeepMutable<T[Key]> }
      : T;

const mutableResult = () =>
  structuredClone(
    calculateResult(makeQuoteInput()),
  ) as unknown as DeepMutable<QuoteResultV1>;

describe("result invariant guard", () => {
  it("rejects negative/non-integer and unordered effort", () => {
    const negative = mutableResult();
    negative.effort.direct.lowQh =
      -1 as QuoteResultV1["effort"]["direct"]["lowQh"];
    expect(() => assertQuoteResultInvariants(negative)).toThrow(/non-negative/);

    const unordered = mutableResult();
    unordered.effort.direct.lowQh = quarterHours(
      unordered.effort.direct.expectedQh + 1,
    );
    expect(() => assertQuoteResultInvariants(unordered)).toThrow(/not ordered/);
  });

  it("rejects an unreconciled effort ledger", () => {
    const result = mutableResult();
    result.ledger.effort[0]!.amountQh = quarterHours(
      result.ledger.effort[0]!.amountQh + 1,
    );
    expect(() => assertQuoteResultInvariants(result)).toThrow(/effort ledger/);
  });

  it("rejects price ordering and downward commercial rounding", () => {
    const ordering = mutableResult();
    ordering.pricing.rangeLowMinor = moneyMinor(
      ordering.pricing.minimumSafeMinor - 1,
    );
    expect(() => assertQuoteResultInvariants(ordering)).toThrow(/not ordered/);

    const floor = mutableResult();
    floor.pricing.minimumSafeRawMinor = moneyMinor(
      floor.pricing.minimumSafeMinor + 1,
    );
    expect(() => assertQuoteResultInvariants(floor)).toThrow(/safe floor/);

    const recommendation = mutableResult();
    recommendation.pricing.recommendedRawMinor = moneyMinor(
      recommendation.pricing.recommendedMinor + 1,
    );
    expect(() => assertQuoteResultInvariants(recommendation)).toThrow(
      /recommendation/,
    );
  });

  it("rejects unreconciled price ledger stages and final output", () => {
    const final = mutableResult();
    final.ledger.pricing.at(-1)!.outputMinor = moneyMinor(
      final.pricing.recommendedMinor + 1,
    );
    expect(() => assertQuoteResultInvariants(final)).toThrow(/Price ledger/);

    const stage = mutableResult();
    stage.ledger.pricing[0]!.deltaMinor = moneyMinor(
      stage.ledger.pricing[0]!.deltaMinor + 1,
    );
    expect(() => assertQuoteResultInvariants(stage)).toThrow(
      /does not reconcile/,
    );
  });

  it("rejects milestone percentage and money discrepancies", () => {
    const percent = mutableResult();
    percent.payment.milestones[0]!.percentBp = (percent.payment.milestones[0]!
      .percentBp +
      1) as QuoteResultV1["payment"]["milestones"][number]["percentBp"];
    expect(() => assertQuoteResultInvariants(percent)).toThrow(/percentages/);

    const money = mutableResult();
    money.payment.milestones[0]!.amountMinor = moneyMinor(
      money.payment.milestones[0]!.amountMinor + 1,
    );
    expect(() => assertQuoteResultInvariants(money)).toThrow(/amounts/);
  });
});

describe("defensive calculation failures", () => {
  it("returns a typed calculation failure when a forged config has no complexity band", () => {
    const forgedInput = structuredClone(
      PRICING_CONFIG_V1,
    ) as PricingConfigV1Input;
    forgedInput.complexity.bands = [];
    const forged = forgedInput as unknown as PricingConfigV1;
    const outcome = calculateQuote(makeQuoteInput(), forged);
    expect(outcome).toMatchObject({
      ok: false,
      issues: [{ code: "calculation_invariant" }],
    });

    const normalized = normalizeQuoteInput(makeQuoteInput(), PRICING_CONFIG_V1);
    expect(() => calculateComplexity(normalized, forged)).toThrow(
      /no complexity band/i,
    );
  });

  it("rejects an elevated-deposit schedule that cannot fund the increase", () => {
    const result = calculateResult(makeQuoteInput());
    const forgedInput = structuredClone(
      PRICING_CONFIG_V1,
    ) as PricingConfigV1Input;
    forgedInput.milestones.schedules.short = [
      { code: "start", label: "Start", percentBp: 1_000 },
      { code: "end", label: "End", percentBp: 9_000 },
    ];
    const highRiskInput = normalizeQuoteInput(
      makeQuoteInput({
        pricing: { ...makeQuoteInput().pricing, riskLevel: "high" },
      }),
      PRICING_CONFIG_V1,
    );
    expect(() =>
      calculateMilestones(
        result.pricing.recommendedMinor,
        1,
        result.complexity,
        highRiskInput,
        forgedInput as unknown as PricingConfigV1,
      ),
    ).toThrow(/cannot fund/);
  });
});
