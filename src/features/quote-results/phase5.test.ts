import { calculateQuote, PRICING_CONFIG_V1 } from "@/domain/quote";
import type { QuoteResultV1 } from "@/domain/quote/types";
import { copyClientSummary } from "@/features/client-summary/clipboard";
import {
  clientSummaryText,
  createClientQuoteDocument,
  formatMoney,
  parseMoneyText,
} from "@/features/client-summary/document";
import {
  clearPersistedQuote,
  loadLatestResultState,
  OVERRIDE_STORAGE_KEY,
  RESULT_STORAGE_KEY,
  resultIdentity,
  saveLatestResult,
} from "@/features/quote-builder/persistence";
import {
  emptyOverrides,
  loadOverrides,
  milestoneTotalBp,
  milestonesPublishable,
  saveOverrides,
  updateOverride,
} from "@/features/quote-results/overrides";
import { parseStoredQuoteResult } from "@/features/quote-results/result-schema";
import { quoteFixtures } from "../../../tests/fixtures/quotes/v1";

function result(input: typeof quoteFixtures.smallBusinessSite): QuoteResultV1 {
  const outcome = calculateQuote(input, PRICING_CONFIG_V1);
  if (!outcome.ok) throw new Error("fixture calculation failed");
  return outcome.result;
}

const simple = result(quoteFixtures.simpleLandingPage);
const typical = result(quoteFixtures.smallBusinessSite);
const complex = result(quoteFixtures.saasWebApplication);

describe("Phase 5 result and client document", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearPersistedQuote();
  });

  it.each([simple, typical, complex])(
    "accepts a complete deterministic result and keeps its displayed totals exact",
    (quote) => {
      expect(parseStoredQuoteResult(quote)).toEqual(quote);
      expect(quote.ledger.pricing.at(-1)?.outputMinor).toBe(
        quote.pricing.recommendedMinor,
      );
      expect(
        quote.ledger.effort.reduce((sum, item) => sum + item.amountQh, 0),
      ).toBe(quote.effort.delivery.expectedQh);
      expect(
        formatMoney(quote.pricing.minimumSafeMinor, quote.pricing.currency),
      ).toContain(".");
      expect(
        quote.effort.complexityAdditional.expectedQh,
      ).toBeGreaterThanOrEqual(0);
      expect(quote.risk.contingencyQh).toBeGreaterThanOrEqual(0);
    },
  );

  it("layers a quote override without mutating the calculated result and restores it", () => {
    const original = typical.pricing.recommendedMinor;
    const custom = updateOverride(
      emptyOverrides(typical),
      "quoteAmountMinor",
      typical.pricing.minimumSafeMinor - 1,
    );
    expect(custom.values.quoteAmountMinor).toBeLessThan(
      typical.pricing.minimumSafeMinor,
    );
    expect(typical.pricing.recommendedMinor).toBe(original);
    expect(createClientQuoteDocument(typical, custom)?.price.quoteMinor).toBe(
      typical.pricing.minimumSafeMinor - 1,
    );
    expect(
      updateOverride(custom, "quoteAmountMinor", undefined).values
        .quoteAmountMinor,
    ).toBeUndefined();
  });

  it("requires exact 100% milestones and reconciles custom amounts", () => {
    const custom = updateOverride(
      emptyOverrides(typical),
      "milestonePercentBp",
      typical.payment.milestones.map((item, index) =>
        index === 0 ? item.percentBp - 100 : item.percentBp,
      ),
    );
    expect(milestoneTotalBp(typical, custom)).toBe(9_900);
    expect(milestonesPublishable(typical, custom)).toBe(false);
    expect(createClientQuoteDocument(typical, custom)).toBeNull();
    const valid = updateOverride(
      custom,
      "milestonePercentBp",
      typical.payment.milestones.map((item, index) =>
        index === 0
          ? item.percentBp - 100
          : index === 1
            ? item.percentBp + 100
            : item.percentBp,
      ),
    );
    const document = createClientQuoteDocument(typical, valid)!;
    expect(
      document.milestones.reduce((sum, item) => sum + item.percentBp, 0),
    ).toBe(10_000);
    expect(
      document.milestones.reduce((sum, item) => sum + item.amountMinor, 0),
    ).toBe(typical.pricing.recommendedMinor);
  });

  it("builds client text with commercial terms and excludes internal pricing by default", () => {
    const document = createClientQuoteDocument(
      complex,
      emptyOverrides(complex),
    )!;
    const text = clientSummaryText(document);
    expect(text).toContain("Included scope:");
    expect(text).toContain("Exclusions:");
    expect(text).toContain("Payment milestones:");
    expect(text).toContain("Additional work by written change request:");
    expect(text).toContain("Maintenance:");
    expect(document).not.toHaveProperty("ledger");
    expect(document).not.toHaveProperty("hourlyValueMinor");
    expect(document).not.toHaveProperty("minimumSafeMinor");
    expect(document).not.toHaveProperty("risk");
    expect(document).not.toHaveProperty("pricingConfig");
    expect(text).not.toContain("Target margin");
  });

  it("keeps working-draft context out of client output unless a project label is approved", () => {
    const withContext = {
      ...typical,
      input: {
        ...typical.input,
        project: {
          ...typical.input.project,
          clientContext: "Internal discovery note",
        },
      },
    };
    const calculated = createClientQuoteDocument(
      withContext,
      emptyOverrides(withContext),
    )!;
    expect(calculated.projectLabel).toBeUndefined();
    expect(clientSummaryText(calculated)).not.toContain(
      "Internal discovery note",
    );

    const approved = createClientQuoteDocument(
      withContext,
      updateOverride(emptyOverrides(withContext), "projectLabel", "New site"),
    )!;
    expect(approved.projectLabel).toBe("New site");
  });

  it("uses integer minor units when parsing commercial amounts", () => {
    expect(parseMoneyText("1,234.56", "USD")).toBe(123456);
    expect(parseMoneyText("1.234", "USD")).toBeNull();
    expect(parseMoneyText("-1", "USD")).toBeNull();
  });

  it("handles clipboard success, denial, and absence", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await copyClientSummary("quote", { writeText })).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("quote");
    expect(
      await copyClientSummary("quote", {
        writeText: vi.fn().mockRejectedValue(new Error("denied")),
      }),
    ).toBe("manual");
    expect(await copyClientSummary("quote", undefined)).toBe("manual");
  });

  it("restores the result and override under their original config identity", () => {
    expect(saveLatestResult(typical)).toBe(true);
    const overrides = updateOverride(
      emptyOverrides(typical),
      "clientNotes",
      "Payment after approval.",
    );
    expect(saveOverrides(overrides)).toBe(true);
    expect(loadLatestResultState()).toEqual({
      status: "restored",
      result: typical,
    });
    expect(loadOverrides(typical).overrides.values.clientNotes).toBe(
      "Payment after approval.",
    );
    expect(resultIdentity(typical)).toContain("quote-result-v1:");
    expect(loadLatestResultState().status).toBe("restored");
  });

  it("renders a valid stored historical config identity without recalculation", () => {
    const historical = {
      ...typical,
      modelVersion: "historical-model",
      pricingConfig: {
        ...typical.pricingConfig,
        version: "historical-calibration",
      },
    } as QuoteResultV1;
    expect(saveLatestResult(historical)).toBe(true);
    const loaded = loadLatestResultState();
    expect(loaded.status).toBe("restored");
    if (loaded.status !== "restored") return;
    expect(loaded.result.pricingConfig.version).toBe("historical-calibration");
    expect(loaded.result.pricing.recommendedMinor).toBe(
      typical.pricing.recommendedMinor,
    );
    expect(resultIdentity(historical)).not.toBe(resultIdentity(typical));
    expect(
      createClientQuoteDocument(loaded.result, emptyOverrides(loaded.result)),
    ).not.toBeNull();
  });

  it("recovers safely from malformed or unsupported result storage", () => {
    clearPersistedQuote();
    window.localStorage.setItem(RESULT_STORAGE_KEY, "{");
    expect(loadLatestResultState().status).toBe("corrupt");
    window.localStorage.setItem(
      RESULT_STORAGE_KEY,
      JSON.stringify({ storageVersion: 99 }),
    );
    expect(loadLatestResultState().status).toBe("unsupported");
    window.localStorage.setItem(
      RESULT_STORAGE_KEY,
      JSON.stringify({
        storageVersion: 2,
        result: { resultVersion: "quote-result-v1" },
      }),
    );
    expect(loadLatestResultState().status).toBe("corrupt");
  });

  it("recovers from malformed overrides and drops stale terms after recalculation", () => {
    window.localStorage.setItem(OVERRIDE_STORAGE_KEY, "not-json");
    expect(loadOverrides(simple).status).toBe("corrupt");
    const old = updateOverride(emptyOverrides(typical), "quoteAmountMinor", 1);
    expect(saveOverrides(old)).toBe(true);
    expect(saveLatestResult(typical)).toBe(true);
    expect(saveLatestResult(complex)).toBe(true);
    expect(window.localStorage.getItem(OVERRIDE_STORAGE_KEY)).toBeNull();
    expect(
      loadOverrides(complex).overrides.values.quoteAmountMinor,
    ).toBeUndefined();
  });

  it("keeps an in-memory result when storage writes fail", () => {
    const broken = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {},
    };
    expect(saveLatestResult(simple, broken)).toBe(false);
    expect(loadLatestResultState(broken)).toEqual({
      status: "restored",
      result: simple,
    });
  });
});
