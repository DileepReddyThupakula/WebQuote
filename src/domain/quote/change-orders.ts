import { basisPoints, moneyMinor } from "@/domain/quote/arithmetic";
import { priceEffortRange } from "@/domain/quote/commercial-pricing";
import type { PricingConfigV1 } from "@/domain/quote/config/schema";
import {
  addEffort,
  applyEffortMultiplier,
  calculateProjectManagementOverhead,
  calculateTestingOverhead,
  effortPointsFromRange,
} from "@/domain/quote/effort";
import type {
  ComplexityLevel,
  EffortPoints,
  NormalizedQuoteInputV1,
  QuoteResultV1,
} from "@/domain/quote/types";

function pageContext(
  input: NormalizedQuoteInputV1,
): "standard" | "ecommerce" | "webApp" {
  if (input.project.projectType === "ecommerce") return "ecommerce";
  if (input.project.projectType === "webApp") return "webApp";
  return "standard";
}

function withDeliveryOverhead(
  direct: EffortPoints,
  input: NormalizedQuoteInputV1,
  complexityLevel: ComplexityLevel,
  complexityMultiplierBp: number,
  config: PricingConfigV1,
): EffortPoints {
  const complexityAdjusted = applyEffortMultiplier(
    direct,
    complexityMultiplierBp,
    config.units.basisPointsScale,
  );
  const testing = calculateTestingOverhead(
    complexityAdjusted,
    input.delivery.testingLevel,
    config,
  );
  const beforeManagement = addEffort(complexityAdjusted, testing);
  return addEffort(
    beforeManagement,
    calculateProjectManagementOverhead(
      beforeManagement,
      complexityLevel,
      config,
    ),
  );
}

export function calculateChangeOrders(
  input: NormalizedQuoteInputV1,
  complexity: QuoteResultV1["complexity"],
  revisions: QuoteResultV1["revisions"],
  config: PricingConfigV1,
): QuoteResultV1["changeOrders"] {
  const toPoints = (range: Readonly<{ lowQh: number; highQh: number }>) =>
    effortPointsFromRange(range.lowQh, range.highQh, config);
  const contextualPrice = (effort: EffortPoints) => {
    const totalEffort = withDeliveryOverhead(
      effort,
      input,
      complexity.level,
      complexity.multiplierBp,
      config,
    );
    return {
      effort: totalEffort,
      price: priceEffortRange(totalEffort, input, config),
    };
  };

  let additionalPage = toPoints(config.effort.pages[pageContext(input)]);
  additionalPage = addEffort(
    additionalPage,
    toPoints(config.effort.design[input.design.mode].additionalPage),
  );
  additionalPage = addEffort(
    additionalPage,
    toPoints(config.effort.contentPerPage[input.content.mode]),
  );
  if (input.content.assetSourcing) {
    additionalPage = addEffort(
      additionalPage,
      toPoints(config.effort.assetSourcingPerPage),
    );
  }

  const additionalPageQuote = contextualPrice(additionalPage);
  const standardIntegration = contextualPrice(
    toPoints(config.effort.integrations.otherStandard),
  );
  const thirdPartyApi = contextualPrice(
    toPoints(config.effort.integrations.thirdPartyApi),
  );
  const customApi = contextualPrice(
    toPoints(config.effort.integrations.customApi),
  );
  const hourlyEffort = effortPointsFromRange(
    config.changeOrders.genericHourlyEffortQh,
    config.changeOrders.genericHourlyEffortQh,
    config,
  );
  const hourlyIncrement = moneyMinor(
    config.currencies[input.project.currency].hourlyRoundingIncrementMinor,
  );
  const hourlyPrice = priceEffortRange(
    hourlyEffort,
    input,
    config,
    undefined,
    hourlyIncrement,
  );
  const urgentLevel =
    input.delivery.urgency === "standard"
      ? config.changeOrders.urgentChangeDefaultUrgency
      : input.delivery.urgency;
  const urgentPrice = priceEffortRange(
    hourlyEffort,
    input,
    config,
    basisPoints(config.urgency[urgentLevel]),
    hourlyIncrement,
  );

  return [
    {
      code: "additionalPage",
      ...additionalPageQuote,
      assumptions: ["Written scope required", "Third-party fees excluded"],
    },
    {
      code: "additionalRevisionRound",
      effort: revisions.extraRoundEffort,
      price: revisions.extraRoundPrice,
      assumptions: [
        "One consolidated feedback round",
        "New functionality excluded",
      ],
    },
    {
      code: "standardIntegration",
      ...standardIntegration,
      assumptions: ["Established provider", "Vendor access supplied"],
    },
    {
      code: "thirdPartyApi",
      ...thirdPartyApi,
      assumptions: ["Documented third-party API", "Vendor fees excluded"],
    },
    {
      code: "customApi",
      ...customApi,
      assumptions: [
        "Discovery may be required",
        "Infrastructure fees excluded",
      ],
    },
    {
      code: "urgentChange",
      effort: hourlyEffort,
      price: urgentPrice,
      assumptions: [
        "Per-hour planning unit",
        `${urgentLevel} availability surcharge`,
      ],
    },
    {
      code: "hourlyOutOfScope",
      effort: hourlyEffort,
      price: hourlyPrice,
      assumptions: ["Per-hour planning unit", "Written scope required"],
    },
  ];
}
