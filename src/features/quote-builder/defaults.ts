import type { FeatureKey, IntegrationKey } from "@/domain/quote/types";

import type { QuoteBuilderDraft } from "@/features/quote-builder/types";

export const FEATURE_KEYS: readonly FeatureKey[] = [
  "contactForm",
  "blogCms",
  "search",
  "authentication",
  "userAccounts",
  "adminDashboard",
  "booking",
  "payments",
  "ecommerce",
  "membership",
  "subscriptions",
];

export const INTEGRATION_KEYS: readonly IntegrationKey[] = [
  "crm",
  "emailMarketing",
  "analytics",
  "maps",
  "otherStandard",
  "thirdPartyApi",
  "customApi",
];

function createFeatureDefaults(): Record<FeatureKey, boolean> {
  return Object.fromEntries(FEATURE_KEYS.map((key) => [key, false])) as Record<
    FeatureKey,
    boolean
  >;
}

function createIntegrationDefaults(): Record<IntegrationKey, string> {
  return Object.fromEntries(
    INTEGRATION_KEYS.map((key) => [key, "0"]),
  ) as Record<IntegrationKey, string>;
}

export function createDefaultDraft(): QuoteBuilderDraft {
  return {
    inputVersion: "quote-input-v1",
    project: {
      projectType: "business",
      pageCount: "5",
      currency: "INR",
      clientContext: "",
    },
    design: { mode: "template" },
    content: {
      mode: "provided",
      assetSourcing: false,
      migration: "none",
    },
    features: createFeatureDefaults(),
    integrations: createIntegrationDefaults(),
    delivery: {
      testingLevel: "essential",
      deploymentOwner: "freelancer",
      urgency: "standard",
      postLaunchSupportDays: "0",
      maintenanceTier: "none",
      weeklyCapacityHours: "",
      includedRevisionRounds: "2",
    },
    pricing: {
      hourlyValue: "",
      targetMarginPercent: "20",
      contingency: "balanced",
      riskLevel: "medium",
    },
    ui: { apiWorkEnabled: false },
  };
}
