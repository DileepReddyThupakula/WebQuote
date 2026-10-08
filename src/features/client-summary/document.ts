import { z } from "zod";

import type {
  ChangeOrderCode,
  CurrencyCode,
  QuoteResultV1,
} from "@/domain/quote/types";
import {
  milestonesPublishable,
  type QuoteOverridesV1,
} from "@/features/quote-results/overrides";

const currencySymbols: Record<CurrencyCode, string> = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  EUR: "€",
};
const exponent: Record<CurrencyCode, number> = {
  INR: 2,
  USD: 2,
  GBP: 2,
  EUR: 2,
};

export function formatMoney(minor: number, currency: CurrencyCode): string {
  const scale = 10 ** exponent[currency];
  const whole = Math.floor(minor / scale).toLocaleString("en-US");
  const fraction = String(minor % scale).padStart(exponent[currency], "0");
  return `${currencySymbols[currency]}${whole}.${fraction}`;
}

export function parseMoneyText(
  value: string,
  currency: CurrencyCode,
): number | null {
  const trimmed = value.trim().replace(/,/g, "");
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(trimmed);
  if (!match) return null;
  const whole = BigInt(match[1]!);
  const fractional = BigInt((match[2] ?? "").padEnd(exponent[currency], "0"));
  const minor = whole * BigInt(10 ** exponent[currency]) + fractional;
  return minor <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(minor) : null;
}

export function formatHours(qh: number): string {
  const whole = Math.floor(qh / 4);
  const fraction = ["", ".25", ".5", ".75"][qh % 4];
  return `${whole}${fraction}`;
}

export const projectTypeLabels: Record<
  QuoteResultV1["input"]["project"]["projectType"],
  string
> = {
  landing: "Landing page",
  business: "Business website",
  portfolio: "Portfolio",
  blog: "Blog or content site",
  ecommerce: "Ecommerce website",
  webApp: "Web application",
  custom: "Custom website",
};

const featureLabels: Record<string, string> = {
  contactForm: "Contact form",
  blogCms: "Blog or CMS",
  search: "Site search",
  authentication: "Authentication",
  userAccounts: "User accounts",
  adminDashboard: "Admin dashboard",
  booking: "Booking",
  payments: "Payments",
  ecommerce: "Ecommerce",
  membership: "Membership",
  subscriptions: "Subscriptions",
};
const integrationLabels: Record<string, string> = {
  crm: "CRM",
  emailMarketing: "Email marketing",
  analytics: "Analytics",
  maps: "Maps",
  otherStandard: "Standard integration",
  thirdPartyApi: "Third-party API",
  customApi: "Custom API",
};
const exclusionLabels: Record<string, string> = {
  "outside-approved-scope": "Work outside the agreed scope",
  "unlimited-revisions": "Unlimited revisions",
  "third-party-fees": "Third-party fees and subscriptions",
  "client-delay": "Delays caused by missing client inputs or approvals",
  "tax-legal-compliance": "Tax, legal, and regulatory advice",
  "accessibility-certification": "Accessibility certification",
  "security-audit": "Independent security audit",
  "performance-sla": "Performance service-level guarantee",
  copywriting: "Copywriting",
  "asset-sourcing-licensing": "Asset sourcing and licensing",
  "content-data-migration": "Content or data migration",
  deployment: "Deployment by the freelancer",
  "custom-integrations": "Custom integrations",
  "catalogue-data-entry": "Catalogue data entry",
  "ongoing-maintenance": "Ongoing maintenance",
};
const changeOrderLabels: Record<ChangeOrderCode, string> = {
  additionalPage: "Additional page",
  additionalRevisionRound: "Additional revision round",
  standardIntegration: "Standard integration",
  thirdPartyApi: "Third-party API",
  customApi: "Custom API",
  urgentChange: "Urgent change",
  hourlyOutOfScope: "Hourly out-of-scope work",
};

export function formatTimeline(timeline: QuoteResultV1["timeline"]): string {
  const { lowWeeks, expectedWeeks, highWeeks } = timeline;
  if (lowWeeks === highWeeks)
    return `${lowWeeks} ${lowWeeks === 1 ? "week" : "weeks"}`;
  return `${lowWeeks}–${highWeeks} weeks (expected ${expectedWeeks} ${expectedWeeks === 1 ? "week" : "weeks"})`;
}

function formatSupportDays(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"} of post-launch support`;
}

export function scopeLines(result: QuoteResultV1): string[] {
  return result.scope.map(({ code, details }) => {
    if (code === "project")
      return `${projectTypeLabels[result.input.project.projectType]} with ${details.pageCount} ${Number(details.pageCount) === 1 ? "page or screen" : "pages or screens"}`;
    if (code === "design")
      return `Design starting point: ${String(details.mode)
        .replace(/([A-Z])/g, " $1")
        .toLowerCase()}`;
    if (code === "content")
      return `Content: ${String(details.mode)}${details.assetSourcing ? ", with asset sourcing" : ""}${details.migration !== "none" ? `; ${details.migration} migration` : ""}`;
    if (code === "delivery")
      return `${String(details.testingLevel).replace(/^./, (letter) => letter.toUpperCase())} testing; the ${details.deploymentOwner === "freelancer" ? "freelancer" : "client"} handles deployment; ${formatSupportDays(Number(details.postLaunchSupportDays))}`;
    if (code === "maintenance")
      return `${details.tier} maintenance recommendation`;
    if (code.startsWith("feature-"))
      return featureLabels[code.slice(8)] ?? "Selected feature";
    if (code.startsWith("integration-"))
      return `${integrationLabels[code.slice(12)] ?? "Integration"} × ${details.count}`;
    return "Included project item";
  });
}

export function exclusionLines(result: QuoteResultV1): string[] {
  return result.exclusions.map(
    ({ code }) =>
      exclusionLabels[code] ?? "Additional work outside the agreed scope",
  );
}

export const clientQuoteDocumentV1Schema = z.strictObject({
  documentVersion: z.literal("client-quote-document-v1"),
  currency: z.enum(["INR", "USD", "GBP", "EUR"]),
  projectType: z.string().min(1),
  projectLabel: z.string().optional(),
  clientLabel: z.string().optional(),
  price: z.strictObject({
    presentation: z.enum(["amount", "range"]),
    quoteMinor: z.number().int().safe().nonnegative(),
    lowMinor: z.number().int().safe().nonnegative(),
    highMinor: z.number().int().safe().nonnegative(),
  }),
  scope: z.array(z.string().min(1)),
  exclusions: z.array(z.string().min(1)),
  timeline: z.string().min(1),
  milestones: z
    .array(
      z.strictObject({
        label: z.string(),
        percentBp: z.number().int().safe(),
        amountMinor: z.number().int().safe(),
      }),
    )
    .min(1),
  revisions: z.strictObject({
    includedRounds: z.number().int().safe(),
    extraRoundPriceMinor: z.number().int().safe(),
  }),
  changeRequests: z.array(
    z.strictObject({ label: z.string(), priceMinor: z.number().int().safe() }),
  ),
  maintenance: z.string(),
  support: z.string(),
  clientNotes: z.string().optional(),
});

export type ClientQuoteDocumentV1 = z.infer<typeof clientQuoteDocumentV1Schema>;

export function createClientQuoteDocument(
  result: QuoteResultV1,
  overrides: QuoteOverridesV1,
): ClientQuoteDocumentV1 | null {
  if (!milestonesPublishable(result, overrides)) return null;
  const values = overrides.values;
  const quoteMinor = values.quoteAmountMinor ?? result.pricing.recommendedMinor;
  const percentages =
    values.milestonePercentBp ??
    result.payment.milestones.map((item) => item.percentBp);
  let allocated = 0;
  const milestones = result.payment.milestones.map((item, index) => {
    const percentBp = percentages[index]!;
    const amountMinor =
      index === percentages.length - 1
        ? quoteMinor - allocated
        : Number((BigInt(quoteMinor) * BigInt(percentBp)) / 10_000n);
    allocated += amountMinor;
    return { label: item.label, percentBp, amountMinor };
  });
  const maintenancePrice =
    values.maintenanceAmountMinor ??
    result.maintenance.monthlyPrice?.recommendedMinor;
  const maintenance = result.maintenance.included
    ? `${values.maintenanceOffer ?? `${result.maintenance.tier} monthly maintenance`}${maintenancePrice === undefined ? "" : `: ${formatMoney(maintenancePrice, result.pricing.currency)}/month`}`
    : (values.maintenanceOffer ?? "No ongoing maintenance included");
  const candidate = {
    documentVersion: "client-quote-document-v1" as const,
    currency: result.pricing.currency,
    projectType: projectTypeLabels[result.input.project.projectType],
    ...(values.projectLabel ? { projectLabel: values.projectLabel } : {}),
    ...(values.clientLabel ? { clientLabel: values.clientLabel } : {}),
    price: {
      presentation: values.amountPresentation ?? "amount",
      quoteMinor,
      lowMinor: result.pricing.rangeLowMinor,
      highMinor: result.pricing.rangeHighMinor,
    },
    scope: values.includedScope ?? scopeLines(result),
    exclusions: values.exclusions ?? exclusionLines(result),
    timeline: values.deliveryStatement ?? formatTimeline(result.timeline),
    milestones,
    revisions: {
      includedRounds:
        values.includedRevisionRounds ?? result.revisions.includedRounds,
      extraRoundPriceMinor:
        values.extraRevisionAmountMinor ??
        result.revisions.extraRoundPrice.recommendedMinor,
    },
    changeRequests: result.changeOrders.map((order) => ({
      label: changeOrderLabels[order.code] ?? "Additional work",
      priceMinor: order.price.recommendedMinor,
    })),
    maintenance,
    support: formatSupportDays(result.input.delivery.postLaunchSupportDays),
    ...(values.clientNotes ? { clientNotes: values.clientNotes } : {}),
  };
  const parsed = clientQuoteDocumentV1Schema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export function clientSummaryText(document: ClientQuoteDocumentV1): string {
  const money = (minor: number) => formatMoney(minor, document.currency);
  return [
    "Project quote",
    document.projectLabel ? `Project: ${document.projectLabel}` : null,
    document.clientLabel ? `Client: ${document.clientLabel}` : null,
    `Project type: ${document.projectType}`,
    document.price.presentation === "range"
      ? `Planning range: ${money(document.price.lowMinor)}–${money(document.price.highMinor)}`
      : `Proposed quote: ${money(document.price.quoteMinor)}`,
    `Expected delivery: ${document.timeline}`,
    "Included scope:",
    ...document.scope.map((item) => `- ${item}`),
    "Exclusions:",
    ...document.exclusions.map((item) => `- ${item}`),
    `Included revisions: ${document.revisions.includedRounds} rounds; additional round: ${money(document.revisions.extraRoundPriceMinor)}`,
    "Payment milestones:",
    ...document.milestones.map(
      (item) =>
        `- ${item.label}: ${item.percentBp / 100}% (${money(item.amountMinor)})`,
    ),
    "Additional work by written change request:",
    ...document.changeRequests.map(
      (item) => `- ${item.label}: from ${money(item.priceMinor)}`,
    ),
    `Maintenance: ${document.maintenance}`,
    `Launch support: ${document.support}`,
    document.clientNotes ? `Notes: ${document.clientNotes}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}
