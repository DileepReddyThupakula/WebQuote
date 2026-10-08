import { basisPoints } from "@/domain/quote/arithmetic";
import type { PricingConfigV1 } from "@/domain/quote/config/schema";
import type {
  ComplexitySignal,
  NormalizedQuoteInputV1,
  QuoteResultV1,
} from "@/domain/quote/types";

type ComplexityResult = QuoteResultV1["complexity"];

export function calculateComplexity(
  input: NormalizedQuoteInputV1,
  config: PricingConfigV1,
): ComplexityResult {
  const signals: ComplexitySignal[] = [];
  const addSignal = (
    code: string,
    pointsEach: number,
    count: number,
    sourceKey: string,
    configPath: string,
  ) => {
    if (count > 0) {
      signals.push({
        code,
        pointsEach,
        count,
        totalPoints: pointsEach * count,
        sourceKey,
        configPath,
      });
    }
  };

  const standardIntegrationCount =
    input.integrations.crm +
    input.integrations.emailMarketing +
    input.integrations.analytics +
    input.integrations.maps +
    input.integrations.otherStandard;
  addSignal(
    "standard-integrations-after-free",
    config.complexity.signals.standardIntegrationAfterFree,
    Math.max(
      0,
      standardIntegrationCount - config.complexity.standardIntegrationFreeCount,
    ),
    "integrations",
    "complexity.signals.standardIntegrationAfterFree",
  );
  addSignal(
    "third-party-api",
    config.complexity.signals.thirdPartyApi,
    input.integrations.thirdPartyApi,
    "integrations.thirdPartyApi",
    "complexity.signals.thirdPartyApi",
  );
  addSignal(
    "custom-api",
    config.complexity.signals.customApi,
    input.integrations.customApi,
    "integrations.customApi",
    "complexity.signals.customApi",
  );

  const featureSignals = [
    ["authentication", "authentication"],
    ["userAccounts", "user-accounts"],
    ["adminDashboard", "admin-dashboard"],
    ["booking", "booking"],
    ["payments", "payments"],
    ["ecommerce", "ecommerce"],
    ["membership", "membership"],
    ["subscriptions", "subscriptions"],
  ] as const;
  for (const [key, code] of featureSignals) {
    addSignal(
      code,
      config.complexity.signals[key],
      input.features[key] ? 1 : 0,
      `features.${key}`,
      `complexity.signals.${key}`,
    );
  }

  if (input.content.migration === "standard") {
    addSignal(
      "standard-migration",
      config.complexity.signals.standardMigration,
      1,
      "content.migration",
      "complexity.signals.standardMigration",
    );
  } else if (input.content.migration === "complex") {
    addSignal(
      "complex-migration",
      config.complexity.signals.complexMigration,
      1,
      "content.migration",
      "complexity.signals.complexMigration",
    );
  }
  addSignal(
    "large-page-count",
    config.complexity.signals.largePageCount,
    input.project.pageCount > config.complexity.largePageThreshold ? 1 : 0,
    "project.pageCount",
    "complexity.signals.largePageCount",
  );

  const score = signals.reduce(
    (total, signal) => total + signal.totalPoints,
    0,
  );
  const band = config.complexity.bands.find(
    ({ minScore, maxScore }) =>
      score >= minScore && (maxScore === null || score <= maxScore),
  );
  if (!band) {
    throw new RangeError(`No complexity band covers score ${score}.`);
  }

  return {
    score,
    level: band.level,
    multiplierBp: basisPoints(band.effortMultiplierBp),
    signals,
  };
}
