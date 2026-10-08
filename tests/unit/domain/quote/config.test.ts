import {
  createPricingConfigRegistry,
  parsePricingConfigV1,
  PRICING_CONFIG_V1,
} from "@/domain/quote";
import type { PricingConfigV1Input } from "@/domain/quote/config/schema";

function mutableConfig(): PricingConfigV1Input {
  return structuredClone(PRICING_CONFIG_V1) as PricingConfigV1Input;
}

describe("PricingConfigV1", () => {
  it("validates and deeply freezes the authoritative calibration", () => {
    expect(PRICING_CONFIG_V1.identity.configVersion).toBe("1.0.0");
    expect(Object.isFrozen(PRICING_CONFIG_V1)).toBe(true);
    expect(Object.isFrozen(PRICING_CONFIG_V1.effort.features)).toBe(true);
    expect(() => {
      (
        PRICING_CONFIG_V1.effort.features.contactForm as { lowQh: number }
      ).lowQh = 0;
    }).toThrow(TypeError);
  });

  it("rejects inverted effort ranges, currency mismatches, and invalid margin caps", () => {
    const effort = mutableConfig();
    effort.effort.features.contactForm.lowQh = 99;
    effort.effort.features.contactForm.highQh = 1;
    expect(() => parsePricingConfigV1(effort)).toThrow();

    const currency = mutableConfig();
    currency.currencies.USD.code = "EUR";
    expect(() => parsePricingConfigV1(currency)).toThrow(/key and code/i);

    const margin = mutableConfig();
    margin.validation.targetMarginBp.max = 10_000;
    expect(() => parsePricingConfigV1(margin)).toThrow(/below 100%/i);
  });

  it("rejects invalid milestone totals and complexity band order", () => {
    const milestones = mutableConfig();
    milestones.milestones.schedules.short[0]!.percentBp = 4_999;
    expect(() => parsePricingConfigV1(milestones)).toThrow(/10,000 bp/);

    const bands = mutableConfig();
    bands.complexity.bands.reverse();
    expect(() => parsePricingConfigV1(bands)).toThrow(/ordered/);

    const duplicateMilestones = mutableConfig();
    duplicateMilestones.milestones.schedules.short[1]!.code =
      duplicateMilestones.milestones.schedules.short[0]!.code;
    expect(() => parsePricingConfigV1(duplicateMilestones)).toThrow(/unique/);
  });

  it("rejects inverted validation and risk bounds", () => {
    const validation = mutableConfig();
    validation.validation.integrationCount.min = 5;
    validation.validation.integrationCount.max = 4;
    expect(() => parsePricingConfigV1(validation)).toThrow(
      /integrationCount bounds/,
    );

    const risk = mutableConfig();
    risk.risk.minimumBp = 2_000;
    risk.risk.maximumBp = 1_000;
    expect(() => parsePricingConfigV1(risk)).toThrow(/Risk contingency bounds/);

    const band = mutableConfig();
    band.complexity.bands[1]!.minScore = 4;
    expect(() => parsePricingConfigV1(band)).toThrow(/consecutive/);
  });

  it("resolves immutable historical versions and rejects duplicate identities", () => {
    const nextInput = mutableConfig();
    nextInput.identity.configVersion = "1.1.0";
    nextInput.expectedEffortPositionBp = 6_000;
    const next = parsePricingConfigV1(nextInput);
    const registry = createPricingConfigRegistry([PRICING_CONFIG_V1, next], {
      configId: next.identity.configId,
      configVersion: next.identity.configVersion,
    });

    expect(registry.active).toStrictEqual(next);
    expect(registry.get("webquote-v1-calibration", "1.0.0")).toStrictEqual(
      PRICING_CONFIG_V1,
    );
    expect(registry.get("missing", "1.0.0")).toBeUndefined();
    expect(() => createPricingConfigRegistry([])).toThrow(/at least one/i);
    expect(() =>
      createPricingConfigRegistry([PRICING_CONFIG_V1, PRICING_CONFIG_V1]),
    ).toThrow(/duplicate/i);
    expect(() =>
      createPricingConfigRegistry([PRICING_CONFIG_V1], {
        configId: "missing",
        configVersion: "1.0.0",
      }),
    ).toThrow(/active/i);
  });
});
