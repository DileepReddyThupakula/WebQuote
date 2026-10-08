import type { PricingConfigV1 } from "@/domain/quote/config/schema";
import type {
  NormalizedQuoteInputV1,
  QuoteResultV1,
  QuoteWarning,
} from "@/domain/quote/types";

export function generateWarnings(
  input: NormalizedQuoteInputV1,
  complexity: QuoteResultV1["complexity"],
  config: PricingConfigV1,
): readonly QuoteWarning[] {
  const warnings: QuoteWarning[] = [];
  const add = (
    warning: Omit<QuoteWarning, "severity"> &
      Readonly<{ severity?: QuoteWarning["severity"] }>,
  ) => {
    warnings.push({ severity: "discoveryRecommended", ...warning });
  };

  const integrationTotal = Object.values(input.integrations).reduce(
    (total, count) => total + count,
    0,
  );
  if (integrationTotal > config.warnings.integrationDiscoveryThreshold) {
    add({
      code: "integration-discovery",
      sourceKeys: ["integrations"],
      details: { integrationTotal },
    });
  }
  if (input.content.migration === "complex") {
    add({
      code: "complex-migration",
      sourceKeys: ["content.migration"],
      details: { migration: "complex" },
    });
  }
  if (complexity.level === "advanced") {
    add({
      code: "advanced-complexity",
      sourceKeys: complexity.signals.map(({ sourceKey }) => sourceKey),
      details: { score: complexity.score },
    });
  }
  if (input.pricing.riskLevel === "high") {
    add({
      code: "high-risk",
      severity: "notice",
      sourceKeys: ["pricing.riskLevel"],
      details: { riskLevel: "high" },
    });
  }
  if (input.integrations.customApi > 0) {
    add({
      code: "custom-api-discovery",
      sourceKeys: ["integrations.customApi"],
      details: { count: input.integrations.customApi },
    });
  }
  if (
    input.integrations.customApi >= config.warnings.severalCustomApisThreshold
  ) {
    add({
      code: "several-custom-apis",
      sourceKeys: ["integrations.customApi"],
      details: { count: input.integrations.customApi },
    });
  }

  const commerceSignals = [
    input.features.subscriptions,
    input.features.membership,
    input.features.adminDashboard,
  ].filter(Boolean).length;
  if (
    input.features.ecommerce &&
    commerceSignals >= config.warnings.complexCommerceFeatureThreshold
  ) {
    add({
      code: "complex-commerce",
      sourceKeys: [
        "features.ecommerce",
        "features.subscriptions",
        "features.membership",
        "features.adminDashboard",
      ],
      details: { commerceSignals },
    });
  }
  if (
    input.project.projectType === "webApp" &&
    input.features.authentication &&
    input.features.adminDashboard &&
    input.features.payments
  ) {
    add({
      code: "complex-web-app",
      sourceKeys: [
        "project.projectType",
        "features.authentication",
        "features.adminDashboard",
        "features.payments",
      ],
      details: { matched: true },
    });
  }
  if (input.project.pageCount > config.warnings.largeScopePageThreshold) {
    add({
      code: "large-scope",
      sourceKeys: ["project.pageCount"],
      details: { pageCount: input.project.pageCount },
    });
  }
  if (input.pricing.targetMarginBp === 0) {
    add({
      code: "zero-margin",
      severity: "notice",
      sourceKeys: ["pricing.targetMarginBp"],
      details: { targetMarginBp: 0 },
    });
  }
  if (
    input.delivery.urgency !== "standard" &&
    input.delivery.weeklyCapacityHours <
      config.warnings.rushCapacityThresholdHours
  ) {
    add({
      code: "rush-capacity-confirmation",
      severity: "notice",
      sourceKeys: ["delivery.urgency", "delivery.weeklyCapacityHours"],
      details: {
        urgency: input.delivery.urgency,
        weeklyCapacityHours: input.delivery.weeklyCapacityHours,
      },
    });
  }

  return warnings;
}
