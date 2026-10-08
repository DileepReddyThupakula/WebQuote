import type { QuoteFixtureName } from "./v1";

type Points = readonly [lowQh: number, expectedQh: number, highQh: number];

export type ExpectedQuoteLedger = Readonly<{
  effort: Readonly<{
    direct: Points;
    complexityAdditional: Points;
    testing: Points;
    projectManagement: Points;
    planned: Points;
    contingencyQh: number;
    delivery: Points;
    lineCodes: readonly string[];
  }>;
  priceLedgerOutputs: readonly number[];
  pricing: Readonly<{
    minimumSafeRawMinor: number;
    minimumSafeMinor: number;
    recommendedBeforeUrgencyRawMinor: number;
    recommendedRawMinor: number;
    recommendedMinor: number;
    rangeLowMinor: number;
    rangeHighMinor: number;
  }>;
  timeline: readonly [
    lowWeeks: number,
    expectedWeeks: number,
    highWeeks: number,
  ];
  milestoneAmounts: readonly [percentBp: number, amountMinor: number][];
  warnings: readonly string[];
}>;

/**
 * Representative resolved ledgers. These are intentionally plain snapshots:
 * they prove the shipped configuration and formulas, while the engine remains
 * the only code that calculates the values.
 */
export const expectedQuoteLedgers = {
  simpleLandingPage: {
    effort: {
      direct: [68, 94, 120],
      complexityAdditional: [0, 0, 0],
      testing: [8, 10, 14],
      projectManagement: [6, 9, 13],
      planned: [82, 113, 147],
      contingencyQh: 3,
      delivery: [82, 116, 147],
      lineCodes: [
        "project-landing",
        "design-provided",
        "feature-contactForm",
        "deployment-freelancer",
      ],
    },
    priceLedgerOutputs: [4_350_000, 5_117_647, 5_512_500, 5_512_500, 5_550_000],
    pricing: {
      minimumSafeRawMinor: 5_512_500,
      minimumSafeMinor: 5_550_000,
      recommendedBeforeUrgencyRawMinor: 5_512_500,
      recommendedRawMinor: 5_512_500,
      recommendedMinor: 5_550_000,
      rangeLowMinor: 5_550_000,
      rangeHighMinor: 6_500_000,
    },
    timeline: [1, 2, 2],
    milestoneAmounts: [
      [5_000, 2_775_000],
      [3_000, 1_665_000],
      [2_000, 1_110_000],
    ],
    warnings: [],
  },
  smallBusinessSite: {
    effort: {
      direct: [116, 154, 192],
      complexityAdditional: [0, 0, 0],
      testing: [9, 15, 23],
      projectManagement: [10, 15, 22],
      planned: [135, 184, 237],
      contingencyQh: 18,
      delivery: [135, 202, 237],
      lineCodes: [
        "project-business",
        "design-template",
        "feature-contactForm",
        "integration-analytics",
        "deployment-freelancer",
      ],
    },
    priceLedgerOutputs: [505_000, 631_250, 631_250, 631_250, 632_000],
    pricing: {
      minimumSafeRawMinor: 592_500,
      minimumSafeMinor: 593_000,
      recommendedBeforeUrgencyRawMinor: 631_250,
      recommendedRawMinor: 631_250,
      recommendedMinor: 632_000,
      rangeLowMinor: 593_000,
      rangeHighMinor: 741_000,
    },
    timeline: [2, 3, 3],
    milestoneAmounts: [
      [5_000, 316_000],
      [3_000, 189_600],
      [2_000, 126_400],
    ],
    warnings: [],
  },
  contentHeavyCms: {
    effort: {
      direct: [504, 728, 952],
      complexityAdditional: [0, 0, 0],
      testing: [71, 124, 190],
      projectManagement: [46, 77, 114],
      planned: [621, 929, 1_256],
      contingencyQh: 93,
      delivery: [621, 1_022, 1_256],
      lineCodes: [
        "project-blog",
        "additional-pages",
        "design-custom",
        "design-custom-additional-pages",
        "content-formatting",
        "asset-sourcing",
        "feature-blogCms",
        "feature-search",
        "integration-emailMarketing",
        "integration-analytics",
        "migration-standard",
        "deployment-freelancer",
      ],
    },
    priceLedgerOutputs: [2_044_000, 2_725_333, 2_725_333, 2_725_333, 2_726_000],
    pricing: {
      minimumSafeRawMinor: 2_512_000,
      minimumSafeMinor: 2_512_000,
      recommendedBeforeUrgencyRawMinor: 2_725_333,
      recommendedRawMinor: 2_725_333,
      recommendedMinor: 2_726_000,
      rangeLowMinor: 2_512_000,
      rangeHighMinor: 3_350_000,
    },
    timeline: [7, 11, 13],
    milestoneAmounts: [
      [3_000, 817_800],
      [2_500, 681_500],
      [2_500, 681_500],
      [1_000, 272_600],
      [1_000, 272_600],
    ],
    warnings: [],
  },
  ecommerceWebsite: {
    effort: {
      direct: [596, 828, 1_060],
      complexityAdditional: [95, 132, 170],
      testing: [97, 163, 246],
      projectManagement: [95, 152, 221],
      planned: [883, 1_275, 1_697],
      contingencyQh: 191,
      delivery: [883, 1_466, 1_697],
      lineCodes: [
        "project-ecommerce",
        "additional-pages",
        "design-custom",
        "design-custom-additional-pages",
        "content-formatting",
        "asset-sourcing",
        "feature-search",
        "feature-adminDashboard",
        "feature-payments",
        "feature-ecommerce",
        "integration-emailMarketing",
        "integration-analytics",
        "integration-thirdPartyApi",
        "migration-standard",
        "deployment-freelancer",
      ],
    },
    priceLedgerOutputs: [3_298_500, 4_712_143, 4_712_143, 4_712_143, 4_713_000],
    pricing: {
      minimumSafeRawMinor: 3_818_250,
      minimumSafeMinor: 3_819_000,
      recommendedBeforeUrgencyRawMinor: 4_712_143,
      recommendedRawMinor: 4_712_143,
      recommendedMinor: 4_713_000,
      rangeLowMinor: 3_819_000,
      rangeHighMinor: 5_455_000,
    },
    timeline: [9, 15, 17],
    milestoneAmounts: [
      [3_000, 1_413_900],
      [2_500, 1_178_250],
      [2_500, 1_178_250],
      [1_000, 471_300],
      [1_000, 471_300],
    ],
    warnings: [],
  },
  saasWebApplication: {
    effort: {
      direct: [936, 1_314, 1_692],
      complexityAdditional: [234, 329, 423],
      testing: [164, 279, 423],
      projectManagement: [200, 317, 457],
      planned: [1_534, 2_239, 2_995],
      contingencyQh: 336,
      delivery: [1_534, 2_575, 2_995],
      lineCodes: [
        "project-webApp",
        "additional-pages",
        "design-fullUx",
        "design-fullUx-additional-pages",
        "feature-authentication",
        "feature-userAccounts",
        "feature-adminDashboard",
        "feature-payments",
        "feature-membership",
        "feature-subscriptions",
        "integration-emailMarketing",
        "integration-analytics",
        "integration-thirdPartyApi",
        "migration-light",
        "deployment-freelancer",
      ],
    },
    priceLedgerOutputs: [
      7_725_000, 11_884_615, 11_884_615, 11_884_615, 11_885_000,
    ],
    pricing: {
      minimumSafeRawMinor: 8_985_000,
      minimumSafeMinor: 8_985_000,
      recommendedBeforeUrgencyRawMinor: 11_884_615,
      recommendedRawMinor: 11_884_615,
      recommendedMinor: 11_885_000,
      rangeLowMinor: 8_985_000,
      rangeHighMinor: 13_824_000,
    },
    timeline: [16, 26, 30],
    milestoneAmounts: [
      [3_000, 3_565_500],
      [2_500, 2_971_250],
      [2_500, 2_971_250],
      [1_000, 1_188_500],
      [1_000, 1_188_500],
    ],
    warnings: ["advanced-complexity", "complex-web-app"],
  },
  integrationHeavyCustom: {
    effort: {
      direct: [984, 1_432, 1_880],
      complexityAdditional: [246, 358, 470],
      testing: [172, 304, 470],
      projectManagement: [210, 346, 508],
      planned: [1_612, 2_440, 3_328],
      contingencyQh: 488,
      delivery: [1_612, 2_928, 3_328],
      lineCodes: [
        "project-custom",
        "additional-pages",
        "design-custom",
        "design-custom-additional-pages",
        "content-formatting",
        "feature-authentication",
        "feature-userAccounts",
        "feature-adminDashboard",
        "integration-crm",
        "integration-emailMarketing",
        "integration-analytics",
        "integration-maps",
        "integration-otherStandard",
        "integration-thirdPartyApi",
        "integration-customApi",
        "migration-complex",
        "deployment-freelancer",
      ],
    },
    priceLedgerOutputs: [
      7_320_000, 10_457_143, 10_457_143, 10_457_143, 10_458_000,
    ],
    pricing: {
      minimumSafeRawMinor: 8_320_000,
      minimumSafeMinor: 8_320_000,
      recommendedBeforeUrgencyRawMinor: 10_457_143,
      recommendedRawMinor: 10_457_143,
      recommendedMinor: 10_458_000,
      rangeLowMinor: 8_320_000,
      rangeHighMinor: 11_886_000,
    },
    timeline: [17, 30, 34],
    milestoneAmounts: [
      [5_000, 5_229_000],
      [1_667, 1_743_348],
      [1_667, 1_743_348],
      [666, 696_502],
      [1_000, 1_045_802],
    ],
    warnings: [
      "integration-discovery",
      "complex-migration",
      "advanced-complexity",
      "high-risk",
      "custom-api-discovery",
      "several-custom-apis",
    ],
  },
  rushProject: {
    effort: {
      direct: [116, 154, 192],
      complexityAdditional: [0, 0, 0],
      testing: [9, 15, 23],
      projectManagement: [10, 15, 22],
      planned: [135, 184, 237],
      contingencyQh: 18,
      delivery: [135, 202, 237],
      lineCodes: [
        "project-business",
        "design-template",
        "feature-contactForm",
        "integration-analytics",
        "deployment-freelancer",
      ],
    },
    priceLedgerOutputs: [505_000, 631_250, 631_250, 820_625, 821_000],
    pricing: {
      minimumSafeRawMinor: 770_250,
      minimumSafeMinor: 771_000,
      recommendedBeforeUrgencyRawMinor: 631_250,
      recommendedRawMinor: 820_625,
      recommendedMinor: 821_000,
      rangeLowMinor: 771_000,
      rangeHighMinor: 963_000,
    },
    timeline: [3, 4, 4],
    milestoneAmounts: [
      [5_000, 410_500],
      [3_000, 246_300],
      [2_000, 164_200],
    ],
    warnings: ["rush-capacity-confirmation"],
  },
  highRiskModerateComplexity: {
    effort: {
      direct: [212, 286, 360],
      complexityAdditional: [17, 23, 29],
      testing: [18, 31, 47],
      projectManagement: [25, 37, 52],
      planned: [272, 377, 488],
      contingencyQh: 57,
      delivery: [272, 434, 488],
      lineCodes: [
        "project-business",
        "design-template",
        "feature-authentication",
        "feature-userAccounts",
        "integration-analytics",
        "deployment-freelancer",
      ],
    },
    priceLedgerOutputs: [1_085_000, 1_356_250, 1_356_250, 1_356_250, 1_357_000],
    pricing: {
      minimumSafeRawMinor: 1_220_000,
      minimumSafeMinor: 1_220_000,
      recommendedBeforeUrgencyRawMinor: 1_356_250,
      recommendedRawMinor: 1_356_250,
      recommendedMinor: 1_357_000,
      rangeLowMinor: 1_220_000,
      rangeHighMinor: 1_525_000,
    },
    timeline: [3, 5, 5],
    milestoneAmounts: [
      [5_000, 678_500],
      [2_400, 325_680],
      [1_600, 217_120],
      [1_000, 135_700],
    ],
    warnings: ["high-risk"],
  },
} as const satisfies Record<QuoteFixtureName, ExpectedQuoteLedger>;
