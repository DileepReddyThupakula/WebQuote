import { z } from "zod";

const safeInteger = z.number().int().nonnegative().safe();
const positiveSafeInteger = safeInteger.positive();
const basisPoints = safeInteger.max(10_000);

const effortRangeSchema = z
  .strictObject({
    lowQh: safeInteger,
    highQh: safeInteger,
  })
  .refine(({ lowQh, highQh }) => lowQh <= highQh, {
    message: "Effort range lowQh must not exceed highQh.",
  });

const effortPointsSchema = z
  .strictObject({
    low: basisPoints,
    expected: basisPoints,
    high: basisPoints,
  })
  .refine(({ low, expected, high }) => low <= expected && expected <= high, {
    message: "Rate points must be ordered low <= expected <= high.",
  });

const minimumEffortPointsSchema = z
  .strictObject({
    lowQh: safeInteger,
    expectedQh: safeInteger,
    highQh: safeInteger,
  })
  .refine(
    ({ lowQh, expectedQh, highQh }) =>
      lowQh <= expectedQh && expectedQh <= highQh,
    { message: "Minimum effort points must be ordered." },
  );

const projectTypes = [
  "landing",
  "business",
  "portfolio",
  "blog",
  "ecommerce",
  "webApp",
  "custom",
] as const;
const designModes = ["provided", "template", "custom", "fullUx"] as const;
const contentModes = ["provided", "formatting", "copywriting"] as const;
const featureKeys = [
  "contactForm",
  "blogCms",
  "search",
  "authentication",
  "userAccounts",
  "adminDashboard",
  "booking",
  "payments",
  "ecommerce",
  "membership",
  "subscriptions",
] as const;
const integrationKeys = [
  "crm",
  "emailMarketing",
  "analytics",
  "maps",
  "otherStandard",
  "thirdPartyApi",
  "customApi",
] as const;
const migrationLevels = ["none", "light", "standard", "complex"] as const;
const deploymentOwners = ["client", "freelancer"] as const;
const testingLevels = ["essential", "enhanced"] as const;
const complexityLevels = [
  "straightforward",
  "moderate",
  "complex",
  "advanced",
] as const;
const contingencyPreferences = ["lean", "balanced", "cautious"] as const;
const riskLevels = ["low", "medium", "high"] as const;
const urgencyLevels = ["standard", "priority", "rush"] as const;
const maintenanceTiers = ["none", "essential", "standard", "priority"] as const;
const currencies = ["INR", "USD", "GBP", "EUR"] as const;

const supportDaysSchema = z
  .tuple([safeInteger, safeInteger, safeInteger, safeInteger])
  .refine((days) => new Set(days).size === days.length, {
    message: "Support durations must be unique.",
  });

const milestoneSchema = z.strictObject({
  code: z.string().min(1),
  label: z.string().min(1),
  percentBp: basisPoints.positive(),
});

const milestoneScheduleSchema = z
  .array(milestoneSchema)
  .min(2)
  .superRefine((schedule, context) => {
    if (
      schedule.reduce((total, item) => total + item.percentBp, 0) !== 10_000
    ) {
      context.addIssue({
        code: "custom",
        message: "Milestone percentages must total 10,000 bp.",
      });
    }
    if (new Set(schedule.map(({ code }) => code)).size !== schedule.length) {
      context.addIssue({
        code: "custom",
        message: "Milestone codes must be unique within a schedule.",
      });
    }
  });

export const pricingConfigV1Schema = z
  .strictObject({
    identity: z.strictObject({
      configId: z.string().regex(/^[a-z0-9-]+$/),
      configVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
      modelVersion: z.enum(["webquote-pricing-v1", "webquote-pricing-v2"]),
      effectiveAt: z.iso.datetime(),
      inputVersion: z.literal("quote-input-v1"),
      resultVersion: z.literal("quote-result-v1"),
    }),
    units: z.strictObject({
      quarterHoursPerHour: positiveSafeInteger,
      basisPointsScale: z.literal(10_000),
    }),
    validation: z.strictObject({
      pageCount: z.strictObject({
        min: positiveSafeInteger,
        max: positiveSafeInteger,
      }),
      integrationCount: z.strictObject({ min: safeInteger, max: safeInteger }),
      targetMarginBp: z.strictObject({ min: safeInteger, max: basisPoints }),
      weeklyCapacityHours: z.strictObject({
        min: positiveSafeInteger,
        max: positiveSafeInteger,
      }),
      revisionRounds: z.strictObject({ min: safeInteger, max: safeInteger }),
      hourlyValueMinor: z.strictObject({
        min: positiveSafeInteger,
        max: positiveSafeInteger,
      }),
      clientContextMaxLength: positiveSafeInteger,
      supportDays: supportDaysSchema,
    }),
    currencies: z.record(
      z.enum(currencies),
      z.strictObject({
        code: z.enum(currencies),
        minorUnitExponent: safeInteger.max(3),
        symbol: z.string().min(1),
        displayName: z.string().min(1),
        commercialRoundingIncrementMinor: positiveSafeInteger,
        hourlyRoundingIncrementMinor: positiveSafeInteger,
      }),
    ),
    expectedEffortPositionBp: basisPoints,
    effort: z.strictObject({
      projectTypes: z.record(
        z.enum(projectTypes),
        z.strictObject({
          includedPages: positiveSafeInteger,
          range: effortRangeSchema,
        }),
      ),
      pages: z.record(
        z.enum(["standard", "ecommerce", "webApp"]),
        effortRangeSchema,
      ),
      design: z.record(
        z.enum(designModes),
        z.strictObject({
          shared: effortRangeSchema,
          additionalPage: effortRangeSchema,
        }),
      ),
      contentPerPage: z.record(z.enum(contentModes), effortRangeSchema),
      assetSourcingPerPage: effortRangeSchema,
      features: z.record(z.enum(featureKeys), effortRangeSchema),
      integrations: z.record(z.enum(integrationKeys), effortRangeSchema),
      migration: z.record(z.enum(migrationLevels), effortRangeSchema),
      deployment: z.record(z.enum(deploymentOwners), effortRangeSchema),
    }),
    complexity: z.strictObject({
      standardIntegrationFreeCount: safeInteger,
      largePageThreshold: positiveSafeInteger,
      signals: z.strictObject({
        standardIntegrationAfterFree: positiveSafeInteger,
        thirdPartyApi: positiveSafeInteger,
        customApi: positiveSafeInteger,
        authentication: positiveSafeInteger,
        userAccounts: positiveSafeInteger,
        adminDashboard: positiveSafeInteger,
        booking: positiveSafeInteger,
        payments: positiveSafeInteger,
        ecommerce: positiveSafeInteger,
        membership: positiveSafeInteger,
        subscriptions: positiveSafeInteger,
        standardMigration: positiveSafeInteger,
        complexMigration: positiveSafeInteger,
        largePageCount: positiveSafeInteger,
      }),
      bands: z
        .array(
          z.strictObject({
            level: z.enum(complexityLevels),
            minScore: safeInteger,
            maxScore: safeInteger.nullable(),
            effortMultiplierBp: positiveSafeInteger,
          }),
        )
        .length(4),
    }),
    overhead: z.strictObject({
      testing: z.record(
        z.enum(testingLevels),
        z.strictObject({
          ratesBp: effortPointsSchema,
          minimum: minimumEffortPointsSchema,
        }),
      ),
      projectManagement: z.strictObject({
        ratesByComplexityBp: z.record(
          z.enum(complexityLevels),
          effortPointsSchema,
        ),
        minimum: minimumEffortPointsSchema,
      }),
    }),
    risk: z.strictObject({
      contingencyBaseBp: z.record(z.enum(contingencyPreferences), basisPoints),
      adjustmentBp: z.record(z.enum(riskLevels), z.number().int().safe()),
      minimumBp: basisPoints,
      maximumBp: basisPoints,
    }),
    urgency: z.record(z.enum(urgencyLevels), basisPoints),
    timeline: z.strictObject({
      defaultWeeklyCapacityHours: positiveSafeInteger,
      minimumWeeks: positiveSafeInteger,
    }),
    revisions: z.strictObject({
      lowRateBp: basisPoints,
      highRateBp: basisPoints,
      minimumLowQh: positiveSafeInteger,
      minimumHighQh: positiveSafeInteger,
    }),
    changeOrders: z.strictObject({
      urgentChangeDefaultUrgency: z.enum(["priority", "rush"]),
      genericHourlyEffortQh: positiveSafeInteger,
    }),
    maintenance: z.strictObject({
      tiers: z.record(z.enum(maintenanceTiers), effortRangeSchema),
      apiPerIntegration: effortRangeSchema,
      ecommerce: effortRangeSchema,
      membershipOrSubscriptions: effortRangeSchema,
      businessCritical: effortRangeSchema,
      complexMigration: effortRangeSchema,
      complexityMultiplierBp: z.record(
        z.enum(complexityLevels),
        positiveSafeInteger,
      ),
    }),
    milestones: z.strictObject({
      shortMaxWeeks: positiveSafeInteger,
      mediumMaxWeeks: positiveSafeInteger,
      schedules: z.strictObject({
        short: milestoneScheduleSchema,
        medium: milestoneScheduleSchema,
        long: milestoneScheduleSchema,
      }),
      elevatedDepositBp: basisPoints.positive(),
      elevatedByRisk: z.enum(riskLevels),
      elevatedByUrgency: z.array(z.enum(["priority", "rush"])).min(1),
    }),
    /**
     * Effort for terms the freelancer commits to in the quote. Absent in
     * pricing model v1, which priced neither; present from v2 onward.
     */
    includedWork: z
      .strictObject({
        revisionRounds: z.strictObject({
          /** Rounds the foundation ranges already cover. Fewer rounds are not discounted. */
          baselineRounds: safeInteger,
        }),
        postLaunchSupport: z.strictObject({
          calibration: z.enum(["uncalibrated-placeholder", "calibrated"]),
          byDays: z.record(z.enum(["0", "14", "30", "60"]), effortRangeSchema),
        }),
      })
      .optional(),
    warnings: z.strictObject({
      integrationDiscoveryThreshold: positiveSafeInteger,
      severalCustomApisThreshold: positiveSafeInteger,
      largeScopePageThreshold: positiveSafeInteger,
      rushCapacityThresholdHours: positiveSafeInteger,
      complexCommerceFeatureThreshold: positiveSafeInteger,
    }),
  })
  .superRefine((config, context) => {
    const orderedBounds = [
      ["pageCount", config.validation.pageCount],
      ["integrationCount", config.validation.integrationCount],
      ["weeklyCapacityHours", config.validation.weeklyCapacityHours],
      ["revisionRounds", config.validation.revisionRounds],
      ["hourlyValueMinor", config.validation.hourlyValueMinor],
      ["targetMarginBp", config.validation.targetMarginBp],
    ] as const;
    for (const [name, bounds] of orderedBounds) {
      if (bounds.min > bounds.max) {
        context.addIssue({
          code: "custom",
          message: `${name} bounds are inverted.`,
          path: ["validation", name],
        });
      }
    }
    if (config.validation.targetMarginBp.max >= config.units.basisPointsScale) {
      context.addIssue({
        code: "custom",
        message: "Margin cap must be below 100%.",
        path: ["validation", "targetMarginBp", "max"],
      });
    }
    if (config.risk.minimumBp > config.risk.maximumBp) {
      context.addIssue({
        code: "custom",
        message: "Risk contingency bounds are inverted.",
        path: ["risk"],
      });
    }
    const expectedLevels = complexityLevels.join(",");
    const actualLevels = config.complexity.bands
      .map(({ level }) => level)
      .join(",");
    if (actualLevels !== expectedLevels) {
      context.addIssue({
        code: "custom",
        message:
          "Complexity bands must be ordered from straightforward to advanced.",
        path: ["complexity", "bands"],
      });
    }
    const [firstBand] = config.complexity.bands;
    if (firstBand?.minScore !== 0) {
      context.addIssue({
        code: "custom",
        message: "Complexity bands must start at score zero.",
        path: ["complexity", "bands", 0, "minScore"],
      });
    }
    for (const [index, band] of config.complexity.bands.entries()) {
      if (band.maxScore !== null && band.minScore > band.maxScore) {
        context.addIssue({
          code: "custom",
          message: "Complexity band minimum must not exceed maximum.",
          path: ["complexity", "bands", index],
        });
      }
      const next = config.complexity.bands[index + 1];
      if (
        next &&
        band.maxScore !== null &&
        next.minScore !== band.maxScore + 1
      ) {
        context.addIssue({
          code: "custom",
          message: "Complexity bands must cover consecutive score boundaries.",
          path: ["complexity", "bands", index + 1, "minScore"],
        });
      }
    }
    if (config.includedWork) {
      const configured = Object.keys(
        config.includedWork.postLaunchSupport.byDays,
      ).sort();
      const supported = config.validation.supportDays.map(String).sort();
      if (configured.join(",") !== supported.join(",")) {
        context.addIssue({
          code: "custom",
          message:
            "Post-launch support effort must be defined for every supported duration.",
          path: ["includedWork", "postLaunchSupport", "byDays"],
        });
      }
      if (config.includedWork.postLaunchSupport.byDays["0"]?.highQh) {
        context.addIssue({
          code: "custom",
          message: "Zero days of support must add no effort.",
          path: ["includedWork", "postLaunchSupport", "byDays", "0"],
        });
      }
    }
    for (const currency of currencies) {
      if (config.currencies[currency].code !== currency) {
        context.addIssue({
          code: "custom",
          message: "Currency metadata key and code must match.",
          path: ["currencies", currency, "code"],
        });
      }
    }
  });

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

export type PricingConfigV1 = DeepReadonly<
  z.infer<typeof pricingConfigV1Schema>
>;
export type PricingConfigV1Input = z.input<typeof pricingConfigV1Schema>;

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }
  }
  return value as DeepReadonly<T>;
}

export function parsePricingConfigV1(input: unknown): PricingConfigV1 {
  return deepFreeze(pricingConfigV1Schema.parse(input));
}
