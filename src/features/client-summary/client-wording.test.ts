import { ACTIVE_PRICING_CONFIG, calculateQuote } from "@/domain/quote";
import type { QuoteInputV1, QuoteResultV1 } from "@/domain/quote";
import {
  clientSummaryText,
  createClientQuoteDocument,
  formatRevisionPolicy,
  formatSupportDays,
  formatTimeline,
  scopeLines,
} from "@/features/client-summary/document";
import {
  emptyOverrides,
  updateOverride,
} from "@/features/quote-results/overrides";

import { auditSamples } from "../../../tests/fixtures/quotes/audit-samples";
import { quoteFixtures } from "../../../tests/fixtures/quotes/v1";

function calculate(input: QuoteInputV1): QuoteResultV1 {
  const outcome = calculateQuote(input, ACTIVE_PRICING_CONFIG);
  if (!outcome.ok) throw new Error("invalid fixture");
  return outcome.result;
}

const results = [
  ...Object.values(quoteFixtures),
  ...auditSamples.map(({ input }) => input),
].map(calculate);

describe("client wording", () => {
  it("reads the delivery estimate once", () => {
    const base = results[0]!.timeline;
    expect(
      formatTimeline({ ...base, lowWeeks: 3, expectedWeeks: 3, highWeeks: 3 }),
    ).toBe("3 weeks");
    expect(
      formatTimeline({ ...base, lowWeeks: 1, expectedWeeks: 1, highWeeks: 1 }),
    ).toBe("1 week");
    expect(
      formatTimeline({ ...base, lowWeeks: 2, expectedWeeks: 3, highWeeks: 4 }),
    ).toBe("2–4 weeks");
  });

  it.each([
    [0, 2, "No revision rounds are included. An additional round is $20.00."],
    [1, 2, "1 revision round is included. An additional round is $20.00."],
    [3, 2, "3 revision rounds are included. An additional round is $20.00."],
  ])("states %i included rounds in a sentence", (rounds, _unused, expected) => {
    expect(formatRevisionPolicy(rounds, 2_000, "USD")).toBe(expected);
  });

  it("states support in a sentence", () => {
    expect(formatSupportDays(0)).toBe("No post-launch support is included.");
    expect(formatSupportDays(30)).toMatch(/^30 days of post-launch support/);
  });

  it("writes natural scope sentences for a known project", () => {
    const result = calculate(auditSamples.find(({ id }) => id === 2)!.input);
    expect(scopeLines(result)).toEqual([
      "Landing page with 1 page",
      "A custom visual design",
      "Page copy written for the project",
      "Essential testing before launch",
      "Deployment handled by the developer",
      "Contact form",
    ]);
  });

  it("pluralises integrations naturally", () => {
    const base = auditSamples.find(({ id }) => id === 8)!.input;
    const lines = scopeLines(calculate(base));
    expect(lines).toContain(
      "2 third-party api integrations".replace("api", "API"),
    );
    expect(lines).toContain("2 custom API integrations");
  });

  it.each(results.map((result, index) => [index, result] as const))(
    "contains no engine-style labels in client output (case %i)",
    (_index, result) => {
      for (const presentation of ["amount", "range"] as const) {
        let overrides = emptyOverrides(result);
        if (presentation === "range")
          overrides = updateOverride(overrides, "amountPresentation", "range");
        const document = createClientQuoteDocument(result, overrides)!;
        const text = [
          clientSummaryText(document),
          ...document.scope,
          document.timeline,
          document.support,
          document.maintenance,
        ].join("\n");
        expect(text).not.toMatch(
          /Content: |starting point|recommendation|\(expected|handles deployment|the freelancer|×|\b0 days\b|\bundefined\b|\[object|\/month/i,
        );
        expect(text).not.toMatch(/\b(feature-|integration-)/);
        expect(document.timeline).not.toMatch(/expected/);
      }
    },
  );
});
