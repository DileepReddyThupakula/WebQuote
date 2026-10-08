import { quoteFixtures } from "../../../fixtures/quotes/v1";
import { expectedQuoteLedgers } from "../../../fixtures/quotes/v1-ledgers";
import { calculateResult } from "./helpers";

describe("approved fixture ledgers", () => {
  it.each(Object.entries(quoteFixtures))(
    "reconciles the resolved ledger for %s",
    (name, input) => {
      const result = calculateResult(input);
      const expected =
        expectedQuoteLedgers[name as keyof typeof expectedQuoteLedgers];

      expect([
        result.effort.direct.lowQh,
        result.effort.direct.expectedQh,
        result.effort.direct.highQh,
      ]).toEqual(expected.effort.direct);
      expect([
        result.effort.complexityAdditional.lowQh,
        result.effort.complexityAdditional.expectedQh,
        result.effort.complexityAdditional.highQh,
      ]).toEqual(expected.effort.complexityAdditional);
      expect([
        result.effort.testingOverhead.lowQh,
        result.effort.testingOverhead.expectedQh,
        result.effort.testingOverhead.highQh,
      ]).toEqual(expected.effort.testing);
      expect([
        result.effort.projectManagementOverhead.lowQh,
        result.effort.projectManagementOverhead.expectedQh,
        result.effort.projectManagementOverhead.highQh,
      ]).toEqual(expected.effort.projectManagement);
      expect([
        result.effort.planned.lowQh,
        result.effort.planned.expectedQh,
        result.effort.planned.highQh,
      ]).toEqual(expected.effort.planned);
      expect(result.effort.contingencyQh).toBe(expected.effort.contingencyQh);
      expect([
        result.effort.delivery.lowQh,
        result.effort.delivery.expectedQh,
        result.effort.delivery.highQh,
      ]).toEqual(expected.effort.delivery);
      expect(result.effort.lineItems.map(({ code }) => code)).toEqual(
        expected.effort.lineCodes,
      );
      expect(
        result.ledger.pricing.map(({ outputMinor }) => outputMinor),
      ).toEqual(expected.priceLedgerOutputs);
      expect(result.pricing).toMatchObject(expected.pricing);
      expect([
        result.timeline.lowWeeks,
        result.timeline.expectedWeeks,
        result.timeline.highWeeks,
      ]).toEqual(expected.timeline);
      expect(
        result.payment.milestones.map(({ percentBp, amountMinor }) => [
          percentBp,
          amountMinor,
        ]),
      ).toEqual(expected.milestoneAmounts);
      expect(result.warnings.map(({ code }) => code)).toEqual(
        expected.warnings,
      );
    },
  );
});
