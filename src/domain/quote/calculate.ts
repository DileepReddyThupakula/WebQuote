import { calculateChangeOrders } from "@/domain/quote/change-orders";
import { calculateComplexity } from "@/domain/quote/complexity";
import type { PricingConfigV1 } from "@/domain/quote/config/schema";
import {
  addEffort,
  applyEffortMultiplier,
  buildDirectEffortLines,
  calculateProjectManagementOverhead,
  calculateTestingOverhead,
  subtractEffort,
  sumEffortLines,
} from "@/domain/quote/effort";
import { calculateIncludedWork } from "@/domain/quote/included-work";
import { assertQuoteResultInvariants } from "@/domain/quote/invariants";
import { calculateMaintenance } from "@/domain/quote/maintenance";
import { calculateMilestones } from "@/domain/quote/milestones";
import { normalizeQuoteInput } from "@/domain/quote/normalization";
import { calculatePricing } from "@/domain/quote/pricing";
import { calculateRevisions } from "@/domain/quote/revisions";
import { calculateRiskAndDelivery } from "@/domain/quote/risk";
import { parseQuoteInputV1 } from "@/domain/quote/schema";
import { generateExclusions, generateScope } from "@/domain/quote/scope";
import { calculateTimeline } from "@/domain/quote/timeline";
import type {
  EffortLedgerItem,
  QuoteCalculationOutcome,
  QuoteResultV1,
} from "@/domain/quote/types";
import { generateWarnings } from "@/domain/quote/warnings";

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

export function calculateQuote(
  input: unknown,
  config: PricingConfigV1,
): QuoteCalculationOutcome {
  const parsed = parseQuoteInputV1(input, config);
  if (!parsed.ok) return parsed;

  try {
    const normalized = normalizeQuoteInput(parsed.value, config);
    const complexity = calculateComplexity(normalized, config);
    const lineItems = buildDirectEffortLines(normalized, config);
    const direct = sumEffortLines(lineItems);
    const complexityAdjusted = applyEffortMultiplier(
      direct,
      complexity.multiplierBp,
      config.units.basisPointsScale,
    );
    const complexityAdditional = subtractEffort(complexityAdjusted, direct);
    const testingOverhead = calculateTestingOverhead(
      complexityAdjusted,
      normalized.delivery.testingLevel,
      config,
    );
    const beforeManagement = addEffort(complexityAdjusted, testingOverhead);
    const projectManagementOverhead = calculateProjectManagementOverhead(
      beforeManagement,
      complexity.level,
      config,
    );
    const plannedBuild = addEffort(beforeManagement, projectManagementOverhead);
    const revisions = calculateRevisions(lineItems, normalized, config);
    const includedWork = calculateIncludedWork(revisions, normalized, config);
    const planned = includedWork
      ? addEffort(
          addEffort(plannedBuild, includedWork.revisionRounds),
          includedWork.postLaunchSupport,
        )
      : plannedBuild;
    const { risk, delivery } = calculateRiskAndDelivery(
      planned,
      normalized,
      config,
    );
    const { pricing, ledger: priceLedger } = calculatePricing(
      normalized,
      delivery,
      config,
    );
    // Post-launch support happens after delivery, so it does not lengthen the
    // build timeline. Included revision rounds are delivered inside the project.
    const timelineEffort = includedWork
      ? calculateRiskAndDelivery(
          addEffort(plannedBuild, includedWork.revisionRounds),
          normalized,
          config,
        ).delivery
      : delivery;
    const timeline = calculateTimeline(timelineEffort, normalized, config);
    const changeOrders = calculateChangeOrders(
      normalized,
      complexity,
      revisions,
      config,
    );
    const maintenance = calculateMaintenance(normalized, complexity, config);
    const payment = calculateMilestones(
      pricing.recommendedMinor,
      timeline.highWeeks,
      complexity,
      normalized,
      config,
    );

    const effortLedger: EffortLedgerItem[] = [
      {
        code: "directExpectedEffort",
        amountQh: direct.expectedQh,
        configPath: "effort",
      },
      {
        code: "complexityAdditionalEffort",
        amountQh: complexityAdditional.expectedQh,
        configPath: `complexity.bands.${complexity.level}.effortMultiplierBp`,
      },
      {
        code: "testingOverhead",
        amountQh: testingOverhead.expectedQh,
        configPath: `overhead.testing.${normalized.delivery.testingLevel}`,
      },
      {
        code: "projectManagementOverhead",
        amountQh: projectManagementOverhead.expectedQh,
        configPath: `overhead.projectManagement.ratesByComplexityBp.${complexity.level}`,
      },
      ...(includedWork
        ? ([
            {
              code: "includedRevisionEffort",
              amountQh: includedWork.revisionRounds.expectedQh,
              configPath: "includedWork.revisionRounds.baselineRounds",
            },
            {
              code: "postLaunchSupportEffort",
              amountQh: includedWork.postLaunchSupport.expectedQh,
              configPath: `includedWork.postLaunchSupport.byDays.${normalized.delivery.postLaunchSupportDays}`,
            },
          ] as const)
        : []),
      {
        code: "riskContingency",
        amountQh: risk.contingencyQh,
        configPath: `risk.contingencyBaseBp.${normalized.pricing.contingency}`,
      },
    ];

    const result: QuoteResultV1 = {
      resultVersion: config.identity.resultVersion,
      modelVersion: config.identity.modelVersion,
      pricingConfig: {
        id: config.identity.configId,
        version: config.identity.configVersion,
        effectiveAt: config.identity.effectiveAt,
      },
      input: normalized,
      effort: {
        lineItems,
        direct,
        complexityAdditional,
        testingOverhead,
        projectManagementOverhead,
        ...(includedWork ? { includedWork } : {}),
        planned,
        contingencyQh: risk.contingencyQh,
        delivery,
        safeEffortQh: delivery.highQh,
      },
      complexity,
      risk,
      pricing,
      timeline,
      revisions,
      changeOrders,
      maintenance,
      payment,
      scope: generateScope(normalized),
      exclusions: generateExclusions(normalized),
      warnings: generateWarnings(normalized, complexity, config),
      ledger: { effort: effortLedger, pricing: priceLedger },
    };
    assertQuoteResultInvariants(result);
    return deepFreeze({ ok: true, result });
  } catch (error) {
    if (error instanceof RangeError) {
      return {
        ok: false,
        issues: [
          {
            path: "",
            code: "calculation_invariant",
            message: error.message,
          },
        ],
      };
    }
    /* v8 ignore next -- validated pure stages only throw RangeError; this preserves unexpected programmer defects. */
    throw error;
  }
}
