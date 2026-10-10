export type Brand<T, Name extends string> = T & {
  readonly __brand: Name;
};

export type MoneyMinor = Brand<number, "MoneyMinor">;
export type BasisPoints = Brand<number, "BasisPoints">;
export type QuarterHours = Brand<number, "QuarterHours">;

export type CurrencyCode = "INR" | "USD" | "GBP" | "EUR";
export type ProjectType =
  | "landing"
  | "business"
  | "portfolio"
  | "blog"
  | "ecommerce"
  | "webApp"
  | "custom";
export type DesignMode = "provided" | "template" | "custom" | "fullUx";
export type ContentMode = "provided" | "formatting" | "copywriting";
export type MigrationLevel = "none" | "light" | "standard" | "complex";
export type TestingLevel = "essential" | "enhanced";
export type DeploymentOwner = "client" | "freelancer";
export type Urgency = "standard" | "priority" | "rush";
export type MaintenanceTier = "none" | "essential" | "standard" | "priority";
export type ContingencyPreference = "lean" | "balanced" | "cautious";
export type RiskLevel = "low" | "medium" | "high";
export type ComplexityLevel =
  "straightforward" | "moderate" | "complex" | "advanced";

export type EffortRange = Readonly<{
  lowQh: QuarterHours;
  highQh: QuarterHours;
}>;

export type EffortPoints = Readonly<{
  lowQh: QuarterHours;
  expectedQh: QuarterHours;
  highQh: QuarterHours;
}>;

export type FeatureKey =
  | "contactForm"
  | "blogCms"
  | "search"
  | "authentication"
  | "userAccounts"
  | "adminDashboard"
  | "booking"
  | "payments"
  | "ecommerce"
  | "membership"
  | "subscriptions";

export type IntegrationKey =
  | "crm"
  | "emailMarketing"
  | "analytics"
  | "maps"
  | "otherStandard"
  | "thirdPartyApi"
  | "customApi";

export type FeatureSelections = Readonly<Record<FeatureKey, boolean>>;
export type IntegrationCounts = Readonly<Record<IntegrationKey, number>>;

export type QuoteInputV1 = Readonly<{
  inputVersion: "quote-input-v1";
  project: Readonly<{
    projectType: ProjectType;
    pageCount: number;
    currency: CurrencyCode;
    clientContext?: string;
  }>;
  design: Readonly<{ mode: DesignMode }>;
  content: Readonly<{
    mode: ContentMode;
    assetSourcing: boolean;
    migration: MigrationLevel;
  }>;
  features: FeatureSelections;
  integrations: IntegrationCounts;
  delivery: Readonly<{
    testingLevel: TestingLevel;
    deploymentOwner: DeploymentOwner;
    urgency: Urgency;
    postLaunchSupportDays: number;
    maintenanceTier: MaintenanceTier;
    weeklyCapacityHours?: number;
    includedRevisionRounds: number;
  }>;
  pricing: Readonly<{
    hourlyValueMinor: MoneyMinor;
    targetMarginBp: BasisPoints;
    contingency: ContingencyPreference;
    riskLevel: RiskLevel;
  }>;
}>;

export type DependencyResolution = Readonly<{
  code:
    | "blog-project-enables-cms"
    | "ecommerce-project-enables-ecommerce"
    | "accounts-require-authentication"
    | "membership-requires-authentication"
    | "subscriptions-require-authentication"
    | "subscriptions-require-payments";
  enabledFeature: FeatureKey;
  source: string;
}>;

export type NormalizedQuoteInputV1 = QuoteInputV1 &
  Readonly<{
    delivery: QuoteInputV1["delivery"] &
      Readonly<{ weeklyCapacityHours: number }>;
    normalization: Readonly<{
      appliedDependencies: readonly DependencyResolution[];
    }>;
  }>;

export type EffortCategory =
  | "projectFoundation"
  | "pages"
  | "design"
  | "content"
  | "features"
  | "integrations"
  | "migration"
  | "deployment";

export type EffortLineItem = Readonly<{
  id: string;
  code: string;
  category: EffortCategory;
  label: string;
  quantity: number;
  sourceKey: string;
  configPath: string;
  effort: EffortPoints;
}>;

export type ComplexitySignal = Readonly<{
  code: string;
  pointsEach: number;
  count: number;
  totalPoints: number;
  sourceKey: string;
  configPath: string;
}>;

export type EffortLedgerItem = Readonly<{
  code:
    | "directExpectedEffort"
    | "complexityAdditionalEffort"
    | "testingOverhead"
    | "projectManagementOverhead"
    | "includedRevisionEffort"
    | "postLaunchSupportEffort"
    | "riskContingency";
  amountQh: QuarterHours;
  configPath: string;
}>;

export type PriceLedgerItem = Readonly<{
  code:
    | "expectedLaborValue"
    | "targetMarginAdjustment"
    | "safeFloorAdjustment"
    | "urgencySurcharge"
    | "commercialRounding";
  inputMinor: MoneyMinor;
  deltaMinor: MoneyMinor;
  outputMinor: MoneyMinor;
  rateBp?: BasisPoints;
  configPath: string;
}>;

export type QuoteWarningCode =
  | "integration-discovery"
  | "complex-migration"
  | "advanced-complexity"
  | "high-risk"
  | "custom-api-discovery"
  | "several-custom-apis"
  | "complex-commerce"
  | "complex-web-app"
  | "large-scope"
  | "zero-margin"
  | "rush-capacity-confirmation";

export type QuoteWarning = Readonly<{
  code: QuoteWarningCode;
  severity: "notice" | "discoveryRecommended";
  sourceKeys: readonly string[];
  details: Readonly<Record<string, number | string | boolean>>;
}>;

export type Milestone = Readonly<{
  code: string;
  label: string;
  percentBp: BasisPoints;
  amountMinor: MoneyMinor;
}>;

export type ChangeOrderCode =
  | "additionalPage"
  | "additionalRevisionRound"
  | "standardIntegration"
  | "thirdPartyApi"
  | "customApi"
  | "urgentChange"
  | "hourlyOutOfScope";

export type CommercialPriceRange = Readonly<{
  rawLowMinor: MoneyMinor;
  rawExpectedMinor: MoneyMinor;
  rawHighMinor: MoneyMinor;
  lowMinor: MoneyMinor;
  recommendedMinor: MoneyMinor;
  highMinor: MoneyMinor;
}>;

export type QuoteResultV1 = Readonly<{
  resultVersion: "quote-result-v1";
  modelVersion: string;
  pricingConfig: Readonly<{
    id: string;
    version: string;
    effectiveAt: string;
  }>;
  input: NormalizedQuoteInputV1;
  effort: Readonly<{
    lineItems: readonly EffortLineItem[];
    direct: EffortPoints;
    complexityAdditional: EffortPoints;
    testingOverhead: EffortPoints;
    projectManagementOverhead: EffortPoints;
    /**
     * Effort for committed terms (pricing model v2+). Included in `planned`
     * and `delivery`; absent on results calculated under model v1.
     */
    includedWork?: Readonly<{
      baselineRounds: number;
      revisionRounds: EffortPoints;
      postLaunchSupport: EffortPoints;
      supportCalibration: "uncalibrated-placeholder" | "calibrated";
    }>;
    planned: EffortPoints;
    contingencyQh: QuarterHours;
    delivery: EffortPoints;
    safeEffortQh: QuarterHours;
  }>;
  complexity: Readonly<{
    score: number;
    level: ComplexityLevel;
    multiplierBp: BasisPoints;
    signals: readonly ComplexitySignal[];
  }>;
  risk: Readonly<{
    level: RiskLevel;
    preference: ContingencyPreference;
    baseRateBp: BasisPoints;
    adjustmentBp: number;
    contingencyRateBp: BasisPoints;
    contingencyQh: QuarterHours;
  }>;
  pricing: Readonly<{
    currency: CurrencyCode;
    hourlyValueMinor: MoneyMinor;
    targetMarginBp: BasisPoints;
    minimumSafeRawMinor: MoneyMinor;
    minimumSafeMinor: MoneyMinor;
    recommendedBeforeUrgencyRawMinor: MoneyMinor;
    recommendedBeforeUrgencyMinor: MoneyMinor;
    recommendedRawMinor: MoneyMinor;
    recommendedMinor: MoneyMinor;
    rangeLowRawMinor: MoneyMinor;
    rangeLowMinor: MoneyMinor;
    rangeHighRawMinor: MoneyMinor;
    rangeHighMinor: MoneyMinor;
    urgency: Readonly<{
      level: Urgency;
      rateBp: BasisPoints;
      rawFeeMinor: MoneyMinor;
      displayedFeeMinor: MoneyMinor;
    }>;
    roundingIncrementMinor: MoneyMinor;
  }>;
  timeline: Readonly<{
    weeklyCapacityHours: number;
    lowWeeks: number;
    expectedWeeks: number;
    highWeeks: number;
    requiresCapacityConfirmation: boolean;
  }>;
  revisions: Readonly<{
    includedRounds: number;
    extraRoundEffort: EffortPoints;
    extraRoundPrice: CommercialPriceRange;
  }>;
  changeOrders: readonly Readonly<{
    code: ChangeOrderCode;
    effort?: EffortPoints;
    price: CommercialPriceRange;
    assumptions: readonly string[];
  }>[];
  maintenance: Readonly<{
    tier: MaintenanceTier;
    included: boolean;
    monthlyEffort?: EffortPoints;
    monthlyPrice?: CommercialPriceRange;
  }>;
  payment: Readonly<{
    depositPercentBp: BasisPoints;
    depositAmountMinor: MoneyMinor;
    milestones: readonly Milestone[];
  }>;
  scope: readonly Readonly<{
    code: string;
    details: Readonly<Record<string, number | string | boolean>>;
  }>[];
  exclusions: readonly Readonly<{
    code: string;
    conditional: boolean;
  }>[];
  warnings: readonly QuoteWarning[];
  ledger: Readonly<{
    effort: readonly EffortLedgerItem[];
    pricing: readonly PriceLedgerItem[];
  }>;
}>;

export type QuoteValidationIssue = Readonly<{
  path: string;
  code: string;
  message: string;
}>;

export type QuoteCalculationOutcome =
  | Readonly<{ ok: true; result: QuoteResultV1 }>
  | Readonly<{ ok: false; issues: readonly QuoteValidationIssue[] }>;
