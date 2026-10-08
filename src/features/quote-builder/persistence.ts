import { z } from "zod";

import { BUILDER_STEP_IDS } from "@/features/quote-builder/steps";
import type {
  BuilderStepId,
  PersistedDraftSnapshot,
  QuoteBuilderDraft,
} from "@/features/quote-builder/types";
import type { QuoteResultV1 } from "@/domain/quote/types";
import { parseStoredQuoteResult } from "@/features/quote-results/result-schema";
import {
  clearSessionOverrides,
  getSessionOverrides,
} from "@/features/quote-results/override-session";

export const DRAFT_STORAGE_KEY = "webquote.active-draft.v1";
export const RESULT_STORAGE_KEY = "webquote.latest-result.v1";
export const OVERRIDE_STORAGE_KEY = "webquote.commercial-overrides.v1";
const STORAGE_VERSION = 1;
const RESULT_STORAGE_VERSION = 2;

let sessionLatestResult: unknown | null = null;
let staleOverridesReset = false;

const featureKeys = [
  "contactForm",
  "blogCms",
  "search",
  "authentication",
  "userAccounts",
  "adminDashboard",
  "booking",
  "payments",
  "ecommerce",
  "membership",
  "subscriptions",
] as const;
const integrationKeys = [
  "crm",
  "emailMarketing",
  "analytics",
  "maps",
  "otherStandard",
  "thirdPartyApi",
  "customApi",
] as const;
const stepSchema = z.enum(
  BUILDER_STEP_IDS as [BuilderStepId, ...BuilderStepId[]],
);

const draftSchema = z.strictObject({
  inputVersion: z.literal("quote-input-v1"),
  project: z.strictObject({
    projectType: z.enum([
      "landing",
      "business",
      "portfolio",
      "blog",
      "ecommerce",
      "webApp",
      "custom",
    ]),
    pageCount: z.string(),
    currency: z.enum(["INR", "USD", "GBP", "EUR"]),
    clientContext: z.string(),
  }),
  design: z.strictObject({
    mode: z.enum(["provided", "template", "custom", "fullUx"]),
  }),
  content: z.strictObject({
    mode: z.enum(["provided", "formatting", "copywriting"]),
    assetSourcing: z.boolean(),
    migration: z.enum(["none", "light", "standard", "complex"]),
  }),
  features: z.object(
    Object.fromEntries(featureKeys.map((key) => [key, z.boolean()])) as Record<
      (typeof featureKeys)[number],
      z.ZodBoolean
    >,
  ),
  integrations: z.object(
    Object.fromEntries(
      featureKeys.length ? integrationKeys.map((key) => [key, z.string()]) : [],
    ) as Record<(typeof integrationKeys)[number], z.ZodString>,
  ),
  delivery: z.strictObject({
    testingLevel: z.enum(["essential", "enhanced"]),
    deploymentOwner: z.enum(["client", "freelancer"]),
    urgency: z.enum(["standard", "priority", "rush"]),
    postLaunchSupportDays: z.string(),
    maintenanceTier: z.enum(["none", "essential", "standard", "priority"]),
    weeklyCapacityHours: z.string(),
    includedRevisionRounds: z.string(),
  }),
  pricing: z.strictObject({
    hourlyValue: z.string(),
    targetMarginPercent: z.string(),
    contingency: z.enum(["lean", "balanced", "cautious"]),
    riskLevel: z.enum(["low", "medium", "high"]),
  }),
  ui: z.strictObject({ apiWorkEnabled: z.boolean() }),
});

const draftEnvelopeSchema = z.strictObject({
  storageVersion: z.literal(STORAGE_VERSION),
  draft: draftSchema,
  currentStep: stepSchema,
  completedSteps: z.array(stepSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function resultIdentity(result: QuoteResultV1): string {
  const input = Object.fromEntries(
    Object.entries(result.input).filter(([key]) => key !== "normalization"),
  );
  const text = JSON.stringify({
    resultVersion: result.resultVersion,
    modelVersion: result.modelVersion,
    pricingConfig: result.pricingConfig,
    input,
  });
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < text.length; index += 1) {
    hash = BigInt.asUintN(
      64,
      (hash ^ BigInt(text.charCodeAt(index))) * 0x100000001b3n,
    );
  }
  return `quote-result-v1:${hash.toString(16).padStart(16, "0")}`;
}

export function consumeStaleOverrideNotice(): boolean {
  const wasReset = staleOverridesReset;
  staleOverridesReset = false;
  return wasReset;
}

export type DraftLoadResult =
  | Readonly<{ status: "empty" }>
  | Readonly<{ status: "restored"; snapshot: PersistedDraftSnapshot }>
  | Readonly<{ status: "corrupt" | "unsupported" | "unavailable" }>;

function getStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadPersistedDraft(
  storage: StorageLike | null = getStorage(),
): DraftLoadResult {
  if (!storage) return { status: "unavailable" };
  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return { status: "empty" };
    const candidate: unknown = JSON.parse(raw);
    if (
      typeof candidate !== "object" ||
      candidate === null ||
      (candidate as { storageVersion?: unknown }).storageVersion !==
        STORAGE_VERSION
    ) {
      return { status: "unsupported" };
    }
    const parsed = draftEnvelopeSchema.safeParse(candidate);
    return parsed.success
      ? { status: "restored", snapshot: parsed.data }
      : { status: "corrupt" };
  } catch {
    return { status: "corrupt" };
  }
}

export function savePersistedDraft(
  snapshot: Omit<PersistedDraftSnapshot, "createdAt" | "updatedAt"> &
    Partial<Pick<PersistedDraftSnapshot, "createdAt" | "updatedAt">>,
  storage: StorageLike | null = getStorage(),
): boolean {
  if (!storage) return false;
  try {
    const now = new Date().toISOString();
    const previous = snapshot.createdAt ? null : loadPersistedDraft(storage);
    const envelope = {
      storageVersion: STORAGE_VERSION,
      ...snapshot,
      createdAt:
        snapshot.createdAt ??
        (previous?.status === "restored" ? previous.snapshot.createdAt : now),
      updatedAt: snapshot.updatedAt ?? now,
    };
    const parsed = draftEnvelopeSchema.parse(envelope);
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(parsed));
    return true;
  } catch {
    return false;
  }
}

export function saveLatestResult(
  result: unknown,
  storage: StorageLike | null = getStorage(),
): boolean {
  const valid = parseStoredQuoteResult(result);
  if (!valid) return false;
  sessionLatestResult = valid;
  if (
    getSessionOverrides()?.resultIdentity !== undefined &&
    getSessionOverrides()?.resultIdentity !== resultIdentity(valid)
  ) {
    clearSessionOverrides();
    staleOverridesReset = true;
  }
  if (!storage) return true;
  try {
    const rawOverrides = storage.getItem(OVERRIDE_STORAGE_KEY);
    if (rawOverrides) {
      let storedIdentity: unknown;
      try {
        storedIdentity = (
          JSON.parse(rawOverrides) as { resultIdentity?: unknown }
        ).resultIdentity;
      } catch {
        storedIdentity = null;
      }
      if (storedIdentity !== resultIdentity(valid)) {
        storage.removeItem(OVERRIDE_STORAGE_KEY);
        clearSessionOverrides();
        staleOverridesReset = true;
      }
    }
    const now = new Date().toISOString();
    storage.setItem(
      RESULT_STORAGE_KEY,
      JSON.stringify({
        storageVersion: RESULT_STORAGE_VERSION,
        result: valid,
        resultIdentity: resultIdentity(valid),
        pricingConfig: valid.pricingConfig,
        createdAt: now,
        updatedAt: now,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export type ResultLoadResult =
  | Readonly<{ status: "restored"; result: QuoteResultV1 }>
  | Readonly<{ status: "empty" | "corrupt" | "unsupported" | "unavailable" }>;

export function loadLatestResultState(
  storage: StorageLike | null = getStorage(),
): ResultLoadResult {
  if (sessionLatestResult !== null) {
    const result = parseStoredQuoteResult(sessionLatestResult);
    if (result) return { status: "restored", result };
    sessionLatestResult = null;
  }
  if (!storage) return { status: "unavailable" };
  try {
    const raw = storage.getItem(RESULT_STORAGE_KEY);
    if (!raw) return { status: "empty" };
    const candidate: unknown = JSON.parse(raw);
    if (typeof candidate !== "object" || candidate === null) {
      return { status: "corrupt" };
    }
    const envelope = candidate as {
      storageVersion?: unknown;
      result?: unknown;
      resultIdentity?: unknown;
      pricingConfig?: unknown;
    };
    if (
      envelope.storageVersion !== STORAGE_VERSION &&
      envelope.storageVersion !== RESULT_STORAGE_VERSION
    )
      return { status: "unsupported" };
    const result = parseStoredQuoteResult(envelope.result);
    if (!result) return { status: "corrupt" };
    if (
      envelope.storageVersion === RESULT_STORAGE_VERSION &&
      (envelope.resultIdentity !== resultIdentity(result) ||
        JSON.stringify(envelope.pricingConfig) !==
          JSON.stringify(result.pricingConfig))
    )
      return { status: "corrupt" };
    return { status: "restored", result };
  } catch {
    return { status: "corrupt" };
  }
}

export function loadLatestResult(
  storage: StorageLike | null = getStorage(),
): unknown | null {
  const loaded = loadLatestResultState(storage);
  return loaded.status === "restored" ? loaded.result : null;
}

export function clearPersistedQuote(
  storage: StorageLike | null = getStorage(),
): boolean {
  sessionLatestResult = null;
  clearSessionOverrides();
  staleOverridesReset = false;
  if (!storage) return false;
  try {
    storage.removeItem(DRAFT_STORAGE_KEY);
    storage.removeItem(RESULT_STORAGE_KEY);
    storage.removeItem(OVERRIDE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export type { QuoteBuilderDraft };
