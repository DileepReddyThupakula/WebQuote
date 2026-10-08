import { calculateQuote, PRICING_CONFIG_V1 } from "@/domain/quote";
import { createDefaultDraft } from "@/features/quote-builder/defaults";
import {
  draftToQuoteInput,
  formatMoneyInput,
  parseMarginBasisPoints,
  parseMoneyMinor,
} from "@/features/quote-builder/mapping";
import { updateDraftField } from "@/features/quote-builder/reducer";

describe("quote builder domain mapping", () => {
  it("parses money as integer minor units without floating point", () => {
    expect(parseMoneyMinor("1,500.50", "INR")).toBe(150050);
    expect(formatMoneyInput(150050, "INR")).toBe("1500.50");
    expect(parseMoneyMinor("-1", "USD")).toMatchObject({
      path: "pricing.hourlyValue",
    });
  });

  it("maps a percentage to basis points and respects the configured cap", () => {
    expect(parseMarginBasisPoints("20.5")).toBe(2050);
    expect(parseMarginBasisPoints("50.01")).toMatchObject({
      path: "pricing.targetMarginPercent",
    });
  });

  it("maps a complete draft through the authoritative schema and engine", () => {
    let draft = createDefaultDraft();
    draft = updateDraftField(draft, "pricing.hourlyValue", "1500.50");
    draft = updateDraftField(draft, "project.projectType", "landing");
    draft = updateDraftField(draft, "project.pageCount", "1");
    draft = updateDraftField(draft, "features.contactForm", true);

    const mapped = draftToQuoteInput(draft);
    expect(mapped).toEqual(expect.objectContaining({ ok: true }));
    if (!mapped.ok) return;

    expect(mapped.input.pricing.hourlyValueMinor).toBe(150050);
    expect(mapped.input.pricing.targetMarginBp).toBe(2000);
    expect(mapped.input).not.toHaveProperty("ui");
    expect(calculateQuote(mapped.input, PRICING_CONFIG_V1).ok).toBe(true);
  });

  it("returns field-addressable issues for incomplete commercial input", () => {
    const result = draftToQuoteInput(createDefaultDraft());

    expect(result).toEqual({
      ok: false,
      issues: [
        {
          path: "pricing.hourlyValue",
          message: "Enter your minimum hourly value as a positive amount.",
        },
      ],
    });
  });
});
