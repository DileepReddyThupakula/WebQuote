import { calculateQuote, PRICING_CONFIG_V1 } from "@/domain/quote";
import type { QuoteResultV1 } from "@/domain/quote/types";
import {
  clientSummaryText,
  createClientQuoteDocument,
  formatHours,
  formatMoney,
} from "@/features/client-summary/document";
import {
  clientPlanningRange,
  PLANNING_RANGE_NOTE,
} from "@/features/client-summary/planning-range";
import {
  emptyOverrides,
  updateOverride,
} from "@/features/quote-results/overrides";

import { findRateDerivedLeaks } from "../../../tests/helpers/rate-derived";
import { auditSamples } from "../../../tests/fixtures/quotes/audit-samples";
import { quoteFixtures } from "../../../tests/fixtures/quotes/v1";

function calculate(input: Parameters<typeof calculateQuote>[0]): QuoteResultV1 {
  const outcome = calculateQuote(input, PRICING_CONFIG_V1);
  if (!outcome.ok) throw new Error("fixture calculation failed");
  return outcome.result;
}

const allResults: readonly (readonly [string, QuoteResultV1])[] = [
  ...Object.entries(quoteFixtures).map(
    ([name, input]) => [name, calculate(input)] as const,
  ),
  ...auditSamples.map(
    ({ id, label, input }) =>
      [`audit ${id}: ${label}`, calculate(input)] as const,
  ),
];

function rangeDocument(result: QuoteResultV1, quoteAmountMinor?: number) {
  let overrides = updateOverride(
    emptyOverrides(result),
    "amountPresentation",
    "range",
  );
  if (quoteAmountMinor !== undefined)
    overrides = updateOverride(overrides, "quoteAmountMinor", quoteAmountMinor);
  const document = createClientQuoteDocument(result, overrides);
  if (!document) throw new Error("document unavailable");
  return document;
}

const typical = calculate(quoteFixtures.smallBusinessSite);

describe("client planning range", () => {
  it.each(allResults)(
    "starts at the quoted amount and never below it: %s",
    (_name, result) => {
      const document = rangeDocument(result);
      expect(document.price.lowMinor).toBe(result.pricing.recommendedMinor);
      expect(document.price.highMinor).toBeGreaterThanOrEqual(
        document.price.quoteMinor,
      );
    },
  );

  it.each(allResults)(
    "does not turn the private floor into the client low end unless the quote is the floor: %s",
    (_name, result) => {
      const document = rangeDocument(result);
      if (result.pricing.recommendedMinor > result.pricing.minimumSafeMinor) {
        expect(document.price.lowMinor).not.toBe(
          result.pricing.minimumSafeMinor,
        );
      }
    },
  );

  it("rounds the upper figure up to the currency rounding increment", () => {
    const pricing = {
      recommendedMinor: 97_000,
      rangeHighMinor: 115_000,
      roundingIncrementMinor: 1_000,
    };
    const range = clientPlanningRange(97_000, pricing);
    expect(range).toEqual({ lowMinor: 97_000, highMinor: 115_000 });
    const scaled = clientPlanningRange(100_300, pricing);
    expect(scaled.lowMinor).toBe(100_300);
    expect(scaled.highMinor % 1_000).toBe(0);
    expect(scaled.highMinor).toBeGreaterThanOrEqual(
      (100_300 * 115_000) / 97_000,
    );
    expect(scaled.highMinor).toBeLessThan((100_300 * 115_000) / 97_000 + 1_000);
  });

  it("collapses to the quote when the engine has no upside", () => {
    expect(
      clientPlanningRange(149_000, {
        recommendedMinor: 149_000,
        rangeHighMinor: 149_000,
        roundingIncrementMinor: 1_000,
      }),
    ).toEqual({ lowMinor: 149_000, highMinor: 149_000 });
  });

  it("follows a custom quote amount above and below the engine range", () => {
    const { pricing } = typical;
    for (const custom of [
      pricing.rangeLowMinor - 10_000,
      pricing.recommendedMinor + 12_300,
      pricing.rangeHighMinor + 250_000,
    ]) {
      const document = rangeDocument(typical, custom);
      expect(document.price.quoteMinor).toBe(custom);
      expect(document.price.lowMinor).toBe(custom);
      expect(document.price.highMinor).toBeGreaterThanOrEqual(custom);
      expect(
        document.milestones.reduce((sum, item) => sum + item.amountMinor, 0),
      ).toBe(custom);
    }
  });

  it("restores the calculated range when the custom amount is cleared", () => {
    const custom = rangeDocument(
      typical,
      typical.pricing.recommendedMinor + 50_000,
    );
    const restored = rangeDocument(typical);
    expect(custom.price.lowMinor).not.toBe(restored.price.lowMinor);
    expect(restored.price.lowMinor).toBe(typical.pricing.recommendedMinor);
  });

  it("keeps a below-floor custom quote visible as the low end (warn, don't block)", () => {
    const below = typical.pricing.minimumSafeMinor - 20_000;
    const document = rangeDocument(typical, below);
    expect(document.price.lowMinor).toBe(below);
  });

  it("explains that the upper figure applies only if scope grows", () => {
    const text = clientSummaryText(rangeDocument(typical));
    expect(text).toContain("Planning range:");
    expect(text).toContain(PLANNING_RANGE_NOTE);
    expect(PLANNING_RANGE_NOTE).toMatch(
      /upper figure applies only if the scope grows/,
    );
    expect(
      clientSummaryText(
        createClientQuoteDocument(typical, emptyOverrides(typical))!,
      ),
    ).not.toContain(PLANNING_RANGE_NOTE);
  });
});

describe("client output confidentiality", () => {
  const present = (text: string, needle: string) =>
    new RegExp(
      `(?<![\\d.,])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\d,])`,
    ).test(text);

  it.each(allResults)(
    "never contains the floor, rate, margin or hours: %s",
    (_name, result) => {
      for (const presentation of ["amount", "range"] as const) {
        let overrides = emptyOverrides(result);
        if (presentation === "range")
          overrides = updateOverride(overrides, "amountPresentation", "range");
        const document = createClientQuoteDocument(result, overrides)!;
        const text = clientSummaryText(document);
        const serialized = JSON.stringify(document);
        const { pricing, effort } = result;
        const currency = pricing.currency;

        if (pricing.minimumSafeMinor !== pricing.recommendedMinor) {
          expect(
            present(text, formatMoney(pricing.minimumSafeMinor, currency)),
          ).toBe(false);
        }
        // At 0% margin the published hourly change-request price is the rate
        // itself, which the freelancer chose to offer. Otherwise it must not
        // be printed.
        if (
          !document.changeRequests.some(
            (item) => item.priceMinor === pricing.hourlyValueMinor,
          )
        ) {
          expect(
            present(text, formatMoney(pricing.hourlyValueMinor, currency)),
          ).toBe(false);
        }
        expect(
          findRateDerivedLeaks(
            text,
            result,
            new Set([
              document.price.quoteMinor,
              document.price.lowMinor,
              document.price.highMinor,
              ...document.milestones.map((item) => item.amountMinor),
              ...document.changeRequests.map((item) => item.priceMinor),
              document.revisions.extraRoundPriceMinor,
            ]),
          ),
        ).toEqual([]);
        expect(document.changeRequests.map((item) => item.label)).not.toContain(
          "Hourly out-of-scope work",
        );
        expect(text).not.toMatch(
          /margin|minimum safe|contingency|hourly value|hourly rate|effort|safe price|floor|complexity|overhead/i,
        );
        for (const qh of [
          effort.direct.expectedQh,
          effort.planned.expectedQh,
          effort.delivery.lowQh,
          effort.delivery.expectedQh,
          effort.delivery.highQh,
        ]) {
          expect(text).not.toMatch(
            new RegExp(
              `(?<![\\d.])${formatHours(qh).replace(".", "\\.")}\\s*(h|hrs|hours)\\b`,
              "i",
            ),
          );
        }
        for (const key of [
          "minimumSafe",
          "hourlyValue",
          "targetMargin",
          "ledger",
          "lowQh",
          "expectedQh",
          "highQh",
          "riskLevel",
          "contingency",
        ]) {
          expect(serialized.toLowerCase()).not.toContain(key.toLowerCase());
        }
      }
    },
  );
});
