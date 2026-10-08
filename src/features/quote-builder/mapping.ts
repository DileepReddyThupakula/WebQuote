import {
  basisPoints,
  moneyMinor,
  parseQuoteInputV1,
  PRICING_CONFIG_V1,
  type QuoteInputV1,
} from "@/domain/quote";
import type { CurrencyCode, IntegrationKey } from "@/domain/quote/types";

import type {
  DraftIssue,
  QuoteBuilderDraft,
} from "@/features/quote-builder/types";

export type DraftMappingResult =
  | Readonly<{ ok: true; input: QuoteInputV1 }>
  | Readonly<{ ok: false; issues: readonly DraftIssue[] }>;

function issue(path: string, message: string): DraftIssue {
  return { path, message };
}

function parseInteger(
  value: string,
  path: string,
  label: string,
  min: number,
  max: number,
): number | DraftIssue {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return issue(path, `${label} must be a whole number.`);
  }

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    return issue(path, `${label} must be between ${min} and ${max}.`);
  }
  return parsed;
}

function parseScaledDecimal(
  value: string,
  path: string,
  label: string,
  scale: number,
  min: number,
  max: number,
): number | DraftIssue {
  const trimmed = value.trim().replace(/,/g, "");
  const match = /^(\d+)(?:\.(\d+))?$/.exec(trimmed);
  if (!match) return issue(path, `${label} must be a valid number.`);

  const fraction = match[2] ?? "";
  if (fraction.length > scale) {
    return issue(path, `${label} supports up to ${scale} decimal places.`);
  }

  const scaledText = `${match[1]}${fraction.padEnd(scale, "0")}`;
  const scaled = BigInt(scaledText);
  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
  if (scaled > maxSafe) return issue(path, `${label} is too large.`);

  const parsed = Number(scaled);
  if (parsed < min || parsed > max) {
    return issue(path, `${label} must be within the approved range.`);
  }
  return parsed;
}

export function parseMoneyMinor(
  value: string,
  currency: CurrencyCode,
  path = "pricing.hourlyValue",
): number | DraftIssue {
  const currencyConfig = PRICING_CONFIG_V1.currencies[currency];
  return parseScaledDecimal(
    value,
    path,
    "Minimum hourly value",
    currencyConfig.minorUnitExponent,
    PRICING_CONFIG_V1.validation.hourlyValueMinor.min,
    PRICING_CONFIG_V1.validation.hourlyValueMinor.max,
  );
}

export function parseMarginBasisPoints(
  value: string,
  path = "pricing.targetMarginPercent",
): number | DraftIssue {
  return parseScaledDecimal(
    value,
    path,
    "Target gross margin",
    2,
    PRICING_CONFIG_V1.validation.targetMarginBp.min,
    PRICING_CONFIG_V1.validation.targetMarginBp.max,
  );
}

function collectIssue(
  issues: DraftIssue[],
  result: number | DraftIssue,
): number | undefined {
  if (typeof result === "number") return result;
  issues.push(result);
  return undefined;
}

function mapIntegrationCounts(
  draft: QuoteBuilderDraft,
  issues: DraftIssue[],
): Record<IntegrationKey, number> {
  const counts: Record<IntegrationKey, number> = {
    crm: 0,
    emailMarketing: 0,
    analytics: 0,
    maps: 0,
    otherStandard: 0,
    thirdPartyApi: 0,
    customApi: 0,
  };
  for (const key of Object.keys(draft.integrations) as IntegrationKey[]) {
    const parsed = parseInteger(
      draft.integrations[key],
      `integrations.${key}`,
      "Integration count",
      PRICING_CONFIG_V1.validation.integrationCount.min,
      PRICING_CONFIG_V1.validation.integrationCount.max,
    );
    const value = collectIssue(issues, parsed);
    if (value !== undefined) counts[key] = value;
  }
  return counts;
}

function userFacingDomainMessage(path: string, message: string): string {
  if (path === "project.pageCount") return "Enter a valid number of pages.";
  if (path === "pricing.hourlyValue") {
    return "Enter your minimum hourly value as a positive amount.";
  }
  if (path === "pricing.targetMarginBp") {
    return "Enter a gross margin between 0% and 50%.";
  }
  if (path.startsWith("integrations.")) {
    return "Use a whole-number integration count from 0 to 10.";
  }
  if (path === "delivery.weeklyCapacityHours") {
    return "Use a weekly capacity between 5 and 60 hours, or leave it blank for the default.";
  }
  if (path === "delivery.postLaunchSupportDays") {
    return "Choose one of the supported support durations.";
  }
  if (path === "project.clientContext") {
    return "Keep this optional label to 80 characters or fewer.";
  }
  return message;
}

export function draftToQuoteInput(
  draft: QuoteBuilderDraft,
): DraftMappingResult {
  const issues: DraftIssue[] = [];
  const pageCount = collectIssue(
    issues,
    parseInteger(
      draft.project.pageCount,
      "project.pageCount",
      "Pages/screens",
      PRICING_CONFIG_V1.validation.pageCount.min,
      PRICING_CONFIG_V1.validation.pageCount.max,
    ),
  );
  const hourlyValueMinor = collectIssue(
    issues,
    parseMoneyMinor(draft.pricing.hourlyValue, draft.project.currency),
  );
  const targetMarginBp = collectIssue(
    issues,
    parseMarginBasisPoints(draft.pricing.targetMarginPercent),
  );
  const integrations = mapIntegrationCounts(draft, issues);

  const weeklyCapacity = draft.delivery.weeklyCapacityHours.trim()
    ? collectIssue(
        issues,
        parseInteger(
          draft.delivery.weeklyCapacityHours,
          "delivery.weeklyCapacityHours",
          "Weekly delivery capacity",
          PRICING_CONFIG_V1.validation.weeklyCapacityHours.min,
          PRICING_CONFIG_V1.validation.weeklyCapacityHours.max,
        ),
      )
    : undefined;
  const revisions = collectIssue(
    issues,
    parseInteger(
      draft.delivery.includedRevisionRounds,
      "delivery.includedRevisionRounds",
      "Included revision rounds",
      PRICING_CONFIG_V1.validation.revisionRounds.min,
      PRICING_CONFIG_V1.validation.revisionRounds.max,
    ),
  );
  const supportDays = collectIssue(
    issues,
    parseInteger(
      draft.delivery.postLaunchSupportDays,
      "delivery.postLaunchSupportDays",
      "Post-launch support",
      0,
      60,
    ),
  );

  if (
    draft.project.clientContext.trim().length >
    PRICING_CONFIG_V1.validation.clientContextMaxLength
  ) {
    issues.push(
      issue(
        "project.clientContext",
        "Project context is longer than the approved limit.",
      ),
    );
  }

  if (
    issues.length ||
    pageCount === undefined ||
    hourlyValueMinor === undefined
  ) {
    return {
      ok: false,
      issues: issues.map(({ path, message }) => ({
        path,
        message: userFacingDomainMessage(path, message),
      })),
    };
  }

  const input: QuoteInputV1 = {
    inputVersion: "quote-input-v1",
    project: {
      projectType: draft.project.projectType,
      pageCount,
      currency: draft.project.currency,
      ...(draft.project.clientContext.trim()
        ? { clientContext: draft.project.clientContext.trim() }
        : {}),
    },
    design: { mode: draft.design.mode },
    content: {
      mode: draft.content.mode,
      assetSourcing: draft.content.assetSourcing,
      migration: draft.content.migration,
    },
    features: { ...draft.features },
    integrations,
    delivery: {
      testingLevel: draft.delivery.testingLevel,
      deploymentOwner: draft.delivery.deploymentOwner,
      urgency: draft.delivery.urgency,
      postLaunchSupportDays: supportDays ?? 0,
      maintenanceTier: draft.delivery.maintenanceTier,
      ...(weeklyCapacity !== undefined
        ? { weeklyCapacityHours: weeklyCapacity }
        : {}),
      includedRevisionRounds: revisions ?? 0,
    },
    pricing: {
      hourlyValueMinor: moneyMinor(hourlyValueMinor),
      targetMarginBp: basisPoints(targetMarginBp ?? 0),
      contingency: draft.pricing.contingency,
      riskLevel: draft.pricing.riskLevel,
    },
  };

  const parsed = parseQuoteInputV1(input, PRICING_CONFIG_V1);
  if (!parsed.ok) {
    return {
      ok: false,
      issues: parsed.issues.map(({ path, message }) => ({
        path,
        message: userFacingDomainMessage(path, message),
      })),
    };
  }
  return { ok: true, input: parsed.value };
}

export function formatMoneyInput(
  value: number,
  currency: CurrencyCode,
): string {
  const exponent = PRICING_CONFIG_V1.currencies[currency].minorUnitExponent;
  const text = String(value).padStart(exponent + 1, "0");
  if (exponent === 0) return text;
  const splitAt = text.length - exponent;
  return `${text.slice(0, splitAt)}.${text.slice(splitAt)}`;
}
