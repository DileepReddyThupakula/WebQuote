import { PRICING_CONFIG_V1 } from "@/domain/quote";

import { auditSamples } from "../../../fixtures/quotes/audit-samples";
import { calculateResult } from "./helpers";

describe("AUDIT.md sample projects under pricing config v1", () => {
  it("defines the 15 audited samples", () => {
    expect(auditSamples.map(({ id }) => id)).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 1),
    );
  });

  it.each(auditSamples)(
    "sample $id ($label) still matches the audit figures",
    ({ input, audit }) => {
      const result = calculateResult(input, PRICING_CONFIG_V1);
      const { pricing, effort, timeline } = result;
      const major = (minor: number) => minor / 100;

      expect({
        lowHours: effort.delivery.lowQh / 4,
        expectedHours: effort.delivery.expectedQh / 4,
        highHours: effort.delivery.highQh / 4,
        complexityScore: result.complexity.score,
        minimumSafe: major(pricing.minimumSafeMinor),
        recommended: major(pricing.recommendedMinor),
        rangeLow: major(pricing.rangeLowMinor),
        rangeHigh: major(pricing.rangeHighMinor),
        lowWeeks: timeline.lowWeeks,
        highWeeks: timeline.highWeeks,
      }).toEqual(audit);
    },
  );

  it("shows the audit defects on the baseline: floor equals range low, rounds and support change nothing", () => {
    const byId = new Map(auditSamples.map((sample) => [sample.id, sample]));
    for (const sample of auditSamples) {
      const { pricing } = calculateResult(sample.input, PRICING_CONFIG_V1);
      expect(pricing.rangeLowMinor).toBe(pricing.minimumSafeMinor);
    }
    const twelve = calculateResult(byId.get(12)!.input, PRICING_CONFIG_V1);
    const thirteen = calculateResult(byId.get(13)!.input, PRICING_CONFIG_V1);
    expect(twelve.pricing.recommendedMinor).toBe(
      thirteen.pricing.recommendedMinor,
    );
  });
});
