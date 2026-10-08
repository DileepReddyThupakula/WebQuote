import {
  parsePricingConfigV1,
  type PricingConfigV1,
} from "@/domain/quote/config/schema";

function identityKey(config: PricingConfigV1): string {
  return `${config.identity.configId}@${config.identity.configVersion}`;
}

export type PricingConfigRegistry = Readonly<{
  all: readonly PricingConfigV1[];
  active: PricingConfigV1;
  get(configId: string, configVersion: string): PricingConfigV1 | undefined;
}>;

export function createPricingConfigRegistry(
  configs: readonly unknown[],
  activeIdentity?: Readonly<{ configId: string; configVersion: string }>,
): PricingConfigRegistry {
  if (configs.length === 0) {
    throw new RangeError("At least one pricing configuration is required.");
  }

  const parsed = configs.map(parsePricingConfigV1);
  const byIdentity = new Map<string, PricingConfigV1>();
  for (const config of parsed) {
    const key = identityKey(config);
    if (byIdentity.has(key)) {
      throw new RangeError(`Duplicate pricing configuration identity: ${key}`);
    }
    byIdentity.set(key, config);
  }

  const active = activeIdentity
    ? byIdentity.get(
        `${activeIdentity.configId}@${activeIdentity.configVersion}`,
      )
    : parsed.at(-1);
  if (!active) {
    throw new RangeError(
      "The active pricing configuration was not registered.",
    );
  }

  return Object.freeze({
    all: Object.freeze([...parsed]),
    active,
    get(configId: string, configVersion: string) {
      return byIdentity.get(`${configId}@${configVersion}`);
    },
  });
}
