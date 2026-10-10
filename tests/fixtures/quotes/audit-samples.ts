import { basisPoints, moneyMinor, type QuoteInputV1 } from "@/domain/quote";

import { makeQuoteInput } from "./v1";

/**
 * The 15 sample projects used in AUDIT.md (2026-10-10).
 *
 * AUDIT.md recorded only a table, not runnable inputs, so the inputs here are
 * a reconstruction. `audit` holds the figures AUDIT.md reported (money in major
 * units, hours as decimals) so a test can report any sample whose engine
 * output has drifted from the audit.
 */
export type AuditSampleReport = Readonly<{
  lowHours: number;
  expectedHours: number;
  highHours: number;
  complexityScore: number;
  minimumSafe: number;
  recommended: number;
  rangeLow: number;
  rangeHigh: number;
  lowWeeks: number;
  highWeeks: number;
}>;

export type AuditSample = Readonly<{
  id: number;
  label: string;
  input: QuoteInputV1;
  audit: AuditSampleReport;
}>;

const none = {
  crm: 0,
  emailMarketing: 0,
  analytics: 0,
  maps: 0,
  otherStandard: 0,
  thirdPartyApi: 0,
  customApi: 0,
};
const noFeatures = {
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

type Overrides = Partial<{
  project: Partial<QuoteInputV1["project"]>;
  design: QuoteInputV1["design"];
  content: Partial<QuoteInputV1["content"]>;
  features: Partial<QuoteInputV1["features"]>;
  integrations: Partial<QuoteInputV1["integrations"]>;
  delivery: Partial<QuoteInputV1["delivery"]>;
  pricing: Partial<QuoteInputV1["pricing"]>;
}>;

/** USD, $25/h, 20% margin, balanced contingency, medium risk, unless stated. */
function sample(overrides: Overrides): QuoteInputV1 {
  return makeQuoteInput({
    project: {
      projectType: "business",
      pageCount: 5,
      currency: "USD",
      ...overrides.project,
    },
    design: overrides.design ?? { mode: "template" },
    content: {
      mode: "provided",
      assetSourcing: false,
      migration: "none",
      ...overrides.content,
    },
    features: { ...noFeatures, ...overrides.features },
    integrations: { ...none, ...overrides.integrations },
    delivery: {
      testingLevel: "essential",
      deploymentOwner: "freelancer",
      urgency: "standard",
      postLaunchSupportDays: 0,
      maintenanceTier: "none",
      includedRevisionRounds: 2,
      ...overrides.delivery,
    },
    pricing: {
      hourlyValueMinor: moneyMinor(2_500),
      targetMarginBp: basisPoints(2_000),
      contingency: "balanced",
      riskLevel: "medium",
      ...overrides.pricing,
    },
  });
}

const businessSite: Overrides = {
  features: { contactForm: true },
  integrations: { analytics: 1 },
};

const report = (
  hours: readonly [number, number, number],
  complexityScore: number,
  prices: readonly [number, number, number, number],
  weeks: readonly [number, number],
): AuditSampleReport => ({
  lowHours: hours[0],
  expectedHours: hours[1],
  highHours: hours[2],
  complexityScore,
  minimumSafe: prices[0],
  recommended: prices[1],
  rangeLow: prices[2],
  rangeHigh: prices[3],
  lowWeeks: weeks[0],
  highWeeks: weeks[1],
});

export const auditSamples: readonly AuditSample[] = [
  {
    id: 1,
    label: "Landing, provided design, contact form",
    input: sample({
      project: { projectType: "landing", pageCount: 1 },
      design: { mode: "provided" },
      features: { contactForm: true },
    }),
    audit: report([20.5, 31, 36.75], 0, [920, 970, 920, 1150], [1, 2]),
  },
  {
    id: 2,
    label: "Landing, custom design + copywriting",
    input: sample({
      project: { projectType: "landing", pageCount: 1 },
      design: { mode: "custom" },
      content: { mode: "copywriting" },
      features: { contactForm: true },
    }),
    audit: report([35.75, 55.25, 65.25], 0, [1640, 1730, 1640, 2040], [2, 3]),
  },
  {
    id: 3,
    label: "5-page business, template, form + analytics",
    input: sample(businessSite),
    audit: report([33.75, 50.5, 59.25], 0, [1490, 1580, 1490, 1860], [2, 3]),
  },
  {
    id: 4,
    label: "Portfolio 6 pages, custom design",
    input: sample({
      project: { projectType: "portfolio", pageCount: 6 },
      design: { mode: "custom" },
    }),
    audit: report([39.75, 60.5, 71.5], 0, [1790, 1900, 1790, 2240], [2, 3]),
  },
  {
    id: 5,
    label: "Blog 20 pages, custom design, migration, CMS",
    input: sample({
      project: { projectType: "blog", pageCount: 20 },
      design: { mode: "custom" },
      content: { mode: "copywriting", migration: "standard" },
      features: { blogCms: true },
    }),
    audit: report([147, 240, 293.25], 1, [7340, 7500, 7340, 9170], [6, 12]),
  },
  {
    id: 6,
    label: "Ecommerce 10 pages + payments + API",
    input: sample({
      project: { projectType: "ecommerce", pageCount: 10 },
      design: { mode: "custom" },
      features: { contactForm: true, ecommerce: true, payments: true },
      integrations: { analytics: 1, thirdPartyApi: 1 },
    }),
    audit: report([132.25, 203.25, 240], 6, [6000, 6360, 6000, 7500], [6, 10]),
  },
  {
    id: 7,
    label: "8-page business with login (auth + accounts)",
    input: sample({
      project: { pageCount: 8 },
      features: { authentication: true, userAccounts: true },
      integrations: { analytics: 1 },
    }),
    audit: report([77.5, 120, 142.25], 3, [3560, 3750, 3560, 4450], [4, 6]),
  },
  {
    id: 8,
    label:
      "SaaS: 15 screens, auth, admin, payments, subscriptions, 4 APIs, high risk",
    input: sample({
      project: { projectType: "webApp", pageCount: 15 },
      design: { mode: "fullUx" },
      features: {
        authentication: true,
        userAccounts: true,
        adminDashboard: true,
        payments: true,
        subscriptions: true,
      },
      integrations: { thirdPartyApi: 2, customApi: 2 },
      delivery: { testingLevel: "enhanced" },
      pricing: { riskLevel: "high" },
    }),
    audit: report(
      [391.5, 662, 773.5],
      17,
      [19340, 20690, 19340, 24180],
      [16, 31],
    ),
  },
  {
    id: 9,
    label: "5-page business, rush, 10 h/week",
    input: sample({
      features: { contactForm: true },
      delivery: { urgency: "rush", weeklyCapacityHours: 10 },
    }),
    audit: report([31.5, 46.75, 54.25], 0, [1770, 1900, 1770, 2210], [4, 6]),
  },
  {
    id: 10,
    label: "As #3 with 0% margin, lean, low risk",
    input: sample({
      ...businessSite,
      pricing: {
        targetMarginBp: basisPoints(0),
        contingency: "lean",
        riskLevel: "low",
      },
    }),
    audit: report([33.75, 47.5, 59.25], 0, [1490, 1490, 1490, 1490], [2, 3]),
  },
  {
    id: 11,
    label: "As #3 in INR at ₹1,500/h",
    input: sample({
      ...businessSite,
      project: { currency: "INR" },
      pricing: { hourlyValueMinor: moneyMinor(150_000) },
    }),
    audit: report(
      [33.75, 50.5, 59.25],
      0,
      [89_000, 95_000, 89_000, 111_500],
      [2, 3],
    ),
  },
  {
    id: 12,
    label: "As #3 + 5 revision rounds + 60 days support",
    input: sample({
      ...businessSite,
      delivery: { includedRevisionRounds: 5, postLaunchSupportDays: 60 },
    }),
    audit: report([33.75, 50.5, 59.25], 0, [1490, 1580, 1490, 1860], [2, 3]),
  },
  {
    id: 13,
    label: "As #3 with 0 revisions, 0 support",
    input: sample({
      ...businessSite,
      delivery: { includedRevisionRounds: 0, postLaunchSupportDays: 0 },
    }),
    audit: report([33.75, 50.5, 59.25], 0, [1490, 1580, 1490, 1860], [2, 3]),
  },
  {
    id: 14,
    label: "As #3 with 40% margin",
    input: sample({
      ...businessSite,
      pricing: { targetMarginBp: basisPoints(4_000) },
    }),
    audit: report([33.75, 50.5, 59.25], 0, [1490, 2110, 1490, 2470], [2, 3]),
  },
  {
    id: 15,
    label: "As #3 with 0% margin",
    input: sample({
      ...businessSite,
      pricing: { targetMarginBp: basisPoints(0) },
    }),
    audit: report([33.75, 50.5, 59.25], 0, [1490, 1490, 1490, 1490], [2, 3]),
  },
];
