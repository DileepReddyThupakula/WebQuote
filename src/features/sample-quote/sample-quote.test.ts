import {
  ACTIVE_PRICING_CONFIG,
  calculateQuote,
  type QuoteResultV1,
} from "@/domain/quote";
import {
  clientSummaryText,
  formatHours,
  formatMoney,
} from "@/features/client-summary/document";
import {
  buildSampleQuote,
  SAMPLE_QUOTE_INPUT,
} from "@/features/sample-quote/sample-quote";

import { findRateDerivedLeaks } from "../../../tests/helpers/rate-derived";
import { auditSamples } from "../../../tests/fixtures/quotes/audit-samples";

function engineResult(): QuoteResultV1 {
  const outcome = calculateQuote(SAMPLE_QUOTE_INPUT, ACTIVE_PRICING_CONFIG);
  if (!outcome.ok) throw new Error("invalid sample");
  return outcome.result;
}

describe("landing-page sample quote", () => {
  it("is audit sample 11 plus a 14-day support window", () => {
    const audit = auditSamples.find(({ id }) => id === 11)!;
    expect(SAMPLE_QUOTE_INPUT).toEqual({
      ...audit.input,
      delivery: { ...audit.input.delivery, postLaunchSupportDays: 14 },
    });
  });

  it("shows the engine's recommended quote and milestones, not invented numbers", () => {
    const result = engineResult();
    const document = buildSampleQuote();
    expect(document.price.presentation).toBe("amount");
    expect(document.price.quoteMinor).toBe(result.pricing.recommendedMinor);
    expect(document.milestones.map((item) => item.amountMinor)).toEqual(
      result.payment.milestones.map((item) => item.amountMinor),
    );
    expect(
      document.milestones.reduce((sum, item) => sum + item.amountMinor, 0),
    ).toBe(result.pricing.recommendedMinor);
    expect(document.currency).toBe("INR");
  });

  it("reads as natural sentences, with the delivery estimate stated once", () => {
    const document = buildSampleQuote();
    expect(document.scope).toEqual([
      "Business website with 5 pages",
      "Design based on a ready-made template",
      "Page content supplied by you",
      "Essential testing before launch",
      "Deployment handled by the developer",
      "Contact form",
      "Analytics integration",
    ]);
    expect(document.timeline).toBe("2–3 weeks");
    expect(document.support).toBe(
      "14 days of post-launch support to fix defects in the agreed work.",
    );
    expect(document.maintenance).toBe("No ongoing maintenance is included.");
  });

  it("never exposes the floor, rate, margin or hours", () => {
    const result = engineResult();
    const document = buildSampleQuote();
    const text = clientSummaryText(document);
    const serialized = JSON.stringify(document);
    const { pricing, effort } = result;

    expect(pricing.minimumSafeMinor).toBeLessThan(pricing.recommendedMinor);
    for (const hidden of [pricing.minimumSafeMinor, pricing.hourlyValueMinor]) {
      const formatted = formatMoney(hidden, pricing.currency);
      expect(text).not.toContain(formatted);
    }
    expect(
      findRateDerivedLeaks(
        text,
        result,
        new Set([
          document.price.quoteMinor,
          ...document.milestones.map((item) => item.amountMinor),
          ...document.changeRequests.map((item) => item.priceMinor),
          document.revisions.extraRoundPriceMinor,
        ]),
      ),
    ).toEqual([]);
    expect(document.changeRequests.map((item) => item.label)).toEqual([
      "Additional page",
      "Additional revision round",
      "Standard integration",
      "Third-party API",
      "Custom API",
    ]);
    expect(text).not.toMatch(
      /margin|minimum safe|contingency|hourly value|hourly rate|effort|floor|overhead/i,
    );
    for (const qh of [
      effort.direct.expectedQh,
      effort.delivery.lowQh,
      effort.delivery.expectedQh,
      effort.delivery.highQh,
    ]) {
      expect(text).not.toMatch(
        new RegExp(`(?<![\\d.])${formatHours(qh)}\\s*(h|hrs|hours)\\b`, "i"),
      );
    }
    for (const key of [
      "minimumSafe",
      "hourlyValue",
      "targetMargin",
      "ledger",
    ]) {
      expect(serialized).not.toContain(key);
    }
  });
});
