import { z } from "zod";

import type { PricingConfigV1 } from "@/domain/quote/config/schema";
import type { QuoteInputV1, QuoteValidationIssue } from "@/domain/quote/types";

const currencySchema = z.enum(["INR", "USD", "GBP", "EUR"]);
const projectTypeSchema = z.enum([
  "landing",
  "business",
  "portfolio",
  "blog",
  "ecommerce",
  "webApp",
  "custom",
]);
const featureSchema = z.strictObject({
  contactForm: z.boolean(),
  blogCms: z.boolean(),
  search: z.boolean(),
  authentication: z.boolean(),
  userAccounts: z.boolean(),
  adminDashboard: z.boolean(),
  booking: z.boolean(),
  payments: z.boolean(),
  ecommerce: z.boolean(),
  membership: z.boolean(),
  subscriptions: z.boolean(),
});

export function createQuoteInputV1Schema(config: PricingConfigV1) {
  const integrationCount = z
    .number()
    .int()
    .safe()
    .min(config.validation.integrationCount.min)
    .max(config.validation.integrationCount.max);

  return z.strictObject({
    inputVersion: z.literal(config.identity.inputVersion),
    project: z.strictObject({
      projectType: projectTypeSchema,
      pageCount: z
        .number()
        .int()
        .safe()
        .min(config.validation.pageCount.min)
        .max(config.validation.pageCount.max),
      currency: currencySchema,
      clientContext: z
        .string()
        .trim()
        .min(1)
        .max(config.validation.clientContextMaxLength)
        .optional(),
    }),
    design: z.strictObject({
      mode: z.enum(["provided", "template", "custom", "fullUx"]),
    }),
    content: z.strictObject({
      mode: z.enum(["provided", "formatting", "copywriting"]),
      assetSourcing: z.boolean(),
      migration: z.enum(["none", "light", "standard", "complex"]),
    }),
    features: featureSchema,
    integrations: z.strictObject({
      crm: integrationCount,
      emailMarketing: integrationCount,
      analytics: integrationCount,
      maps: integrationCount,
      otherStandard: integrationCount,
      thirdPartyApi: integrationCount,
      customApi: integrationCount,
    }),
    delivery: z.strictObject({
      testingLevel: z.enum(["essential", "enhanced"]),
      deploymentOwner: z.enum(["client", "freelancer"]),
      urgency: z.enum(["standard", "priority", "rush"]),
      postLaunchSupportDays: z
        .number()
        .int()
        .refine(
          (value): value is QuoteInputV1["delivery"]["postLaunchSupportDays"] =>
            config.validation.supportDays.includes(
              value as QuoteInputV1["delivery"]["postLaunchSupportDays"],
            ),
          "Unsupported post-launch support duration.",
        ),
      maintenanceTier: z.enum(["none", "essential", "standard", "priority"]),
      weeklyCapacityHours: z
        .number()
        .int()
        .safe()
        .min(config.validation.weeklyCapacityHours.min)
        .max(config.validation.weeklyCapacityHours.max)
        .optional(),
      includedRevisionRounds: z
        .number()
        .int()
        .safe()
        .min(config.validation.revisionRounds.min)
        .max(config.validation.revisionRounds.max),
    }),
    pricing: z.strictObject({
      hourlyValueMinor: z
        .number()
        .int()
        .safe()
        .min(config.validation.hourlyValueMinor.min)
        .max(config.validation.hourlyValueMinor.max),
      targetMarginBp: z
        .number()
        .int()
        .safe()
        .min(config.validation.targetMarginBp.min)
        .max(config.validation.targetMarginBp.max),
      contingency: z.enum(["lean", "balanced", "cautious"]),
      riskLevel: z.enum(["low", "medium", "high"]),
    }),
  });
}

export function parseQuoteInputV1(
  input: unknown,
  config: PricingConfigV1,
):
  | Readonly<{ ok: true; value: QuoteInputV1 }>
  | Readonly<{ ok: false; issues: readonly QuoteValidationIssue[] }> {
  const result = createQuoteInputV1Schema(config).safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data as QuoteInputV1 };
  }

  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      code: issue.code,
      message: issue.message,
    })),
  };
}
