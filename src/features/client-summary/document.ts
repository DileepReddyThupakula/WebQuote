import { z } from "zod";

import type {
  ChangeOrderCode,
  CurrencyCode,
  QuoteResultV1,
} from "@/domain/quote/types";
import {
  clientPlanningRange,
  PLANNING_RANGE_NOTE,
} from "@/features/client-summary/planning-range";
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

/** Indian digit grouping: the last three digits, then groups of two (1,23,456). */
function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3).replace(/\B(?=(\d{2})+$)/g, ",");
  return `${head},${digits.slice(-3)}`;
}

export function formatMoney(minor: number, currency: CurrencyCode): string {
  const scale = 10 ** exponent[currency];
  const wholeValue = Math.floor(minor / scale);
  const fraction = String(minor % scale).padStart(exponent[currency], "0");
  if (currency === "INR") {
    // Rupee amounts read as whole rupees unless there are paise.
    const whole = groupIndian(String(wholeValue));
    return `${currencySymbols[currency]}${whole}${/^0+$/.test(fraction) ? "" : `.${fraction}`}`;
  }
  const whole = wholeValue.toLocaleString("en-US");
  return `${currencySymbols[currency]}${whole}.${fraction}`;
}

/**
 * An amount for an editable field: the currency's normal digit grouping, no
 * symbol, and no trailing ".00" for whole numbers (54,000 or 1,23,456).
 * Fractions appear only when non-zero (54,000.50). `parseMoneyText` reads this
 * back, so a formatted value round-trips exactly.
 */
export function formatAmountInput(
  minor: number,
  currency: CurrencyCode,
): string {
  const scale = 10 ** exponent[currency];
  const wholeValue = Math.floor(minor / scale);
  const fraction = String(minor % scale).padStart(exponent[currency], "0");
  const whole =
    currency === "INR"
      ? groupIndian(String(wholeValue))
      : wholeValue.toLocaleString("en-US");
  return /^0*$/.test(fraction) ? whole : `${whole}.${fraction}`;
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
  blogCms: "Blog with a content management system",
  search: "Site search",
  authentication: "User login",
  userAccounts: "User accounts",
  adminDashboard: "Admin dashboard",
  booking: "Booking system",
  payments: "Online payments",
  ecommerce: "Online store",
  membership: "Members-only area",
  subscriptions: "Subscription billing",
};
const integrationLabels: Record<string, { one: string; many: string }> = {
  crm: { one: "CRM integration", many: "CRM integrations" },
  emailMarketing: {
    one: "Email marketing integration",
    many: "email marketing integrations",
  },
  analytics: { one: "Analytics integration", many: "analytics integrations" },
  maps: { one: "Maps integration", many: "maps integrations" },
  otherStandard: {
    one: "Standard third-party integration",
    many: "standard third-party integrations",
  },
  thirdPartyApi: {
    one: "Third-party API integration",
    many: "third-party API integrations",
  },
  customApi: {
    one: "Custom API integration",
    many: "custom API integrations",
  },
};
const designLines: Record<string, string> = {
  provided: "Built from the design you provide",
  template: "Design based on a ready-made template",
  custom: "A custom visual design",
  fullUx: "Full UX and visual design",
};
const contentLines: Record<string, string> = {
  provided: "Page content supplied by you",
  formatting: "Your content formatted and placed on the pages",
  copywriting: "Page copy written for the project",
};
const migrationLines: Record<string, string> = {
  light: "Light migration of your existing content",
  standard: "Standard migration of your existing content",
  complex: "Complex migration of your existing content or data",
};
const testingLines: Record<string, string> = {
  essential: "Essential testing before launch",
  enhanced: "Enhanced testing before launch",
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
  deployment: "Deployment of the finished site",
  "custom-integrations": "Custom integrations",
  "catalogue-data-entry": "Catalogue data entry",
  "ongoing-maintenance": "Ongoing maintenance",
};
/**
 * Change requests a client may see. Urgent-change and hourly out-of-scope
 * prices are derived from the freelancer's hourly rate and margin, so they stay
 * internal. Add a code here only if its price cannot reveal the rate.
 */
export const CLIENT_CHANGE_ORDER_CODES: ReadonlySet<ChangeOrderCode> = new Set([
  "additionalPage",
  "additionalRevisionRound",
  "standardIntegration",
  "thirdPartyApi",
  "customApi",
]);

const changeOrderLabels: Record<ChangeOrderCode, string> = {
  additionalPage: "Additional page",
  additionalRevisionRound: "Additional revision round",
  standardIntegration: "Standard integration",
  thirdPartyApi: "Third-party API",
  customApi: "Custom API",
  urgentChange: "Urgent change",
  hourlyOutOfScope: "Hourly out-of-scope work",
};

/** The delivery estimate, stated once: "3 weeks" or "2–4 weeks". */
export function formatTimeline(timeline: QuoteResultV1["timeline"]): string {
  const { lowWeeks, highWeeks } = timeline;
  if (lowWeeks === highWeeks)
    return `${lowWeeks} ${lowWeeks === 1 ? "week" : "weeks"}`;
  return `${lowWeeks}–${highWeeks} weeks`;
}

/**
 * The internal results summary. When the planned range is a single value it
 * reads once ("2 weeks"); otherwise it keeps the expected point beside the range.
 */
export function formatTimelineSummary(
  timeline: QuoteResultV1["timeline"],
): string {
  const { lowWeeks, expectedWeeks, highWeeks } = timeline;
  if (lowWeeks === highWeeks) return formatTimeline(timeline);
  return `${expectedWeeks} ${expectedWeeks === 1 ? "week" : "weeks"} expected (${lowWeeks}–${highWeeks} weeks planned)`;
}

/** The post-launch support sentence shown to the client. */
export function formatSupportDays(days: number): string {
  if (days <= 0) return "No post-launch support is included.";
  return `${days} ${days === 1 ? "day" : "days"} of post-launch support to fix defects in the agreed work.`;
}

/** The revision policy sentence shown to the client. */
export function formatRevisionPolicy(
  includedRounds: number,
  extraRoundMinor: number,
  currency: CurrencyCode,
): string {
  const included =
    includedRounds === 0
      ? "No revision rounds are included."
      : `${includedRounds} ${includedRounds === 1 ? "revision round is" : "revision rounds are"} included.`;
  return `${included} An additional round is ${formatMoney(extraRoundMinor, currency)}.`;
}

function pageUnit(projectType: string, count: number): string {
  const unit = projectType === "webApp" ? "screen" : "page";
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

export function scopeLines(result: QuoteResultV1): string[] {
  return result.scope.flatMap(({ code, details }): string[] => {
    if (code === "project")
      return [
        `${projectTypeLabels[result.input.project.projectType]} with ${pageUnit(result.input.project.projectType, Number(details.pageCount))}`,
      ];
    if (code === "design")
      return [designLines[String(details.mode)] ?? "Design work"];
    if (code === "content") {
      const lines = [contentLines[String(details.mode)] ?? "Content work"];
      if (details.assetSourcing)
        lines.push("Images and other assets sourced for the pages");
      const migration = migrationLines[String(details.migration)];
      if (migration) lines.push(migration);
      return lines;
    }
    if (code === "delivery")
      return [
        testingLines[String(details.testingLevel)] ?? "Testing before launch",
        details.deploymentOwner === "freelancer"
          ? "Deployment handled by the developer"
          : "Deployment handled by you",
      ];
    if (code === "maintenance")
      return [
        `Optional ${String(details.tier)} monthly maintenance, priced separately`,
      ];
    if (code.startsWith("feature-"))
      return [featureLabels[code.slice(8)] ?? "Selected feature"];
    if (code.startsWith("integration-")) {
      const label = integrationLabels[code.slice(12)];
      const count = Number(details.count);
      if (!label) return ["Integration"];
      return [count === 1 ? label.one : `${count} ${label.many}`];
    }
    return ["Included project item"];
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
  const tierName = result.maintenance.tier.replace(/^./, (letter) =>
    letter.toUpperCase(),
  );
  const maintenance = result.maintenance.included
    ? values.maintenanceOffer
      ? `${values.maintenanceOffer}${maintenancePrice === undefined ? "" : `: ${formatMoney(maintenancePrice, result.pricing.currency)} per month`}`
      : maintenancePrice === undefined
        ? `${tierName} monthly maintenance is available, billed separately.`
        : `${tierName} monthly maintenance is available for ${formatMoney(maintenancePrice, result.pricing.currency)} per month, billed separately.`
    : (values.maintenanceOffer ?? "No ongoing maintenance is included.");
  const planningRange = clientPlanningRange(quoteMinor, result.pricing);
  const candidate = {
    documentVersion: "client-quote-document-v1" as const,
    currency: result.pricing.currency,
    projectType: projectTypeLabels[result.input.project.projectType],
    ...(values.projectLabel ? { projectLabel: values.projectLabel } : {}),
    ...(values.clientLabel ? { clientLabel: values.clientLabel } : {}),
    price: {
      presentation: values.amountPresentation ?? "amount",
      quoteMinor,
      lowMinor: planningRange.lowMinor,
      highMinor: planningRange.highMinor,
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
    changeRequests: result.changeOrders
      .filter((order) => CLIENT_CHANGE_ORDER_CODES.has(order.code))
      .map((order) => ({
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
    document.price.presentation === "range" ? PLANNING_RANGE_NOTE : null,
    `Expected delivery: ${document.timeline}`,
    "Included scope:",
    ...document.scope.map((item) => `- ${item}`),
    "Exclusions:",
    ...document.exclusions.map((item) => `- ${item}`),
    `Revisions: ${formatRevisionPolicy(document.revisions.includedRounds, document.revisions.extraRoundPriceMinor, document.currency)}`,
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
    `Support after launch: ${document.support}`,
    document.clientNotes ? `Notes: ${document.clientNotes}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}
