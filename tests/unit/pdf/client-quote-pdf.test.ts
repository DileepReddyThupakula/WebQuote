import { readFileSync } from "node:fs";

import { ACTIVE_PRICING_CONFIG, calculateQuote } from "@/domain/quote";
import type { QuoteInputV1, QuoteResultV1 } from "@/domain/quote";
import {
  createClientQuoteDocument,
  formatHours,
  formatMoney,
  type ClientQuoteDocumentV1,
} from "@/features/client-summary/document";
import { PLANNING_RANGE_NOTE } from "@/features/client-summary/planning-range";
import {
  emptyOverrides,
  updateOverride,
} from "@/features/quote-results/overrides";
import { buildSampleQuote } from "@/features/sample-quote/sample-quote";
import {
  renderClientQuotePdf,
  type PdfFonts,
} from "@/infrastructure/pdf/render-client-quote-pdf";

import { auditSamples } from "../../fixtures/quotes/audit-samples";
import { quoteFixtures } from "../../fixtures/quotes/v1";
import { extractPdfText } from "../../helpers/pdf-text";
import { findRateDerivedLeaks } from "../../helpers/rate-derived";

const fonts: PdfFonts = {
  regular: new Uint8Array(readFileSync("public/fonts/pdf/Geist-Regular.ttf")),
  semiBold: new Uint8Array(readFileSync("public/fonts/pdf/Geist-SemiBold.ttf")),
};

function calculate(input: QuoteInputV1): QuoteResultV1 {
  const outcome = calculateQuote(input, ACTIVE_PRICING_CONFIG);
  if (!outcome.ok) throw new Error("invalid fixture");
  return outcome.result;
}

function clientDocument(
  result: QuoteResultV1,
  presentation: "amount" | "range",
): ClientQuoteDocumentV1 {
  let overrides = emptyOverrides(result);
  if (presentation === "range")
    overrides = updateOverride(overrides, "amountPresentation", "range");
  const document = createClientQuoteDocument(result, overrides);
  if (!document) throw new Error("document unavailable");
  return document;
}

const cases: readonly (readonly [string, QuoteResultV1])[] = [
  ...Object.entries(quoteFixtures).map(
    ([name, input]) => [name, calculate(input)] as const,
  ),
  ...auditSamples.map(
    ({ id, label, input }) =>
      [`audit ${id}: ${label}`, calculate(input)] as const,
  ),
];

describe("client quote PDF", () => {
  it("is a valid A4 PDF with selectable text, a footer and page numbers", async () => {
    const bytes = await renderClientQuotePdf(
      buildSampleQuote(),
      { preparedOn: "10 October 2026" },
      fonts,
    );
    const pdf = extractPdfText(bytes);
    expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe("%PDF-");
    expect(Buffer.from(bytes.subarray(-8)).toString()).toContain("%%EOF");
    expect(pdf.pageCount).toBeGreaterThanOrEqual(1);
    expect(pdf.mediaBox[0]).toBeCloseTo(595.28, 1);
    expect(pdf.mediaBox[1]).toBeCloseTo(841.89, 1);
    expect(pdf.fonts).toContain("Geist");
    for (const [index, page] of pdf.pages.entries()) {
      expect(page).toContain("Prepared with WebQuote");
      expect(page).toContain(`Page ${index + 1} of ${pdf.pageCount}`);
    }
    expect(pdf.text).toContain("Business website");
    expect(pdf.text).toContain("₹1,01,500");
    expect(pdf.text).toContain("Payment plan");
    expect(pdf.text).toContain("Prepared on 10 October 2026");
    expect(pdf.info).toContain("/Creator (WebQuote)");
  });

  it("includes the sender header only when given", async () => {
    const document = buildSampleQuote();
    const withHeader = extractPdfText(
      await renderClientQuotePdf(
        document,
        { senderName: "Asha Rao Studio", contactLine: "asha@example.com" },
        fonts,
      ),
    );
    expect(withHeader.pages[0]).toContain("Asha Rao Studio");
    expect(withHeader.pages[0]).toContain("asha@example.com");
    const without = extractPdfText(
      await renderClientQuotePdf(document, {}, fonts),
    );
    expect(without.text).not.toContain("Asha Rao Studio");
  });

  it("treats the header as plain text and strips control characters", async () => {
    const pdf = extractPdfText(
      await renderClientQuotePdf(
        buildSampleQuote(),
        { senderName: "<b>Studio</b>\u0000\u0007\n(x)\\", contactLine: "a\tb" },
        fonts,
      ),
    );
    expect(pdf.pages[0]).toContain("<b>Studio</b> (x)\\");
    expect(pdf.text).not.toMatch(/[\u0000-\u0008]/);
  });

  it("prints the planning-range note and the quoted amount for range presentation", async () => {
    const result = calculate(quoteFixtures.smallBusinessSite);
    const document = clientDocument(result, "range");
    const pdf = extractPdfText(await renderClientQuotePdf(document, {}, fonts));
    expect(pdf.text).toContain("Planning range");
    expect(pdf.text).toContain(PLANNING_RANGE_NOTE.slice(0, 40));
    expect(pdf.text).toContain(
      formatMoney(document.price.lowMinor, document.currency),
    );
    expect(pdf.text).toContain(
      formatMoney(document.price.highMinor, document.currency),
    );
  });

  it("paginates long content without dropping lines", async () => {
    const base = buildSampleQuote();
    const long: ClientQuoteDocumentV1 = {
      ...base,
      scope: Array.from({ length: 70 }, (_, i) => `Scope item number ${i + 1}`),
    };
    const pdf = extractPdfText(await renderClientQuotePdf(long, {}, fonts));
    expect(pdf.pageCount).toBeGreaterThan(1);
    for (let i = 1; i <= 70; i += 1)
      expect(pdf.text).toContain(`Scope item number ${i}`);
    expect(pdf.pages.at(-1)).toContain(
      `Page ${pdf.pageCount} of ${pdf.pageCount}`,
    );
  });

  it.each(["GBP", "EUR", "USD", "INR"] as const)(
    "renders %s amounts with the right symbol",
    async (currency) => {
      const document = { ...buildSampleQuote(), currency };
      const pdf = extractPdfText(
        await renderClientQuotePdf(document, {}, fonts),
      );
      const symbol = { GBP: "£", EUR: "€", USD: "$", INR: "₹" }[currency];
      expect(pdf.text).toContain(symbol);
      expect(pdf.text).not.toContain("�");
    },
  );
});

describe("client quote PDF confidentiality", () => {
  it.each(cases)(
    "never contains the floor, rate, margin or hours: %s",
    async (_name, result) => {
      for (const presentation of ["amount", "range"] as const) {
        const document = clientDocument(result, presentation);
        const pdf = extractPdfText(
          await renderClientQuotePdf(
            document,
            { senderName: "Studio", preparedOn: "10 October 2026" },
            fonts,
          ),
        );
        const text = pdf.text;
        expect(text).not.toContain("�");

        const { pricing, effort } = result;
        const currency = pricing.currency;
        const present = (needle: string) =>
          new RegExp(
            `(?<![\\d.,])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\d,])`,
          ).test(text);

        const priced = new Set([
          document.price.quoteMinor,
          document.price.lowMinor,
          document.price.highMinor,
          ...document.milestones.map((item) => item.amountMinor),
          ...document.changeRequests.map((item) => item.priceMinor),
          document.revisions.extraRoundPriceMinor,
        ]);
        if (!priced.has(pricing.minimumSafeMinor)) {
          expect(present(formatMoney(pricing.minimumSafeMinor, currency))).toBe(
            false,
          );
        }
        if (!priced.has(pricing.hourlyValueMinor)) {
          expect(present(formatMoney(pricing.hourlyValueMinor, currency))).toBe(
            false,
          );
        }
        expect(findRateDerivedLeaks(text, result, priced)).toEqual([]);
        expect(text).not.toMatch(
          /margin|minimum safe|contingency|hourly value|hourly rate|effort|safe price|floor|complexity|overhead|risk/i,
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
      }
    },
  );
});
