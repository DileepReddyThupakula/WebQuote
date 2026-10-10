import {
  ACTIVE_PRICING_CONFIG,
  basisPoints,
  calculateQuote,
  moneyMinor,
  type QuoteInputV1,
} from "@/domain/quote";
import {
  createClientQuoteDocument,
  type ClientQuoteDocumentV1,
} from "@/features/client-summary/document";
import { emptyOverrides } from "@/features/quote-results/overrides";

/**
 * Example project for the landing page: a 5-page business website with a
 * template design, a contact form and analytics. It matches audit sample 11
 * (tests/fixtures/quotes/audit-samples.ts) apart from a 14-day support window,
 * so the client page shows a realistic launch-support line.
 *
 * The freelancer-side values below (rate, margin, risk) feed the engine only.
 * They never appear in the client document.
 */
export const SAMPLE_QUOTE_INPUT: QuoteInputV1 = {
  inputVersion: "quote-input-v1",
  project: { projectType: "business", pageCount: 5, currency: "INR" },
  design: { mode: "template" },
  content: { mode: "provided", assetSourcing: false, migration: "none" },
  features: {
    contactForm: true,
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
  },
  integrations: {
    crm: 0,
    emailMarketing: 0,
    analytics: 1,
    maps: 0,
    otherStandard: 0,
    thirdPartyApi: 0,
    customApi: 0,
  },
  delivery: {
    testingLevel: "essential",
    deploymentOwner: "freelancer",
    urgency: "standard",
    postLaunchSupportDays: 14,
    maintenanceTier: "none",
    includedRevisionRounds: 2,
  },
  pricing: {
    hourlyValueMinor: moneyMinor(150_000),
    targetMarginBp: basisPoints(2_000),
    contingency: "balanced",
    riskLevel: "medium",
  },
};

/** The client-facing document produced by the real engine for the example. */
export function buildSampleQuote(): ClientQuoteDocumentV1 {
  const outcome = calculateQuote(SAMPLE_QUOTE_INPUT, ACTIVE_PRICING_CONFIG);
  if (!outcome.ok) throw new Error("The sample quote input is invalid.");
  const document = createClientQuoteDocument(
    outcome.result,
    emptyOverrides(outcome.result),
  );
  if (!document) throw new Error("The sample quote document is unavailable.");
  return document;
}
