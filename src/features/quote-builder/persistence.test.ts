import { createDefaultDraft } from "@/features/quote-builder/defaults";
import { calculateQuote, PRICING_CONFIG_V1 } from "@/domain/quote";
import { draftToQuoteInput } from "@/features/quote-builder/mapping";
import {
  DRAFT_STORAGE_KEY,
  RESULT_STORAGE_KEY,
  clearPersistedQuote,
  loadLatestResult,
  loadPersistedDraft,
  saveLatestResult,
  savePersistedDraft,
} from "@/features/quote-builder/persistence";

describe("quote builder persistence", () => {
  beforeEach(() => window.localStorage.clear());

  it("round-trips a versioned draft envelope", () => {
    const saved = savePersistedDraft({
      draft: createDefaultDraft(),
      currentStep: "design",
      completedSteps: ["project"],
    });

    expect(saved).toBe(true);
    expect(loadPersistedDraft()).toMatchObject({ status: "restored" });
  });

  it("recovers from corrupt and unsupported storage without throwing", () => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, "not-json");
    expect(loadPersistedDraft()).toEqual({ status: "corrupt" });

    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ storageVersion: 99 }),
    );
    expect(loadPersistedDraft()).toEqual({ status: "unsupported" });
  });

  it("keeps the latest result separate from draft metadata and clears both", () => {
    const result = {
      resultVersion: "quote-result-v1",
      input: {
        inputVersion: "quote-input-v1",
        project: { projectType: "landing", pageCount: 1, currency: "INR" },
      },
    };
    expect(saveLatestResult(result)).toBe(true);
    expect(window.localStorage.getItem(RESULT_STORAGE_KEY)).toContain(
      "quote-result-v1",
    );
    expect(loadLatestResult()).toBeNull();
    expect(clearPersistedQuote()).toBe(true);
    expect(window.localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(RESULT_STORAGE_KEY)).toBeNull();
  });

  it("round-trips a calculated domain result for the handoff", () => {
    const draft = createDefaultDraft();
    const mapped = draftToQuoteInput({
      ...draft,
      pricing: { ...draft.pricing, hourlyValue: "100" },
    });
    expect(mapped.ok).toBe(true);
    if (!mapped.ok) return;

    const outcome = calculateQuote(mapped.input, PRICING_CONFIG_V1);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(saveLatestResult(outcome.result)).toBe(true);
    expect(loadLatestResult()).toEqual(outcome.result);
  });
});
