import { basisPoints, PRICING_CONFIG_V1 } from "@/domain/quote";
import { applyBasisPoints } from "@/domain/quote/arithmetic";
import { calculateMilestones } from "@/domain/quote/milestones";
import type { ContingencyPreference, RiskLevel } from "@/domain/quote/types";
import { makeQuoteInput, quoteFixtures } from "../../../fixtures/quotes/v1";
import { calculateResult } from "./helpers";

describe("risk, urgency, safe floor, and timeline", () => {
  it.each<[ContingencyPreference, RiskLevel, number]>([
    ["lean", "low", 300],
    ["lean", "medium", 500],
    ["lean", "high", 1_000],
    ["balanced", "low", 800],
    ["balanced", "medium", 1_000],
    ["balanced", "high", 1_500],
    ["cautious", "low", 1_300],
    ["cautious", "medium", 1_500],
    ["cautious", "high", 2_000],
  ])(
    "maps %s contingency and %s risk to %i bp",
    (contingency, riskLevel, expected) => {
      const result = calculateResult(
        makeQuoteInput({
          pricing: { ...makeQuoteInput().pricing, contingency, riskLevel },
        }),
      );
      expect(result.risk.contingencyRateBp).toBe(expected);
    },
  );

  it.each([
    ["standard", 0],
    ["priority", 1_500],
    ["rush", 3_000],
  ] as const)(
    "applies the configured %s urgency surcharge",
    (urgency, rate) => {
      const result = calculateResult(
        makeQuoteInput({ delivery: { ...makeQuoteInput().delivery, urgency } }),
      );
      expect(result.pricing.urgency.rateBp).toBe(rate);
      expect(result.pricing.urgency.rawFeeMinor).toBe(
        applyBasisPoints(
          result.pricing.recommendedBeforeUrgencyRawMinor,
          basisPoints(rate),
          PRICING_CONFIG_V1.units.basisPointsScale,
        ),
      );
    },
  );

  it("never prices or rounds below the safe floor", () => {
    const result = calculateResult(
      makeQuoteInput({
        pricing: {
          ...makeQuoteInput().pricing,
          targetMarginBp: basisPoints(0),
        },
      }),
    );
    expect(
      result.pricing.recommendedBeforeUrgencyRawMinor,
    ).toBeGreaterThanOrEqual(result.pricing.minimumSafeRawMinor);
    expect(result.pricing.minimumSafeMinor).toBeGreaterThanOrEqual(
      result.pricing.minimumSafeRawMinor,
    );
    expect(result.ledger.pricing.map(({ code }) => code)).toEqual([
      "expectedLaborValue",
      "targetMarginAdjustment",
      "safeFloorAdjustment",
      "urgencySurcharge",
      "commercialRounding",
    ]);
  });

  it("capacity changes the timeline while urgency does not change effort or week math", () => {
    const slow = calculateResult(
      makeQuoteInput({
        delivery: { ...makeQuoteInput().delivery, weeklyCapacityHours: 10 },
      }),
    );
    const fast = calculateResult(
      makeQuoteInput({
        delivery: { ...makeQuoteInput().delivery, weeklyCapacityHours: 40 },
      }),
    );
    const rush = calculateResult(
      makeQuoteInput({
        delivery: { ...makeQuoteInput().delivery, urgency: "rush" },
      }),
    );
    const standard = calculateResult(makeQuoteInput());

    expect(slow.timeline.highWeeks).toBeGreaterThan(fast.timeline.highWeeks);
    expect(rush.effort).toStrictEqual(standard.effort);
    expect(rush.timeline.highWeeks).toBe(standard.timeline.highWeeks);
    expect(rush.timeline.requiresCapacityConfirmation).toBe(true);
  });
});

describe("revisions, change orders, maintenance, and milestones", () => {
  it("returns configuration-driven revision and change-order recommendations", () => {
    const result = calculateResult(quoteFixtures.smallBusinessSite);
    expect(result.revisions.includedRounds).toBe(2);
    expect(result.revisions.extraRoundEffort.lowQh).toBeGreaterThanOrEqual(
      PRICING_CONFIG_V1.revisions.minimumLowQh,
    );
    expect(result.revisions.extraRoundEffort.highQh).toBeGreaterThanOrEqual(
      PRICING_CONFIG_V1.revisions.minimumHighQh,
    );
    expect(result.changeOrders.map(({ code }) => code)).toEqual([
      "additionalPage",
      "additionalRevisionRound",
      "standardIntegration",
      "thirdPartyApi",
      "customApi",
      "urgentChange",
      "hourlyOutOfScope",
    ]);
    expect(
      result.changeOrders.every(
        ({ price }) =>
          price.lowMinor <= price.recommendedMinor &&
          price.recommendedMinor <= price.highMinor,
      ),
    ).toBe(true);
  });

  it("adds maintenance burden only from concrete scope and not generic risk", () => {
    const simple = calculateResult(
      makeQuoteInput({
        delivery: {
          ...makeQuoteInput().delivery,
          maintenanceTier: "essential",
        },
      }),
    );
    const integrationHeavy = calculateResult(
      quoteFixtures.integrationHeavyCustom,
    );
    const highRisk = calculateResult(
      makeQuoteInput({
        delivery: {
          ...makeQuoteInput().delivery,
          maintenanceTier: "essential",
        },
        pricing: { ...makeQuoteInput().pricing, riskLevel: "high" },
      }),
    );
    expect(integrationHeavy.maintenance.monthlyEffort!.highQh).toBeGreaterThan(
      simple.maintenance.monthlyEffort!.highQh,
    );
    expect(highRisk.maintenance).toStrictEqual(simple.maintenance);
  });

  it("adds the configured business-critical maintenance burden", () => {
    const ordinary = calculateResult(
      makeQuoteInput({
        delivery: { ...makeQuoteInput().delivery, maintenanceTier: "standard" },
      }),
    );
    const businessCritical = calculateResult(
      makeQuoteInput({
        features: { ...makeQuoteInput().features, payments: true },
        delivery: { ...makeQuoteInput().delivery, maintenanceTier: "standard" },
      }),
    );
    expect(businessCritical.maintenance.monthlyEffort!.highQh).toBeGreaterThan(
      ordinary.maintenance.monthlyEffort!.highQh,
    );
  });

  it("selects short, medium, and long milestone structures", () => {
    const result = calculateResult(makeQuoteInput());
    const input = result.input;
    const short = calculateMilestones(
      result.pricing.recommendedMinor,
      4,
      result.complexity,
      input,
      PRICING_CONFIG_V1,
    );
    const medium = calculateMilestones(
      result.pricing.recommendedMinor,
      5,
      result.complexity,
      input,
      PRICING_CONFIG_V1,
    );
    const advanced = { ...result.complexity, level: "advanced" as const };
    const long = calculateMilestones(
      result.pricing.recommendedMinor,
      5,
      advanced,
      input,
      PRICING_CONFIG_V1,
    );
    expect(short.milestones).toHaveLength(3);
    expect(medium.milestones).toHaveLength(4);
    expect(long.milestones).toHaveLength(5);
  });

  it("raises high-risk and rush deposits to at least 50% and reconciles exact money", () => {
    for (const input of [
      quoteFixtures.highRiskModerateComplexity,
      quoteFixtures.rushProject,
    ]) {
      const result = calculateResult(input);
      expect(result.payment.depositPercentBp).toBeGreaterThanOrEqual(5_000);
      expect(
        result.payment.milestones.reduce(
          (sum, milestone) => sum + milestone.amountMinor,
          0,
        ),
      ).toBe(result.pricing.recommendedMinor);
    }
  });
});

describe("warnings, scope, and exclusions", () => {
  it("emits documented discovery warnings for the integration-heavy fixture", () => {
    const warnings = calculateResult(
      quoteFixtures.integrationHeavyCustom,
    ).warnings.map(({ code }) => code);
    expect(warnings).toEqual(
      expect.arrayContaining([
        "integration-discovery",
        "complex-migration",
        "advanced-complexity",
        "high-risk",
        "custom-api-discovery",
        "several-custom-apis",
      ]),
    );
  });

  it("emits complex commerce, web-app, large-scope, zero-margin, and rush-capacity warnings", () => {
    const input = makeQuoteInput({
      project: { projectType: "webApp", pageCount: 51, currency: "USD" },
      features: {
        ...makeQuoteInput().features,
        authentication: true,
        adminDashboard: true,
        payments: true,
        ecommerce: true,
        membership: true,
        subscriptions: true,
      },
      delivery: {
        ...makeQuoteInput().delivery,
        urgency: "rush",
        weeklyCapacityHours: 10,
      },
      pricing: {
        ...makeQuoteInput().pricing,
        targetMarginBp: basisPoints(0),
      },
    });
    const warningCodes = calculateResult(input).warnings.map(
      ({ code }) => code,
    );
    expect(warningCodes).toEqual(
      expect.arrayContaining([
        "complex-commerce",
        "complex-web-app",
        "large-scope",
        "zero-margin",
        "rush-capacity-confirmation",
      ]),
    );
  });

  it("creates deterministic structured scope and conditional exclusions", () => {
    const result = calculateResult(quoteFixtures.ecommerceWebsite);
    expect(result.scope.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        "project",
        "design",
        "content",
        "feature-ecommerce",
        "maintenance",
      ]),
    );
    expect(result.exclusions.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        "outside-approved-scope",
        "unlimited-revisions",
        "catalogue-data-entry",
      ]),
    );
  });
});
