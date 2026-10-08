import { priceEffortRange } from "@/domain/quote/commercial-pricing";
import type { PricingConfigV1 } from "@/domain/quote/config/schema";
import {
  addEffort,
  applyEffortMultiplier,
  effortPointsFromRange,
} from "@/domain/quote/effort";
import type {
  NormalizedQuoteInputV1,
  QuoteResultV1,
} from "@/domain/quote/types";

export function calculateMaintenance(
  input: NormalizedQuoteInputV1,
  complexity: QuoteResultV1["complexity"],
  config: PricingConfigV1,
): QuoteResultV1["maintenance"] {
  const tier = input.delivery.maintenanceTier;
  if (tier === "none") {
    return { tier, included: false };
  }

  const toPoints = (range: Readonly<{ lowQh: number; highQh: number }>) =>
    effortPointsFromRange(range.lowQh, range.highQh, config);
  let effort = toPoints(config.maintenance.tiers[tier]);
  const apiCount =
    input.integrations.thirdPartyApi + input.integrations.customApi;
  if (apiCount > 0) {
    effort = addEffort(
      effort,
      toPoints({
        lowQh: config.maintenance.apiPerIntegration.lowQh * apiCount,
        highQh: config.maintenance.apiPerIntegration.highQh * apiCount,
      }),
    );
  }
  const hasBusinessCriticalBehavior =
    input.features.authentication ||
    input.features.adminDashboard ||
    input.features.booking ||
    input.features.payments;
  if (hasBusinessCriticalBehavior) {
    effort = addEffort(effort, toPoints(config.maintenance.businessCritical));
  }
  if (input.features.ecommerce) {
    effort = addEffort(effort, toPoints(config.maintenance.ecommerce));
  }
  if (input.features.membership || input.features.subscriptions) {
    effort = addEffort(
      effort,
      toPoints(config.maintenance.membershipOrSubscriptions),
    );
  }
  if (input.content.migration === "complex") {
    effort = addEffort(effort, toPoints(config.maintenance.complexMigration));
  }

  const monthlyEffort = applyEffortMultiplier(
    effort,
    config.maintenance.complexityMultiplierBp[complexity.level],
    config.units.basisPointsScale,
  );
  return {
    tier,
    included: true,
    monthlyEffort,
    monthlyPrice: priceEffortRange(monthlyEffort, input, config),
  };
}
