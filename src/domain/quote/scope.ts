import type { NormalizedQuoteInputV1 } from "@/domain/quote/types";

export function generateScope(input: NormalizedQuoteInputV1) {
  const scope: Array<{
    code: string;
    details: Record<string, number | string | boolean>;
  }> = [
    {
      code: "project",
      details: {
        projectType: input.project.projectType,
        pageCount: input.project.pageCount,
      },
    },
    { code: "design", details: { mode: input.design.mode } },
    {
      code: "content",
      details: {
        mode: input.content.mode,
        assetSourcing: input.content.assetSourcing,
        migration: input.content.migration,
      },
    },
    {
      code: "delivery",
      details: {
        testingLevel: input.delivery.testingLevel,
        deploymentOwner: input.delivery.deploymentOwner,
        includedRevisionRounds: input.delivery.includedRevisionRounds,
        postLaunchSupportDays: input.delivery.postLaunchSupportDays,
      },
    },
  ];
  for (const [feature, enabled] of Object.entries(input.features)) {
    if (enabled)
      scope.push({ code: `feature-${feature}`, details: { enabled } });
  }
  for (const [integration, count] of Object.entries(input.integrations)) {
    if (count > 0) {
      scope.push({ code: `integration-${integration}`, details: { count } });
    }
  }
  if (input.delivery.maintenanceTier !== "none") {
    scope.push({
      code: "maintenance",
      details: { tier: input.delivery.maintenanceTier },
    });
  }
  return scope;
}

export function generateExclusions(input: NormalizedQuoteInputV1) {
  const exclusions = [
    "outside-approved-scope",
    "unlimited-revisions",
    "third-party-fees",
    "client-delay",
    "tax-legal-compliance",
    "accessibility-certification",
    "security-audit",
    "performance-sla",
  ].map((code) => ({ code, conditional: false }));
  const conditional = (
    condition: boolean,
    code: string,
  ): Readonly<{ code: string; conditional: boolean }> | undefined =>
    condition ? { code, conditional: true } : undefined;
  return [
    ...exclusions,
    conditional(input.content.mode !== "copywriting", "copywriting"),
    conditional(!input.content.assetSourcing, "asset-sourcing-licensing"),
    conditional(input.content.migration === "none", "content-data-migration"),
    conditional(input.delivery.deploymentOwner === "client", "deployment"),
    conditional(input.integrations.customApi === 0, "custom-integrations"),
    conditional(input.features.ecommerce, "catalogue-data-entry"),
    conditional(
      input.delivery.maintenanceTier === "none",
      "ongoing-maintenance",
    ),
  ].filter((item): item is { code: string; conditional: boolean } =>
    Boolean(item),
  );
}
