import type {
  ContingencyPreference,
  ContentMode,
  DeploymentOwner,
  DesignMode,
  IntegrationKey,
  MaintenanceTier,
  MigrationLevel,
  RiskLevel,
  TestingLevel,
  Urgency,
} from "@/domain/quote/types";

const reviewLabels = {
  design: {
    provided: "Existing design provided",
    template: "Template-based",
    custom: "Custom design",
    fullUx: "Full UI/UX design",
  } satisfies Record<DesignMode, string>,
  content: {
    provided: "Client supplies content",
    formatting: "Formatting and support required",
    copywriting: "Copywriting support",
  } satisfies Record<ContentMode, string>,
  urgency: {
    standard: "Normal",
    priority: "Priority",
    rush: "Rush",
  } satisfies Record<Urgency, string>,
  migration: {
    none: "No migration",
    light: "Light migration",
    standard: "Standard migration",
    complex: "Complex migration",
  } satisfies Record<MigrationLevel, string>,
  maintenance: {
    none: "No maintenance plan",
    essential: "Essential",
    standard: "Standard",
    priority: "Priority",
  } satisfies Record<MaintenanceTier, string>,
  testing: {
    essential: "Essential testing",
    enhanced: "Enhanced testing",
  } satisfies Record<TestingLevel, string>,
  deployment: {
    client: "Client handles deployment",
    freelancer: "I handle deployment",
  } satisfies Record<DeploymentOwner, string>,
  contingency: {
    lean: "Lean",
    balanced: "Balanced",
    cautious: "Cautious",
  } satisfies Record<ContingencyPreference, string>,
  risk: {
    low: "Low exposure",
    medium: "Medium exposure",
    high: "High exposure",
  } satisfies Record<RiskLevel, string>,
} as const;

export function designLabel(value: DesignMode): string {
  return reviewLabels.design[value];
}

export function contentLabel(value: ContentMode): string {
  return reviewLabels.content[value];
}

export function urgencyLabel(value: Urgency): string {
  return reviewLabels.urgency[value];
}

export function migrationLabel(value: MigrationLevel): string {
  return reviewLabels.migration[value];
}

export function maintenanceLabel(value: MaintenanceTier): string {
  return reviewLabels.maintenance[value];
}

export function testingLabel(value: TestingLevel): string {
  return reviewLabels.testing[value];
}

export function deploymentLabel(value: DeploymentOwner): string {
  return reviewLabels.deployment[value];
}

export function contingencyLabel(value: ContingencyPreference): string {
  return reviewLabels.contingency[value];
}

export function riskLabel(value: RiskLevel): string {
  return reviewLabels.risk[value];
}

export function supportLabel(days: string): string {
  return days === "0" ? "No post-launch support" : `${days} days`;
}

const integrationCopy: Record<
  IntegrationKey,
  Readonly<{ single: string; counted: string }>
> = {
  crm: { single: "CRM", counted: "CRM integrations" },
  emailMarketing: {
    single: "Email marketing",
    counted: "email marketing integrations",
  },
  analytics: { single: "Analytics", counted: "analytics integrations" },
  maps: { single: "Maps", counted: "map integrations" },
  otherStandard: {
    single: "Other standard integration",
    counted: "other standard integrations",
  },
  thirdPartyApi: { single: "Third-party API", counted: "third-party APIs" },
  customApi: { single: "Custom API", counted: "custom APIs" },
};

export function formatIntegrationSummary(
  values: Readonly<Record<IntegrationKey, string>>,
): string[] {
  return (Object.entries(values) as [IntegrationKey, string][])
    .filter(([, rawCount]) => Number(rawCount) > 0)
    .map(([key, rawCount]) => {
      const count = Number(rawCount);
      const copy = integrationCopy[key];
      return count === 1 ? copy.single : `${count} ${copy.counted}`;
    });
}
