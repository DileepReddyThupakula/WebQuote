import {
  basisPoints,
  calculateQuote,
  moneyMinor,
  parsePricingConfigV1,
  PRICING_CONFIG_V1,
} from "@/domain/quote";
import type { PricingConfigV1Input } from "@/domain/quote/config/schema";
import { calculateComplexity } from "@/domain/quote/complexity";
import { normalizeQuoteInput } from "@/domain/quote/normalization";
import type {
  CurrencyCode,
  DesignMode,
  MaintenanceTier,
  ProjectType,
  QuoteInputV1,
  RiskLevel,
  Urgency,
} from "@/domain/quote/types";
import { makeQuoteInput, quoteFixtures } from "../../../fixtures/quotes/v1";
import { calculateResult } from "./helpers";

function configured(
  version: string,
  mutate: (config: PricingConfigV1Input) => void,
) {
  const input = structuredClone(PRICING_CONFIG_V1) as PricingConfigV1Input;
  input.identity.configVersion = version;
  mutate(input);
  return parsePricingConfigV1(input);
}

describe("pricing engine fixtures", () => {
  it.each(Object.entries(quoteFixtures))(
    "calculates and reconciles %s",
    (_name, input) => {
      const result = calculateResult(input);

      expect(result.pricing.minimumSafeMinor).toBeLessThanOrEqual(
        result.pricing.rangeLowMinor,
      );
      expect(result.pricing.rangeLowMinor).toBeLessThanOrEqual(
        result.pricing.recommendedMinor,
      );
      expect(result.pricing.recommendedMinor).toBeLessThanOrEqual(
        result.pricing.rangeHighMinor,
      );
      expect(
        result.payment.milestones.reduce(
          (sum, milestone) => sum + milestone.percentBp,
          0,
        ),
      ).toBe(10_000);
      expect(
        result.payment.milestones.reduce(
          (sum, milestone) => sum + milestone.amountMinor,
          0,
        ),
      ).toBe(result.pricing.recommendedMinor);
      expect(result.ledger.pricing.at(-1)?.outputMinor).toBe(
        result.pricing.recommendedMinor,
      );
    },
  );

  it("is deterministic for identical input and config", () => {
    const first = calculateQuote(
      quoteFixtures.ecommerceWebsite,
      PRICING_CONFIG_V1,
    );
    const second = calculateQuote(
      quoteFixtures.ecommerceWebsite,
      PRICING_CONFIG_V1,
    );
    expect(first).toStrictEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it("retains a fully resolved historical result when a newer config is created", () => {
    const historical = calculateResult(quoteFixtures.smallBusinessSite);
    const historicalSnapshot = structuredClone(historical);
    const next = configured("1.1.0", (config) => {
      config.expectedEffortPositionBp = 6_000;
    });
    const recalculated = calculateResult(quoteFixtures.smallBusinessSite, next);

    expect(historical).toStrictEqual(historicalSnapshot);
    expect(historical.pricingConfig.version).toBe("1.0.0");
    expect(recalculated.pricingConfig.version).toBe("1.1.0");
    expect(recalculated.effort.direct.expectedQh).toBeGreaterThan(
      historical.effort.direct.expectedQh,
    );
  });
});

describe("scope, complexity, and risk separation", () => {
  const scoreFor = (input: QuoteInputV1) =>
    calculateComplexity(
      normalizeQuoteInput(input, PRICING_CONFIG_V1),
      PRICING_CONFIG_V1,
    );

  it.each([
    [makeQuoteInput(), 0, "straightforward"],
    [
      makeQuoteInput({
        features: { ...makeQuoteInput().features, authentication: true },
      }),
      2,
      "straightforward",
    ],
    [
      makeQuoteInput({
        features: {
          ...makeQuoteInput().features,
          authentication: true,
          userAccounts: true,
        },
      }),
      3,
      "moderate",
    ],
    [
      makeQuoteInput({
        features: {
          ...makeQuoteInput().features,
          authentication: true,
          userAccounts: true,
          ecommerce: true,
          payments: true,
        },
      }),
      7,
      "complex",
    ],
    [
      makeQuoteInput({
        integrations: {
          ...makeQuoteInput().integrations,
          analytics: 0,
          customApi: 4,
        },
      }),
      12,
      "advanced",
    ],
  ] as const)("maps score %i to %s", (input, score, level) => {
    expect(scoreFor(input)).toMatchObject({ score, level });
  });

  it("changes contingency and deposit for high risk without changing complexity or maintenance", () => {
    const low = calculateResult(
      makeQuoteInput({
        delivery: { ...makeQuoteInput().delivery, maintenanceTier: "standard" },
        pricing: { ...makeQuoteInput().pricing, riskLevel: "low" },
      }),
    );
    const high = calculateResult(
      makeQuoteInput({
        delivery: { ...makeQuoteInput().delivery, maintenanceTier: "standard" },
        pricing: { ...makeQuoteInput().pricing, riskLevel: "high" },
      }),
    );

    expect(high.complexity).toStrictEqual(low.complexity);
    expect(high.effort.complexityAdditional).toStrictEqual(
      low.effort.complexityAdditional,
    );
    expect(high.maintenance).toStrictEqual(low.maintenance);
    expect(high.risk.contingencyRateBp).toBeGreaterThan(
      low.risk.contingencyRateBp,
    );
    expect(high.effort.contingencyQh).toBeGreaterThan(low.effort.contingencyQh);
    expect(high.payment.depositPercentBp).toBeGreaterThanOrEqual(5_000);
  });

  it("reports concrete contributing signals", () => {
    const result = calculateResult(quoteFixtures.integrationHeavyCustom);
    expect(result.complexity.signals.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        "standard-integrations-after-free",
        "third-party-api",
        "custom-api",
        "complex-migration",
      ]),
    );
    expect(
      result.complexity.signals.every(
        ({ configPath }) => configPath.length > 0,
      ),
    ).toBe(true);
  });
});

describe("configuration matrices and monotonic invariants", () => {
  it.each<ProjectType>([
    "landing",
    "business",
    "portfolio",
    "blog",
    "ecommerce",
    "webApp",
    "custom",
  ])("supports project type %s", (projectType) => {
    expect(
      calculateResult(
        makeQuoteInput({
          project: { projectType, pageCount: 8, currency: "USD" },
        }),
      ).effort.direct.highQh,
    ).toBeGreaterThan(0);
  });

  it.each<CurrencyCode>(["INR", "USD", "GBP", "EUR"])(
    "supports currency %s without exchange conversion",
    (currency) => {
      const result = calculateResult(
        makeQuoteInput({ project: { ...makeQuoteInput().project, currency } }),
      );
      expect(result.pricing.currency).toBe(currency);
      expect(result.pricing.recommendedRawMinor).toBe(
        calculateResult(makeQuoteInput()).pricing.recommendedRawMinor,
      );
    },
  );

  it.each<DesignMode>(["provided", "template", "custom", "fullUx"])(
    "supports design mode %s",
    (mode) => {
      expect(
        calculateResult(makeQuoteInput({ design: { mode } })).effort.lineItems,
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: `design-${mode}` }),
        ]),
      );
    },
  );

  it.each<RiskLevel>(["low", "medium", "high"])(
    "supports risk level %s",
    (riskLevel) => {
      expect(
        calculateResult(
          makeQuoteInput({
            pricing: { ...makeQuoteInput().pricing, riskLevel },
          }),
        ).risk.level,
      ).toBe(riskLevel);
    },
  );

  it.each<Urgency>(["standard", "priority", "rush"])(
    "supports urgency %s",
    (urgency) => {
      const result = calculateResult(
        makeQuoteInput({ delivery: { ...makeQuoteInput().delivery, urgency } }),
      );
      expect(result.pricing.urgency.level).toBe(urgency);
    },
  );

  it.each<MaintenanceTier>(["none", "essential", "standard", "priority"])(
    "supports maintenance tier %s",
    (maintenanceTier) => {
      const result = calculateResult(
        makeQuoteInput({
          delivery: { ...makeQuoteInput().delivery, maintenanceTier },
        }),
      );
      expect(result.maintenance.included).toBe(maintenanceTier !== "none");
    },
  );

  it("adding pages or meaningful scope never reduces effort or price", () => {
    const base = calculateResult(makeQuoteInput());
    const pages = calculateResult(
      makeQuoteInput({
        project: { ...makeQuoteInput().project, pageCount: 8 },
      }),
    );
    const feature = calculateResult(
      makeQuoteInput({
        features: { ...makeQuoteInput().features, booking: true },
      }),
    );
    for (const larger of [pages, feature]) {
      expect(larger.effort.delivery.highQh).toBeGreaterThanOrEqual(
        base.effort.delivery.highQh,
      );
      expect(larger.pricing.minimumSafeMinor).toBeGreaterThanOrEqual(
        base.pricing.minimumSafeMinor,
      );
      expect(larger.pricing.recommendedMinor).toBeGreaterThanOrEqual(
        base.pricing.recommendedMinor,
      );
    }
  });

  it("higher hourly value, target margin, contingency, risk, and urgency never reduce price", () => {
    const base = calculateResult(makeQuoteInput());
    const variants = [
      makeQuoteInput({
        pricing: {
          ...makeQuoteInput().pricing,
          hourlyValueMinor: moneyMinor(12_000),
        },
      }),
      makeQuoteInput({
        pricing: {
          ...makeQuoteInput().pricing,
          targetMarginBp: basisPoints(3_000),
        },
      }),
      makeQuoteInput({
        pricing: { ...makeQuoteInput().pricing, contingency: "cautious" },
      }),
      makeQuoteInput({
        pricing: { ...makeQuoteInput().pricing, riskLevel: "high" },
      }),
      makeQuoteInput({
        delivery: { ...makeQuoteInput().delivery, urgency: "rush" },
      }),
    ];
    for (const input of variants) {
      expect(
        calculateResult(input).pricing.recommendedMinor,
      ).toBeGreaterThanOrEqual(base.pricing.recommendedMinor);
    }
  });

  it("calibrates expected effort at 0, 5000, and 10000 bp without engine changes", () => {
    const lowConfig = configured("1.0.1", (config) => {
      config.expectedEffortPositionBp = 0;
    });
    const highConfig = configured("1.0.2", (config) => {
      config.expectedEffortPositionBp = 10_000;
    });
    const low = calculateResult(makeQuoteInput(), lowConfig).effort.direct;
    const middle = calculateResult(makeQuoteInput()).effort.direct;
    const high = calculateResult(makeQuoteInput(), highConfig).effort.direct;
    expect(low.expectedQh).toBe(low.lowQh);
    expect(high.expectedQh).toBe(high.highQh);
    expect(middle.expectedQh).toBeGreaterThan(low.expectedQh);
    expect(middle.expectedQh).toBeLessThan(high.expectedQh);
  });
});
