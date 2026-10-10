import {
  ACTIVE_PRICING_CONFIG,
  PRICING_CONFIG_REGISTRY,
  PRICING_CONFIG_V1,
  PRICING_CONFIG_V2,
  parsePricingConfigV1,
  type QuoteInputV1,
} from "@/domain/quote";
import { parseStoredQuoteResult } from "@/features/quote-results/result-schema";

import { auditSamples } from "../../../fixtures/quotes/audit-samples";
import { quoteFixtures } from "../../../fixtures/quotes/v1";
import { calculateResult } from "./helpers";

const sample = (id: number) => auditSamples.find((item) => item.id === id)!;
const baseInput = sample(3).input; // 5-page business, 2 rounds, 0 support days

function withDelivery(
  input: QuoteInputV1,
  delivery: Partial<QuoteInputV1["delivery"]>,
): QuoteInputV1 {
  return { ...input, delivery: { ...input.delivery, ...delivery } };
}

const v2 = (input: QuoteInputV1) => calculateResult(input, PRICING_CONFIG_V2);
const v1 = (input: QuoteInputV1) => calculateResult(input, PRICING_CONFIG_V1);

describe("pricing config v2", () => {
  it("changes no v1 effort, overhead, risk, urgency, rounding or milestone number", () => {
    const { identity: v1Identity, ...v1Rest } = PRICING_CONFIG_V1;
    const { identity: v2Identity, includedWork, ...v2Rest } = PRICING_CONFIG_V2;
    expect(v2Rest).toEqual(v1Rest);
    expect(v2Identity.modelVersion).toBe("webquote-pricing-v2");
    expect(v1Identity.modelVersion).toBe("webquote-pricing-v1");
    expect(includedWork).toBeDefined();
  });

  it("is the active calibration and coexists with v1 in the registry", () => {
    expect(ACTIVE_PRICING_CONFIG).toBe(PRICING_CONFIG_REGISTRY.active);
    expect(ACTIVE_PRICING_CONFIG.identity.configVersion).toBe("2.0.0");
    expect(
      PRICING_CONFIG_REGISTRY.get("webquote-v1-calibration", "1.0.0"),
    ).toBeDefined();
    expect(
      PRICING_CONFIG_REGISTRY.get("webquote-v2-calibration", "2.0.0"),
    ).toBeDefined();
  });

  it("marks the support hours as uncalibrated placeholder values", () => {
    expect(PRICING_CONFIG_V2.includedWork?.postLaunchSupport.calibration).toBe(
      "uncalibrated-placeholder",
    );
    expect(
      v2(withDelivery(baseInput, { postLaunchSupportDays: 30 })).effort
        .includedWork?.supportCalibration,
    ).toBe("uncalibrated-placeholder");
  });

  it("stores the config version on each quote", () => {
    const newer = v2(baseInput);
    const older = v1(baseInput);
    expect(newer.modelVersion).toBe("webquote-pricing-v2");
    expect(newer.pricingConfig).toMatchObject({
      id: "webquote-v2-calibration",
      version: "2.0.0",
    });
    expect(older.modelVersion).toBe("webquote-pricing-v1");
    expect(older.pricingConfig).toMatchObject({
      id: "webquote-v1-calibration",
      version: "1.0.0",
    });
  });

  it("rejects a config missing a support duration or giving zero days effort", () => {
    type Mutable = {
      includedWork: {
        postLaunchSupport: {
          byDays: Record<string, { lowQh: number; highQh: number }>;
        };
      };
    };
    const clone = () =>
      JSON.parse(JSON.stringify(PRICING_CONFIG_V2)) as Mutable;
    const missing = clone();
    delete missing.includedWork.postLaunchSupport.byDays["30"];
    expect(() => parsePricingConfigV1(missing)).toThrow();
    const nonZero = clone();
    nonZero.includedWork.postLaunchSupport.byDays["0"] = {
      lowQh: 0,
      highQh: 4,
    };
    expect(() => parsePricingConfigV1(nonZero)).toThrow();
  });
});

describe("included revision rounds", () => {
  it("add nothing at or below the 2-round baseline (no discount)", () => {
    const reference = v2(
      withDelivery(baseInput, { includedRevisionRounds: 2 }),
    );
    for (const rounds of [0, 1, 2]) {
      const result = v2(
        withDelivery(baseInput, { includedRevisionRounds: rounds }),
      );
      expect(result.pricing.recommendedMinor).toBe(
        reference.pricing.recommendedMinor,
      );
      expect(result.effort.delivery).toEqual(reference.effort.delivery);
      expect(result.effort.includedWork?.revisionRounds.expectedQh).toBe(0);
    }
  });

  it("strictly raise effort and price above the baseline, monotonically", () => {
    const results = [2, 3, 4, 5].map((rounds) =>
      v2(withDelivery(baseInput, { includedRevisionRounds: rounds })),
    );
    for (let index = 1; index < results.length; index += 1) {
      expect(results[index]!.effort.delivery.expectedQh).toBeGreaterThan(
        results[index - 1]!.effort.delivery.expectedQh,
      );
      expect(results[index]!.pricing.recommendedMinor).toBeGreaterThan(
        results[index - 1]!.pricing.recommendedMinor,
      );
    }
  });

  it("add exactly rounds-above-baseline times the per-round effort", () => {
    const five = v2(withDelivery(baseInput, { includedRevisionRounds: 5 }));
    const perRound = five.revisions.extraRoundEffort;
    expect(five.effort.includedWork?.revisionRounds).toEqual({
      lowQh: perRound.lowQh * 3,
      expectedQh: perRound.expectedQh * 3,
      highQh: perRound.highQh * 3,
    });
  });
});

describe("post-launch support", () => {
  it("adds exactly zero effort for 0 days and the configured range otherwise", () => {
    const expected: Record<number, [number, number]> = {
      0: [0, 0],
      14: [2, 4],
      30: [4, 8],
      60: [8, 16],
    };
    for (const [days, [low, high]] of Object.entries(expected)) {
      const result = v2(
        withDelivery(baseInput, {
          postLaunchSupportDays: Number(days) as 0 | 14 | 30 | 60,
        }),
      );
      const support = result.effort.includedWork!.postLaunchSupport;
      expect(support.lowQh).toBe(low * 4);
      expect(support.highQh).toBe(high * 4);
      expect(support.expectedQh).toBe(((low + high) / 2) * 4);
    }
  });

  it("raises price monotonically with the support window", () => {
    const prices = ([0, 14, 30, 60] as const).map(
      (days) =>
        v2(withDelivery(baseInput, { postLaunchSupportDays: days })).pricing
          .recommendedMinor,
    );
    for (let index = 1; index < prices.length; index += 1) {
      expect(prices[index]).toBeGreaterThan(prices[index - 1]!);
    }
  });

  it("is not multiplied by complexity or percentage overheads", () => {
    const advanced = sample(8).input;
    const none = v2(withDelivery(advanced, { postLaunchSupportDays: 0 }));
    const sixty = v2(withDelivery(advanced, { postLaunchSupportDays: 60 }));
    expect(none.complexity.level).toBe("advanced");
    expect(sixty.effort.complexityAdditional).toEqual(
      none.effort.complexityAdditional,
    );
    expect(sixty.effort.testingOverhead).toEqual(none.effort.testingOverhead);
    expect(sixty.effort.projectManagementOverhead).toEqual(
      none.effort.projectManagementOverhead,
    );
    expect(
      sixty.effort.planned.expectedQh - none.effort.planned.expectedQh,
    ).toBe(12 * 4);
  });

  it("is excluded from the build timeline, while revision rounds are included", () => {
    const slow = withDelivery(baseInput, { weeklyCapacityHours: 5 });
    const plain = v2(slow);
    const support = v2(withDelivery(slow, { postLaunchSupportDays: 60 }));
    expect(support.effort.delivery.expectedQh).toBeGreaterThan(
      plain.effort.delivery.expectedQh,
    );
    expect(support.timeline).toEqual(plain.timeline);

    const rounds = v2(withDelivery(slow, { includedRevisionRounds: 5 }));
    expect(rounds.timeline.expectedWeeks).toBeGreaterThan(
      plain.timeline.expectedWeeks,
    );
  });
});

describe("pricing model v2 invariants and compatibility", () => {
  const inputs: readonly (readonly [string, QuoteInputV1])[] = [
    ...Object.entries(quoteFixtures),
    ...auditSamples.map(
      ({ id, label, input }) => [`audit ${id} ${label}`, input] as const,
    ),
  ];

  it.each(inputs)(
    "keeps ordered effort, reconciled ledgers and ordered prices: %s",
    (_name, input) => {
      for (const rounds of [0, 3, 5]) {
        for (const days of [0, 14, 60] as const) {
          const result = v2(
            withDelivery(input, {
              includedRevisionRounds: rounds,
              postLaunchSupportDays: days,
            }),
          );
          const { delivery, planned } = result.effort;
          expect(delivery.lowQh).toBeLessThanOrEqual(delivery.expectedQh);
          expect(delivery.expectedQh).toBeLessThanOrEqual(delivery.highQh);
          expect(
            result.ledger.effort.reduce((sum, item) => sum + item.amountQh, 0),
          ).toBe(delivery.expectedQh);
          expect(planned.expectedQh).toBeLessThanOrEqual(delivery.expectedQh);
          const { pricing } = result;
          expect(pricing.minimumSafeMinor).toBeLessThanOrEqual(
            pricing.rangeLowMinor,
          );
          expect(pricing.rangeLowMinor).toBeLessThanOrEqual(
            pricing.recommendedMinor,
          );
          expect(pricing.recommendedMinor).toBeLessThanOrEqual(
            pricing.rangeHighMinor,
          );
          expect(
            parseStoredQuoteResult(JSON.parse(JSON.stringify(result))),
          ).toEqual(result);
        }
      }
    },
  );

  it.each(inputs)(
    "matches v1 exactly when rounds <= 2 and there is no support window: %s",
    (_name, input) => {
      const plain = withDelivery(input, {
        includedRevisionRounds: 2,
        postLaunchSupportDays: 0,
      });
      const newer = v2(plain);
      const older = v1(plain);
      expect(newer.effort.delivery).toEqual(older.effort.delivery);
      expect(newer.pricing).toEqual(older.pricing);
      expect(newer.timeline).toEqual(older.timeline);
      expect(newer.payment).toEqual(older.payment);
    },
  );

  it("leaves v1 results without included-work fields", () => {
    const older = v1(withDelivery(baseInput, { postLaunchSupportDays: 60 }));
    expect(older.effort).not.toHaveProperty("includedWork");
    expect(older.ledger.effort.map(({ code }) => code)).not.toContain(
      "postLaunchSupportEffort",
    );
  });

  it("separates samples 12 and 13 from sample 3 under v2 (audit B4)", () => {
    const three = v2(sample(3).input);
    const twelve = v2(sample(12).input);
    const thirteen = v2(sample(13).input);
    expect(twelve.pricing.recommendedMinor).toBeGreaterThan(
      three.pricing.recommendedMinor,
    );
    expect(thirteen.pricing).toEqual(three.pricing);
  });
});
