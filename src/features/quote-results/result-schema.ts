import { z } from "zod";

import { assertQuoteResultInvariants } from "@/domain/quote/invariants";
import type { QuoteResultV1 } from "@/domain/quote/types";

const nonnegative = z.number().int().safe().nonnegative();
const integer = z.number().int().safe();
const points = z.object({
  lowQh: nonnegative,
  expectedQh: nonnegative,
  highQh: nonnegative,
});
const priceRange = z.object({
  rawLowMinor: nonnegative,
  rawExpectedMinor: nonnegative,
  rawHighMinor: nonnegative,
  lowMinor: nonnegative,
  recommendedMinor: nonnegative,
  highMinor: nonnegative,
});
const resultSchema = z
  .object({
    resultVersion: z.literal("quote-result-v1"),
    modelVersion: z.string().min(1),
    pricingConfig: z.object({
      id: z.string().min(1),
      version: z.string().min(1),
      effectiveAt: z.string().min(1),
    }),
    input: z.object({
      inputVersion: z.literal("quote-input-v1"),
      project: z.object({
        projectType: z.enum([
          "landing",
          "business",
          "portfolio",
          "blog",
          "ecommerce",
          "webApp",
          "custom",
        ]),
        pageCount: nonnegative,
        currency: z.enum(["INR", "USD", "GBP", "EUR"]),
        clientContext: z.string().optional(),
      }),
      design: z.object({ mode: z.string() }),
      content: z.object({
        mode: z.string(),
        assetSourcing: z.boolean(),
        migration: z.string(),
      }),
      features: z.record(z.string(), z.boolean()),
      integrations: z.record(z.string(), nonnegative),
      delivery: z.object({
        testingLevel: z.string(),
        deploymentOwner: z.string(),
        urgency: z.string(),
        postLaunchSupportDays: nonnegative,
        maintenanceTier: z.string(),
        weeklyCapacityHours: nonnegative,
        includedRevisionRounds: nonnegative,
      }),
      pricing: z.object({
        hourlyValueMinor: nonnegative,
        targetMarginBp: nonnegative,
        contingency: z.string(),
        riskLevel: z.string(),
      }),
      normalization: z.object({
        appliedDependencies: z.array(
          z.object({
            code: z.string(),
            enabledFeature: z.string(),
            source: z.string(),
          }),
        ),
      }),
    }),
    effort: z.object({
      lineItems: z.array(
        z.object({
          id: z.string(),
          code: z.string(),
          category: z.string(),
          label: z.string(),
          quantity: nonnegative,
          sourceKey: z.string(),
          configPath: z.string(),
          effort: points,
        }),
      ),
      direct: points,
      complexityAdditional: points,
      testingOverhead: points,
      projectManagementOverhead: points,
      planned: points,
      contingencyQh: nonnegative,
      delivery: points,
      safeEffortQh: nonnegative,
    }),
    complexity: z.object({
      score: nonnegative,
      level: z.enum(["straightforward", "moderate", "complex", "advanced"]),
      multiplierBp: nonnegative,
      signals: z.array(
        z.object({
          code: z.string(),
          pointsEach: integer,
          count: nonnegative,
          totalPoints: integer,
          sourceKey: z.string(),
          configPath: z.string(),
        }),
      ),
    }),
    risk: z.object({
      level: z.enum(["low", "medium", "high"]),
      preference: z.enum(["lean", "balanced", "cautious"]),
      baseRateBp: nonnegative,
      adjustmentBp: integer,
      contingencyRateBp: nonnegative,
      contingencyQh: nonnegative,
    }),
    pricing: z.object({
      currency: z.enum(["INR", "USD", "GBP", "EUR"]),
      hourlyValueMinor: nonnegative,
      targetMarginBp: nonnegative,
      minimumSafeRawMinor: nonnegative,
      minimumSafeMinor: nonnegative,
      recommendedBeforeUrgencyRawMinor: nonnegative,
      recommendedBeforeUrgencyMinor: nonnegative,
      recommendedRawMinor: nonnegative,
      recommendedMinor: nonnegative,
      rangeLowRawMinor: nonnegative,
      rangeLowMinor: nonnegative,
      rangeHighRawMinor: nonnegative,
      rangeHighMinor: nonnegative,
      urgency: z.object({
        level: z.string(),
        rateBp: nonnegative,
        rawFeeMinor: nonnegative,
        displayedFeeMinor: nonnegative,
      }),
      roundingIncrementMinor: nonnegative,
    }),
    timeline: z.object({
      weeklyCapacityHours: nonnegative,
      lowWeeks: nonnegative,
      expectedWeeks: nonnegative,
      highWeeks: nonnegative,
      requiresCapacityConfirmation: z.boolean(),
    }),
    revisions: z.object({
      includedRounds: nonnegative,
      extraRoundEffort: points,
      extraRoundPrice: priceRange,
    }),
    changeOrders: z.array(
      z.object({
        code: z.string(),
        effort: points.optional(),
        price: priceRange,
        assumptions: z.array(z.string()),
      }),
    ),
    maintenance: z.object({
      tier: z.string(),
      included: z.boolean(),
      monthlyEffort: points.optional(),
      monthlyPrice: priceRange.optional(),
    }),
    payment: z.object({
      depositPercentBp: nonnegative,
      depositAmountMinor: nonnegative,
      milestones: z
        .array(
          z.object({
            code: z.string(),
            label: z.string(),
            percentBp: nonnegative,
            amountMinor: nonnegative,
          }),
        )
        .min(1),
    }),
    scope: z.array(
      z.object({
        code: z.string(),
        details: z.record(
          z.string(),
          z.union([z.string(), z.number(), z.boolean()]),
        ),
      }),
    ),
    exclusions: z.array(
      z.object({ code: z.string(), conditional: z.boolean() }),
    ),
    warnings: z.array(
      z.object({
        code: z.string(),
        severity: z.enum(["notice", "discoveryRecommended"]),
        sourceKeys: z.array(z.string()),
        details: z.record(
          z.string(),
          z.union([z.string(), z.number(), z.boolean()]),
        ),
      }),
    ),
    ledger: z.object({
      effort: z
        .array(
          z.object({
            code: z.string(),
            amountQh: nonnegative,
            configPath: z.string(),
          }),
        )
        .min(5),
      pricing: z
        .array(
          z.object({
            code: z.string(),
            inputMinor: nonnegative,
            deltaMinor: integer,
            outputMinor: nonnegative,
            rateBp: nonnegative.optional(),
            configPath: z.string(),
          }),
        )
        .min(1),
    }),
  })
  .superRefine((value, context) => {
    if (value.maintenance.included && !value.maintenance.monthlyPrice)
      context.addIssue({
        code: "custom",
        path: ["maintenance", "monthlyPrice"],
        message: "Included maintenance needs a price.",
      });
    for (const required of ["additionalPage", "hourlyOutOfScope"]) {
      if (!value.changeOrders.some((item) => item.code === required))
        context.addIssue({
          code: "custom",
          path: ["changeOrders"],
          message: `Missing ${required} term.`,
        });
    }
  });

export function parseStoredQuoteResult(value: unknown): QuoteResultV1 | null {
  if (!resultSchema.safeParse(value).success) return null;
  try {
    assertQuoteResultInvariants(value as QuoteResultV1);
    return value as QuoteResultV1;
  } catch {
    return null;
  }
}
