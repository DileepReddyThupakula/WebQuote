import { z } from "zod";

import { parseQuoteInputV1, PRICING_CONFIG_V1 } from "@/domain/quote";
import { BUILDER_STEP_IDS } from "@/features/quote-builder/steps";
import type {
  BuilderStepId,
  PersistedDraftSnapshot,
  QuoteBuilderDraft,
} from "@/features/quote-builder/types";

export const DRAFT_STORAGE_KEY = "webquote.active-draft.v1";
export const RESULT_STORAGE_KEY = "webquote.latest-result.v1";
const STORAGE_VERSION = 1;

let sessionLatestResult: unknown | null = null;

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

function isStoredResult(
  value: unknown,
): value is { resultVersion: "quote-result-v1"; input: unknown } {
  if (typeof value !== "object" || value === null) return false;
  const result = value as { resultVersion?: unknown; input?: unknown };
  if (result.resultVersion !== "quote-result-v1") return false;
  if (typeof result.input !== "object" || result.input === null) return false;

  const rawInput = Object.fromEntries(
    Object.entries(result.input as Record<string, unknown>).filter(
      ([key]) => key !== "normalization",
    ),
  );
  return parseQuoteInputV1(rawInput, PRICING_CONFIG_V1).ok;
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
    const envelope = {
      storageVersion: STORAGE_VERSION,
      ...snapshot,
      createdAt: snapshot.createdAt ?? now,
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
  sessionLatestResult = result;
  if (!storage) return true;
  try {
    const now = new Date().toISOString();
    storage.setItem(
      RESULT_STORAGE_KEY,
      JSON.stringify({
        storageVersion: STORAGE_VERSION,
        result,
        createdAt: now,
        updatedAt: now,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function loadLatestResult(
  storage: StorageLike | null = getStorage(),
): unknown | null {
  if (sessionLatestResult !== null) {
    const result = sessionLatestResult;
    if (isStoredResult(result)) {
      return result;
    }
    sessionLatestResult = null;
  }
  if (!storage) return null;
  try {
    const raw = storage.getItem(RESULT_STORAGE_KEY);
    if (!raw) return null;
    const candidate: unknown = JSON.parse(raw);
    if (
      typeof candidate !== "object" ||
      candidate === null ||
      (candidate as { storageVersion?: unknown }).storageVersion !==
        STORAGE_VERSION
    ) {
      return null;
    }
    const result = (candidate as { result?: unknown }).result;
    return isStoredResult(result) ? result : null;
  } catch {
    return null;
  }
}

export function clearPersistedQuote(
  storage: StorageLike | null = getStorage(),
): boolean {
  sessionLatestResult = null;
  if (!storage) return false;
  try {
    storage.removeItem(DRAFT_STORAGE_KEY);
    storage.removeItem(RESULT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export type { QuoteBuilderDraft };
