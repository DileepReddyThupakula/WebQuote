import { basisPoints, moneyMinor, type QuoteInputV1 } from "@/domain/quote";

const noFeatures: QuoteInputV1["features"] = {
  contactForm: false,
  blogCms: false,
  search: false,
  authentication: false,
  userAccounts: false,
  adminDashboard: false,
  booking: false,
  payments: false,
  ecommerce: false,
  membership: false,
  subscriptions: false,
};

const noIntegrations: QuoteInputV1["integrations"] = {
  crm: 0,
  emailMarketing: 0,
  analytics: 0,
  maps: 0,
  otherStandard: 0,
  thirdPartyApi: 0,
  customApi: 0,
};

export function makeQuoteInput(
  overrides: Partial<QuoteInputV1> = {},
): QuoteInputV1 {
  const base: QuoteInputV1 = {
    inputVersion: "quote-input-v1",
    project: {
      projectType: "business",
      pageCount: 5,
      currency: "USD",
    },
    design: { mode: "template" },
    content: {
      mode: "provided",
      assetSourcing: false,
      migration: "none",
    },
    features: { ...noFeatures, contactForm: true },
    integrations: { ...noIntegrations, analytics: 1 },
    delivery: {
      testingLevel: "essential",
      deploymentOwner: "freelancer",
      urgency: "standard",
      postLaunchSupportDays: 30,
      maintenanceTier: "none",
      includedRevisionRounds: 2,
    },
    pricing: {
      hourlyValueMinor: moneyMinor(10_000),
      targetMarginBp: basisPoints(2_000),
      contingency: "balanced",
      riskLevel: "medium",
    },
  };

  return {
    ...base,
    ...overrides,
    project: { ...base.project, ...overrides.project },
    design: { ...base.design, ...overrides.design },
    content: { ...base.content, ...overrides.content },
    features: { ...base.features, ...overrides.features },
    integrations: { ...base.integrations, ...overrides.integrations },
    delivery: { ...base.delivery, ...overrides.delivery },
    pricing: { ...base.pricing, ...overrides.pricing },
  };
}

export const quoteFixtures = {
  simpleLandingPage: makeQuoteInput({
    project: { projectType: "landing", pageCount: 1, currency: "INR" },
    design: { mode: "provided" },
    features: { ...noFeatures, contactForm: true },
    integrations: noIntegrations,
    pricing: {
      hourlyValueMinor: moneyMinor(150_000),
      targetMarginBp: basisPoints(1_500),
      contingency: "lean",
      riskLevel: "low",
    },
  }),
  smallBusinessSite: makeQuoteInput(),
  contentHeavyCms: makeQuoteInput({
    project: { projectType: "blog", pageCount: 20, currency: "GBP" },
    design: { mode: "custom" },
    content: {
      mode: "formatting",
      assetSourcing: true,
      migration: "standard",
    },
    features: { ...noFeatures, search: true },
    integrations: { ...noIntegrations, analytics: 1, emailMarketing: 1 },
    delivery: {
      testingLevel: "enhanced",
      deploymentOwner: "freelancer",
      urgency: "standard",
      postLaunchSupportDays: 30,
      maintenanceTier: "standard",
      includedRevisionRounds: 2,
    },
    pricing: {
      hourlyValueMinor: moneyMinor(8_000),
      targetMarginBp: basisPoints(2_500),
      contingency: "balanced",
      riskLevel: "medium",
    },
  }),
  ecommerceWebsite: makeQuoteInput({
    project: { projectType: "ecommerce", pageCount: 10, currency: "EUR" },
    design: { mode: "custom" },
    content: {
      mode: "formatting",
      assetSourcing: true,
      migration: "standard",
    },
    features: {
      ...noFeatures,
      search: true,
      payments: true,
      adminDashboard: true,
    },
    integrations: {
      ...noIntegrations,
      analytics: 1,
      emailMarketing: 1,
      thirdPartyApi: 1,
    },
    delivery: {
      testingLevel: "enhanced",
      deploymentOwner: "freelancer",
      urgency: "standard",
      postLaunchSupportDays: 60,
      maintenanceTier: "priority",
      includedRevisionRounds: 2,
    },
    pricing: {
      hourlyValueMinor: moneyMinor(9_000),
      targetMarginBp: basisPoints(3_000),
      contingency: "cautious",
      riskLevel: "medium",
    },
  }),
  saasWebApplication: makeQuoteInput({
    project: { projectType: "webApp", pageCount: 15, currency: "USD" },
    design: { mode: "fullUx" },
    content: {
      mode: "provided",
      assetSourcing: false,
      migration: "light",
    },
    features: {
      ...noFeatures,
      authentication: true,
      userAccounts: true,
      adminDashboard: true,
      payments: true,
      membership: true,
      subscriptions: true,
    },
    integrations: {
      ...noIntegrations,
      analytics: 1,
      emailMarketing: 1,
      thirdPartyApi: 2,
    },
    delivery: {
      testingLevel: "enhanced",
      deploymentOwner: "freelancer",
      urgency: "standard",
      postLaunchSupportDays: 60,
      maintenanceTier: "priority",
      includedRevisionRounds: 3,
    },
    pricing: {
      hourlyValueMinor: moneyMinor(12_000),
      targetMarginBp: basisPoints(3_500),
      contingency: "cautious",
      riskLevel: "medium",
    },
  }),
  integrationHeavyCustom: makeQuoteInput({
    project: { projectType: "custom", pageCount: 12, currency: "GBP" },
    design: { mode: "custom" },
    content: {
      mode: "formatting",
      assetSourcing: false,
      migration: "complex",
    },
    features: {
      ...noFeatures,
      authentication: true,
      userAccounts: true,
      adminDashboard: true,
    },
    integrations: {
      crm: 2,
      emailMarketing: 2,
      analytics: 2,
      maps: 2,
      otherStandard: 2,
      thirdPartyApi: 4,
      customApi: 3,
    },
    delivery: {
      testingLevel: "enhanced",
      deploymentOwner: "freelancer",
      urgency: "standard",
      postLaunchSupportDays: 60,
      maintenanceTier: "standard",
      includedRevisionRounds: 2,
    },
    pricing: {
      hourlyValueMinor: moneyMinor(10_000),
      targetMarginBp: basisPoints(3_000),
      contingency: "cautious",
      riskLevel: "high",
    },
  }),
  rushProject: makeQuoteInput({
    delivery: {
      testingLevel: "essential",
      deploymentOwner: "freelancer",
      urgency: "rush",
      postLaunchSupportDays: 30,
      maintenanceTier: "none",
      weeklyCapacityHours: 15,
      includedRevisionRounds: 2,
    },
  }),
  highRiskModerateComplexity: makeQuoteInput({
    features: {
      ...noFeatures,
      authentication: true,
      userAccounts: true,
    },
    pricing: {
      hourlyValueMinor: moneyMinor(10_000),
      targetMarginBp: basisPoints(2_000),
      contingency: "balanced",
      riskLevel: "high",
    },
  }),
} as const;

export type QuoteFixtureName = keyof typeof quoteFixtures;
