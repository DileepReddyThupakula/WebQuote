import {
  calculateQuote,
  createQuoteInputV1Schema,
  parseQuoteInputV1,
  parsePricingConfigV1,
  PRICING_CONFIG_V1,
} from "@/domain/quote";
import { normalizeQuoteInput } from "@/domain/quote/normalization";
import { makeQuoteInput } from "../../../fixtures/quotes/v1";

describe("QuoteInputV1 validation and normalization", () => {
  it("accepts a complete valid input and applies the configured capacity default", () => {
    const input = makeQuoteInput();
    const parsed = parseQuoteInputV1(input, PRICING_CONFIG_V1);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(
      normalizeQuoteInput(parsed.value, PRICING_CONFIG_V1).delivery
        .weeklyCapacityHours,
    ).toBe(25);
  });

  it.each([
    [
      "unsupported currency",
      (input: Record<string, unknown>) =>
        ((input.project as Record<string, unknown>).currency = "CAD"),
    ],
    [
      "page count below minimum",
      (input: Record<string, unknown>) =>
        ((input.project as Record<string, unknown>).pageCount = 0),
    ],
    [
      "page count above maximum",
      (input: Record<string, unknown>) =>
        ((input.project as Record<string, unknown>).pageCount = 101),
    ],
    [
      "negative integration",
      (input: Record<string, unknown>) =>
        ((input.integrations as Record<string, unknown>).crm = -1),
    ],
    [
      "integration above cap",
      (input: Record<string, unknown>) =>
        ((input.integrations as Record<string, unknown>).customApi = 11),
    ],
    [
      "margin above cap",
      (input: Record<string, unknown>) =>
        ((input.pricing as Record<string, unknown>).targetMarginBp = 5_001),
    ],
    [
      "zero hourly value",
      (input: Record<string, unknown>) =>
        ((input.pricing as Record<string, unknown>).hourlyValueMinor = 0),
    ],
    [
      "invalid weekly capacity",
      (input: Record<string, unknown>) =>
        ((input.delivery as Record<string, unknown>).weeklyCapacityHours = 4),
    ],
    [
      "too many revisions",
      (input: Record<string, unknown>) =>
        ((input.delivery as Record<string, unknown>).includedRevisionRounds =
          6),
    ],
  ])("rejects %s", (_label, mutate) => {
    const input = structuredClone(makeQuoteInput()) as unknown as Record<
      string,
      unknown
    >;
    mutate(input);
    const result = parseQuoteInputV1(input, PRICING_CONFIG_V1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.path).not.toBeUndefined();
  });

  it("rejects unknown fields and overlong client context", () => {
    const input = structuredClone(makeQuoteInput()) as unknown as Record<
      string,
      unknown
    >;
    input.unexpected = true;
    expect(
      createQuoteInputV1Schema(PRICING_CONFIG_V1).safeParse(input).success,
    ).toBe(false);

    const context = structuredClone(makeQuoteInput()) as unknown as Record<
      string,
      unknown
    >;
    (context.project as Record<string, unknown>).clientContext = "x".repeat(81);
    expect(parseQuoteInputV1(context, PRICING_CONFIG_V1).ok).toBe(false);
  });

  it("takes supported post-launch durations from the validated config", () => {
    const input = structuredClone(makeQuoteInput()) as unknown as Record<
      string,
      unknown
    >;
    (input.delivery as Record<string, unknown>).postLaunchSupportDays = 7;
    expect(parseQuoteInputV1(input, PRICING_CONFIG_V1).ok).toBe(false);

    const configInput = structuredClone(PRICING_CONFIG_V1) as unknown as {
      validation: { supportDays: [number, number, number, number] };
    };
    configInput.validation.supportDays = [0, 7, 30, 60];
    const config = parsePricingConfigV1(configInput);
    (input.delivery as Record<string, unknown>).postLaunchSupportDays = 7;
    expect(parseQuoteInputV1(input, config).ok).toBe(true);
  });

  it("normalizes project and feature dependencies once and exposes them", () => {
    const input = makeQuoteInput({
      project: { projectType: "ecommerce", pageCount: 7, currency: "USD" },
      features: {
        ...makeQuoteInput().features,
        contactForm: false,
        userAccounts: true,
        membership: true,
        subscriptions: true,
      },
    });
    const outcome = calculateQuote(input, PRICING_CONFIG_V1);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(outcome.result.input.features).toMatchObject({
      ecommerce: true,
      authentication: true,
      payments: true,
    });
    expect(
      outcome.result.input.normalization.appliedDependencies.map(
        ({ code }) => code,
      ),
    ).toEqual([
      "ecommerce-project-enables-ecommerce",
      "accounts-require-authentication",
      "subscriptions-require-payments",
    ]);
  });

  it("normalizes blog projects to CMS and preserves an explicit capacity override", () => {
    const input = makeQuoteInput({
      project: { projectType: "blog", pageCount: 5, currency: "EUR" },
      delivery: { ...makeQuoteInput().delivery, weeklyCapacityHours: 40 },
    });
    const parsed = parseQuoteInputV1(input, PRICING_CONFIG_V1);
    if (!parsed.ok) throw new Error("fixture should parse");
    const normalized = normalizeQuoteInput(parsed.value, PRICING_CONFIG_V1);
    expect(normalized.features.blogCms).toBe(true);
    expect(normalized.delivery.weeklyCapacityHours).toBe(40);
  });
});
