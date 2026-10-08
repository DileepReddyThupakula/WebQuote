import type { PricingConfigV1 } from "@/domain/quote/config/schema";
import type {
  DependencyResolution,
  FeatureKey,
  NormalizedQuoteInputV1,
  QuoteInputV1,
} from "@/domain/quote/types";

export function normalizeQuoteInput(
  input: QuoteInputV1,
  config: PricingConfigV1,
): NormalizedQuoteInputV1 {
  const features = { ...input.features };
  const appliedDependencies: DependencyResolution[] = [];

  const enable = (
    enabledFeature: FeatureKey,
    code: DependencyResolution["code"],
    source: string,
  ) => {
    if (!features[enabledFeature]) {
      features[enabledFeature] = true;
      appliedDependencies.push({ code, enabledFeature, source });
    }
  };

  if (input.project.projectType === "blog") {
    enable("blogCms", "blog-project-enables-cms", "project.projectType");
  }
  if (input.project.projectType === "ecommerce") {
    enable(
      "ecommerce",
      "ecommerce-project-enables-ecommerce",
      "project.projectType",
    );
  }
  if (features.userAccounts) {
    enable(
      "authentication",
      "accounts-require-authentication",
      "features.userAccounts",
    );
  }
  if (features.membership) {
    enable(
      "authentication",
      "membership-requires-authentication",
      "features.membership",
    );
  }
  if (features.subscriptions) {
    enable(
      "authentication",
      "subscriptions-require-authentication",
      "features.subscriptions",
    );
    enable(
      "payments",
      "subscriptions-require-payments",
      "features.subscriptions",
    );
  }

  return {
    ...input,
    project: { ...input.project },
    design: { ...input.design },
    content: { ...input.content },
    features,
    integrations: { ...input.integrations },
    delivery: {
      ...input.delivery,
      weeklyCapacityHours:
        input.delivery.weeklyCapacityHours ??
        config.timeline.defaultWeeklyCapacityHours,
    },
    pricing: { ...input.pricing },
    normalization: { appliedDependencies },
  };
}
