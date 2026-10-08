import { z } from "zod";

import type { QuoteResultV1 } from "@/domain/quote/types";
import {
  OVERRIDE_STORAGE_KEY,
  resultIdentity,
} from "@/features/quote-builder/persistence";
import {
  getSessionOverrides,
  setSessionOverrides,
} from "@/features/quote-results/override-session";

const valuesSchema = z.strictObject({
  quoteAmountMinor: z.number().int().safe().nonnegative().optional(),
  amountPresentation: z.enum(["amount", "range"]).optional(),
  deliveryStatement: z.string().trim().min(1).max(240).optional(),
  milestonePercentBp: z
    .array(z.number().int().safe().min(0).max(10_000))
    .optional(),
  includedRevisionRounds: z.number().int().safe().min(0).max(20).optional(),
  extraRevisionAmountMinor: z.number().int().safe().nonnegative().optional(),
  maintenanceOffer: z.string().trim().max(240).optional(),
  maintenanceAmountMinor: z.number().int().safe().nonnegative().optional(),
  includedScope: z.array(z.string().trim().min(1).max(240)).max(50).optional(),
  exclusions: z.array(z.string().trim().min(1).max(240)).max(50).optional(),
  projectLabel: z.string().trim().max(80).optional(),
  clientLabel: z.string().trim().max(80).optional(),
  clientNotes: z.string().trim().max(2000).optional(),
});

export type QuoteOverrideValuesV1 = z.infer<typeof valuesSchema>;
export type QuoteOverridesV1 = Readonly<{
  overrideVersion: "quote-overrides-v1";
  resultIdentity: string;
  resultVersion: "quote-result-v1";
  modelVersion: string;
  pricingConfig: QuoteResultV1["pricingConfig"];
  values: QuoteOverrideValuesV1;
}>;

const envelopeSchema = z.strictObject({
  storageVersion: z.literal(1),
  overrideVersion: z.literal("quote-overrides-v1"),
  resultIdentity: z.string().min(1),
  resultVersion: z.literal("quote-result-v1"),
  modelVersion: z.string().min(1),
  pricingConfig: z.strictObject({
    id: z.string(),
    version: z.string(),
    effectiveAt: z.string(),
  }),
  values: valuesSchema,
});

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function emptyOverrides(result: QuoteResultV1): QuoteOverridesV1 {
  return {
    overrideVersion: "quote-overrides-v1",
    resultIdentity: resultIdentity(result),
    resultVersion: result.resultVersion,
    modelVersion: result.modelVersion,
    pricingConfig: result.pricingConfig,
    values: {},
  };
}

function matches(result: QuoteResultV1, candidate: QuoteOverridesV1): boolean {
  return (
    candidate.resultIdentity === resultIdentity(result) &&
    candidate.resultVersion === result.resultVersion &&
    candidate.modelVersion === result.modelVersion &&
    JSON.stringify(candidate.pricingConfig) ===
      JSON.stringify(result.pricingConfig) &&
    (candidate.values.milestonePercentBp === undefined ||
      candidate.values.milestonePercentBp.length ===
        result.payment.milestones.length)
  );
}

export type OverrideLoadResult = Readonly<{
  status: "restored" | "empty" | "corrupt" | "stale" | "unavailable";
  overrides: QuoteOverridesV1;
}>;

export function loadOverrides(
  result: QuoteResultV1,
  storage: StorageLike | null = browserStorage(),
): OverrideLoadResult {
  const empty = emptyOverrides(result);
  const sessionOverrides = getSessionOverrides();
  if (sessionOverrides && matches(result, sessionOverrides))
    return { status: "restored", overrides: sessionOverrides };
  if (!storage) return { status: "unavailable", overrides: empty };
  try {
    const raw = storage.getItem(OVERRIDE_STORAGE_KEY);
    if (!raw) return { status: "empty", overrides: empty };
    const parsed = envelopeSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { status: "corrupt", overrides: empty };
    if (!matches(result, parsed.data))
      return { status: "stale", overrides: empty };
    setSessionOverrides(parsed.data);
    return { status: "restored", overrides: parsed.data };
  } catch {
    return { status: "corrupt", overrides: empty };
  }
}

export function saveOverrides(
  overrides: QuoteOverridesV1,
  storage: StorageLike | null = browserStorage(),
): boolean {
  const parsed = envelopeSchema.safeParse({ storageVersion: 1, ...overrides });
  if (!parsed.success) return false;
  setSessionOverrides(overrides);
  if (!storage) return false;
  try {
    storage.setItem(OVERRIDE_STORAGE_KEY, JSON.stringify(parsed.data));
    return true;
  } catch {
    return false;
  }
}

export function updateOverride<K extends keyof QuoteOverrideValuesV1>(
  overrides: QuoteOverridesV1,
  key: K,
  value: QuoteOverrideValuesV1[K] | undefined,
): QuoteOverridesV1 {
  const values = { ...overrides.values };
  if (value === undefined) delete values[key];
  else values[key] = value;
  const next = { ...overrides, values };
  return envelopeSchema.safeParse({ storageVersion: 1, ...next }).success
    ? next
    : overrides;
}

export function milestoneTotalBp(
  result: QuoteResultV1,
  overrides: QuoteOverridesV1,
): number {
  return (
    overrides.values.milestonePercentBp ??
    result.payment.milestones.map((item) => item.percentBp)
  ).reduce((sum, value) => sum + value, 0);
}

export function milestonesPublishable(
  result: QuoteResultV1,
  overrides: QuoteOverridesV1,
): boolean {
  return milestoneTotalBp(result, overrides) === 10_000;
}
