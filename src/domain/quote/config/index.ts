export { createPricingConfigRegistry } from "@/domain/quote/config/registry";
export {
  parsePricingConfigV1,
  pricingConfigV1Schema,
  type PricingConfigV1,
} from "@/domain/quote/config/schema";
export { PRICING_CONFIG_V1 } from "@/domain/quote/config/v1";
export { PRICING_CONFIG_V2 } from "@/domain/quote/config/v2";

import { createPricingConfigRegistry } from "@/domain/quote/config/registry";
import { PRICING_CONFIG_V1 } from "@/domain/quote/config/v1";
import { PRICING_CONFIG_V2 } from "@/domain/quote/config/v2";

/**
 * Every shipped calibration. Quotes store the identity of the config that
 * produced them, so historical results stay readable under their own version.
 */
export const PRICING_CONFIG_REGISTRY = createPricingConfigRegistry(
  [PRICING_CONFIG_V1, PRICING_CONFIG_V2],
  {
    configId: PRICING_CONFIG_V2.identity.configId,
    configVersion: PRICING_CONFIG_V2.identity.configVersion,
  },
);
/** The calibration new quotes are calculated with. */
export const ACTIVE_PRICING_CONFIG = PRICING_CONFIG_REGISTRY.active;
