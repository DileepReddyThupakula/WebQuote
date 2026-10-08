import type {
  BasisPoints,
  ContentMode,
  ContingencyPreference,
  CurrencyCode,
  DeploymentOwner,
  DesignMode,
  FeatureKey,
  IntegrationKey,
  MaintenanceTier,
  MigrationLevel,
  ProjectType,
  RiskLevel,
  TestingLevel,
  Urgency,
} from "@/domain/quote/types";

export type BuilderStepId =
  | "project"
  | "design"
  | "features"
  | "integrations"
  | "delivery"
  | "commercial"
  | "review";

export type QuoteBuilderDraft = {
  inputVersion: "quote-input-v1";
  project: {
    projectType: ProjectType;
    pageCount: string;
    currency: CurrencyCode;
    clientContext: string;
  };
  design: { mode: DesignMode };
  content: {
    mode: ContentMode;
    assetSourcing: boolean;
    migration: MigrationLevel;
  };
  features: Record<FeatureKey, boolean>;
  integrations: Record<IntegrationKey, string>;
  delivery: {
    testingLevel: TestingLevel;
    deploymentOwner: DeploymentOwner;
    urgency: Urgency;
    postLaunchSupportDays: string;
    maintenanceTier: MaintenanceTier;
    weeklyCapacityHours: string;
    includedRevisionRounds: string;
  };
  pricing: {
    hourlyValue: string;
    targetMarginPercent: string;
    contingency: ContingencyPreference;
    riskLevel: RiskLevel;
  };
  ui: {
    apiWorkEnabled: boolean;
  };
};

export type DraftIssue = Readonly<{
  path: string;
  message: string;
}>;

export type FieldErrors = Readonly<Record<string, string>>;

export type BuilderState = Readonly<{
  draft: QuoteBuilderDraft;
  currentStep: BuilderStepId;
  completedSteps: readonly BuilderStepId[];
  errors: FieldErrors;
}>;

export type PersistedDraftSnapshot = Readonly<{
  draft: QuoteBuilderDraft;
  currentStep: BuilderStepId;
  completedSteps: readonly BuilderStepId[];
  createdAt: string;
  updatedAt: string;
}>;

export type PersistedResultSnapshot = Readonly<{
  result: unknown;
  createdAt: string;
  updatedAt: string;
}>;

export type PercentageBasisPoints = BasisPoints;
