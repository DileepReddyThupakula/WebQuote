import {
  basisPoints,
  interpolateQuarterHours,
  multiplyRatioHalfUp,
  quarterHours,
  sumQuarterHours,
} from "@/domain/quote/arithmetic";
import type { PricingConfigV1 } from "@/domain/quote/config/schema";
import type {
  ComplexityLevel,
  EffortCategory,
  EffortLineItem,
  EffortPoints,
  FeatureKey,
  IntegrationKey,
  NormalizedQuoteInputV1,
  QuarterHours,
} from "@/domain/quote/types";

const featureLabels: Readonly<Record<FeatureKey, string>> = {
  contactForm: "Contact form",
  blogCms: "Blog and CMS",
  search: "Search",
  authentication: "Authentication",
  userAccounts: "User accounts",
  adminDashboard: "Admin dashboard",
  booking: "Booking",
  payments: "Payments",
  ecommerce: "Ecommerce",
  membership: "Membership",
  subscriptions: "Subscriptions",
};

const integrationLabels: Readonly<Record<IntegrationKey, string>> = {
  crm: "CRM integration",
  emailMarketing: "Email marketing integration",
  analytics: "Analytics integration",
  maps: "Maps integration",
  otherStandard: "Standard third-party integration",
  thirdPartyApi: "Third-party API integration",
  customApi: "Custom API integration",
};

export function effortPointsFromRange(
  lowQh: number,
  highQh: number,
  config: PricingConfigV1,
): EffortPoints {
  const low = quarterHours(lowQh);
  const high = quarterHours(highQh);
  return {
    lowQh: low,
    expectedQh: interpolateQuarterHours(
      low,
      high,
      basisPoints(config.expectedEffortPositionBp),
      config.units.basisPointsScale,
    ),
    highQh: high,
  };
}

function pageContext(
  projectType: NormalizedQuoteInputV1["project"]["projectType"],
): "standard" | "ecommerce" | "webApp" {
  if (projectType === "ecommerce") return "ecommerce";
  if (projectType === "webApp") return "webApp";
  return "standard";
}

export function buildDirectEffortLines(
  input: NormalizedQuoteInputV1,
  config: PricingConfigV1,
): readonly EffortLineItem[] {
  const lines: EffortLineItem[] = [];
  const add = (
    code: string,
    category: EffortCategory,
    label: string,
    quantity: number,
    range: Readonly<{ lowQh: number; highQh: number }>,
    sourceKey: string,
    configPath: string,
  ) => {
    if (quantity <= 0 || (range.lowQh === 0 && range.highQh === 0)) return;
    lines.push({
      id: `effort:${code}`,
      code,
      category,
      label,
      quantity,
      sourceKey,
      configPath,
      effort: effortPointsFromRange(
        range.lowQh * quantity,
        range.highQh * quantity,
        config,
      ),
    });
  };

  const projectType = input.project.projectType;
  const projectConfig = config.effort.projectTypes[projectType];
  const additionalPages = Math.max(
    0,
    input.project.pageCount - projectConfig.includedPages,
  );
  add(
    `project-${projectType}`,
    "projectFoundation",
    "Project foundation",
    1,
    projectConfig.range,
    "project.projectType",
    `effort.projectTypes.${projectType}.range`,
  );
  const context = pageContext(projectType);
  add(
    "additional-pages",
    "pages",
    "Additional pages or screens",
    additionalPages,
    config.effort.pages[context],
    "project.pageCount",
    `effort.pages.${context}`,
  );

  const designMode = input.design.mode;
  add(
    `design-${designMode}`,
    "design",
    "Shared design work",
    1,
    config.effort.design[designMode].shared,
    "design.mode",
    `effort.design.${designMode}.shared`,
  );
  add(
    `design-${designMode}-additional-pages`,
    "design",
    "Additional-page design work",
    additionalPages,
    config.effort.design[designMode].additionalPage,
    "project.pageCount",
    `effort.design.${designMode}.additionalPage`,
  );

  const contentMode = input.content.mode;
  add(
    `content-${contentMode}`,
    "content",
    "Content work",
    input.project.pageCount,
    config.effort.contentPerPage[contentMode],
    "content.mode",
    `effort.contentPerPage.${contentMode}`,
  );
  if (input.content.assetSourcing) {
    add(
      "asset-sourcing",
      "content",
      "Asset sourcing",
      input.project.pageCount,
      config.effort.assetSourcingPerPage,
      "content.assetSourcing",
      "effort.assetSourcingPerPage",
    );
  }

  for (const key of Object.keys(input.features) as FeatureKey[]) {
    if (input.features[key]) {
      add(
        `feature-${key}`,
        "features",
        featureLabels[key],
        1,
        config.effort.features[key],
        `features.${key}`,
        `effort.features.${key}`,
      );
    }
  }
  for (const key of Object.keys(input.integrations) as IntegrationKey[]) {
    add(
      `integration-${key}`,
      "integrations",
      integrationLabels[key],
      input.integrations[key],
      config.effort.integrations[key],
      `integrations.${key}`,
      `effort.integrations.${key}`,
    );
  }

  const migration = input.content.migration;
  add(
    `migration-${migration}`,
    "migration",
    "Content or data migration",
    1,
    config.effort.migration[migration],
    "content.migration",
    `effort.migration.${migration}`,
  );
  const deployment = input.delivery.deploymentOwner;
  add(
    `deployment-${deployment}`,
    "deployment",
    "Deployment responsibility",
    1,
    config.effort.deployment[deployment],
    "delivery.deploymentOwner",
    `effort.deployment.${deployment}`,
  );

  return lines;
}

export function sumEffortLines(lines: readonly EffortLineItem[]): EffortPoints {
  return {
    lowQh: sumQuarterHours(lines.map(({ effort }) => effort.lowQh)),
    expectedQh: sumQuarterHours(lines.map(({ effort }) => effort.expectedQh)),
    highQh: sumQuarterHours(lines.map(({ effort }) => effort.highQh)),
  };
}

function multiplyEffort(
  value: QuarterHours,
  multiplierBp: number,
  scale: number,
): QuarterHours {
  return quarterHours(multiplyRatioHalfUp(value, multiplierBp, scale));
}

export function applyEffortMultiplier(
  effort: EffortPoints,
  multiplierBp: number,
  scale: number,
): EffortPoints {
  return {
    lowQh: multiplyEffort(effort.lowQh, multiplierBp, scale),
    expectedQh: multiplyEffort(effort.expectedQh, multiplierBp, scale),
    highQh: multiplyEffort(effort.highQh, multiplierBp, scale),
  };
}

export function subtractEffort(
  total: EffortPoints,
  base: EffortPoints,
): EffortPoints {
  return {
    lowQh: quarterHours(total.lowQh - base.lowQh),
    expectedQh: quarterHours(total.expectedQh - base.expectedQh),
    highQh: quarterHours(total.highQh - base.highQh),
  };
}

function overheadPoint(
  subtotalQh: QuarterHours,
  rateBp: number,
  minimumQh: number,
  config: PricingConfigV1,
): QuarterHours {
  return quarterHours(
    Math.max(
      minimumQh,
      multiplyRatioHalfUp(subtotalQh, rateBp, config.units.basisPointsScale),
    ),
  );
}

export function calculateTestingOverhead(
  complexityAdjusted: EffortPoints,
  level: NormalizedQuoteInputV1["delivery"]["testingLevel"],
  config: PricingConfigV1,
): EffortPoints {
  const testing = config.overhead.testing[level];
  return {
    lowQh: overheadPoint(
      complexityAdjusted.lowQh,
      testing.ratesBp.low,
      testing.minimum.lowQh,
      config,
    ),
    expectedQh: overheadPoint(
      complexityAdjusted.expectedQh,
      testing.ratesBp.expected,
      testing.minimum.expectedQh,
      config,
    ),
    highQh: overheadPoint(
      complexityAdjusted.highQh,
      testing.ratesBp.high,
      testing.minimum.highQh,
      config,
    ),
  };
}

export function addEffort(
  left: EffortPoints,
  right: EffortPoints,
): EffortPoints {
  return {
    lowQh: quarterHours(left.lowQh + right.lowQh),
    expectedQh: quarterHours(left.expectedQh + right.expectedQh),
    highQh: quarterHours(left.highQh + right.highQh),
  };
}

export function calculateProjectManagementOverhead(
  subtotal: EffortPoints,
  complexityLevel: ComplexityLevel,
  config: PricingConfigV1,
): EffortPoints {
  const rates =
    config.overhead.projectManagement.ratesByComplexityBp[complexityLevel];
  const minimum = config.overhead.projectManagement.minimum;
  return {
    lowQh: overheadPoint(subtotal.lowQh, rates.low, minimum.lowQh, config),
    expectedQh: overheadPoint(
      subtotal.expectedQh,
      rates.expected,
      minimum.expectedQh,
      config,
    ),
    highQh: overheadPoint(subtotal.highQh, rates.high, minimum.highQh, config),
  };
}
