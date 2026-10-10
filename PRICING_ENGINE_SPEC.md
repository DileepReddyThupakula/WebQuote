# WebQuote Pricing Engine Specification

Status: V1 starting calibration approved as versioned, replaceable hypotheses  
Model identifier: `webquote-pricing-v1`

## 1. Purpose and non-claim

The engine converts explicit project scope and user pricing preferences into a deterministic planning estimate. It does not query market rates and does not claim that its output is the correct price for a geography, profession, or client.

Required result label:

> Recommended planning range based on your project scope and pricing preferences.

All effort values and commercial parameters below are V1 product hypotheses to be calibrated. They are not market-price claims. The user’s own minimum hourly value is the only hourly price input.

## 2. Numeric units

| Concept | Representation | Rule |
|---|---|---|
| Effort | integer quarter-hours (`qh`) | 4 qh = 1 hour |
| Money | integer minor units | 100 paise/cents/pence = 1 major unit for V1 currencies |
| Percentage | integer basis points (`bp`) | 100 bp = 1%; 10,000 bp = 100% |
| Multiplier | integer basis points | 10,000 bp = 1.00× |
| Dates | ISO strings at boundaries | Dates do not affect price in V1 except a normalized urgency selection |

All formulas use integer/rational helpers. Round half up when a division produces a fractional minor unit or quarter-hour. Final displayed quote values are rounded up to a currency-specific commercial increment:

- INR: nearest ₹500;
- USD, GBP, EUR: nearest 10 major units.

The unrounded minor-unit values remain in the result for explanation and tests. Commercial rounding always moves a recommended/floor amount upward, never downward.

## 3. Authoritative pricing configuration

Every numeric assumption that can alter a quote lives in one validated `PricingConfigV1` object. Calculation functions receive that object explicitly; they do not import loose constants or duplicate values in UI code.

The configuration contains:

| Group | Parameters |
|---|---|
| Identity | `configId`, semantic `configVersion`, `effectiveAt`, compatible input/result schema versions |
| Units/rounding | hours-per-unit, percentage scale, intermediate rounding, commercial increments per currency |
| Validation | page/count/margin/capacity/revision bounds and dependency limits |
| Effort catalogue | project foundations, included pages, per-page work, design, content, features, integrations, migration, deployment |
| Expected effort | named `expectedEffortPositionBp`, proposed initially as 5,000 bp (the midpoint of each low/high effort range) |
| Complexity | signal weights, band thresholds, and effort multipliers |
| Project overhead | testing and project-management low/expected/high rates plus minimum hours |
| Risk/uncertainty | contingency preference bases, risk adjustments, and min/max reserve |
| Commercial | margin bound, urgency premiums, quote rounding, safe-floor rule |
| Secondary outputs | timeline, revisions, change orders, maintenance, deposit/milestone rules |
| Warnings | discovery thresholds and reason codes |

`expectedEffortPositionBp` is a calibration parameter, not a commercial truth or claimed statistical percentile. It converts a configured low/high planning interval into an expected point:

```text
expected = low + round((high - low) × expectedEffortPositionBp / 10,000)
```

The proposed initial value is 50% because no observed delivery dataset currently justifies a skew. It may be calibrated later without changing engine code. A future value change creates a new configuration version and never changes an already generated result.

The engine result records the configuration identity and a resolved calculation ledger. Historical results render from their stored values. Selecting “Recalculate with current assumptions” creates a new result under the current registered config; it never mutates the prior result.

## 4. Canonical inputs and proposed validation

### 4.1 Project

| Input | Type / values | Proposed constraint/default |
|---|---|---|
| `projectType` | landing, business, portfolio, blog, ecommerce, webApp, custom | required |
| `pageCount` | integer | 1–100; means unique pages/screens |
| `currency` | INR, USD, GBP, EUR | required |
| `clientContext` | optional plain text | max 80 characters; no price effect |

For projects above 100 unique pages/screens, V1 recommends a custom discovery estimate rather than extrapolating an unreliable fixed model.

### 4.2 Design

`designMode` is exactly one of:

- `provided` — implementation-ready design supplied;
- `template` — adapt a selected design system/template;
- `custom` — custom visual design from an established brief; or
- `fullUx` — discovery, information architecture, wireframes, and UI design.

### 4.3 Content

- `contentMode`: `provided`, `formatting`, or `copywriting`.
- `assetSourcing`: boolean.
- `migration`: `none`, `light`, `standard`, or `complex`.

Migration means structured content/data movement, not merely copying supplied text into new pages.

### 4.4 Features

Booleans:

- contact form;
- blog/CMS;
- search;
- authentication;
- user accounts;
- admin dashboard;
- booking;
- payments;
- ecommerce;
- membership; and
- subscriptions.

Dependencies:

- accounts, membership, or subscriptions require authentication;
- subscriptions require payments;
- ecommerce project type enables the ecommerce capability unless the user explicitly changes the project to `custom`;
- blog project type enables blog/CMS;
- a dependency auto-added by normalization is shown in review and scope, never hidden.

### 4.5 Integrations

Counts, each integer 0–10:

- CRM;
- email marketing;
- analytics;
- maps/location;
- other standard third-party integrations;
- third-party API integrations; and
- custom API integrations.

Total integrations above 15 are outside the reliable self-serve model and return a “discovery required” warning. The engine may still calculate up to the validated per-type caps, but the result is marked high uncertainty.

### 4.6 Delivery and commercial inputs

| Input | Values / bounds | Default |
|---|---|---|
| `testingLevel` | essential, enhanced | essential |
| `deploymentOwner` | client, freelancer | freelancer |
| `urgency` | standard, priority, rush | standard |
| `postLaunchSupportDays` | 0, 14, 30, 60 | 30 |
| `maintenanceTier` | none, essential, standard, priority | none |
| `weeklyCapacityHours` | integer 5–60 | 25 |
| `hourlyValueMinor` | positive integer | no silent default at calculation |
| `targetMarginBp` | 0–5000 bp | 2000 bp (20%) |
| `contingency` | lean, balanced, cautious | balanced |
| `riskLevel` | low, medium, high | medium |
| `includedRevisionRounds` | integer 0–5 | 2 |

The UI may suggest defaults, but calculation cannot proceed until the user confirms hourly value, target margin, and contingency.

## 5. Effort catalogue

Each selected item produces a low/high effort range. Tables are stored in one versioned configuration module.

### 5.1 Project foundation

Foundation includes discovery handoff, repository/project setup, responsive structural foundation, baseline accessibility, shared layout, and delivery coordination. It does not include optional features listed later.

| Project type | Included pages/screens | Low | High |
|---|---:|---:|---:|
| Landing page | 1 | 10 h | 16 h |
| Business website | 5 | 16 h | 24 h |
| Portfolio | 5 | 14 h | 22 h |
| Blog/content site | 5 | 16 h | 24 h |
| Ecommerce website | 7 | 24 h | 36 h |
| Web application | 5 | 32 h | 52 h |
| Custom website | 5 | 20 h | 32 h |

Project-type-implied features (blog/CMS or ecommerce) are added once from the feature catalogue. They are not included again in foundation effort.

### 5.2 Additional pages/screens

Only pages beyond the included count add effort.

| Page context | Low per page | High per page |
|---|---:|---:|
| Landing/business/portfolio/blog/custom | 2 h | 4 h |
| Ecommerce unique page/template | 3 h | 5 h |
| Web-app screen | 4 h | 8 h |

Repeated products/posts are not pages. Complex migration covers volume handling separately.

### 5.3 Design

Design effort includes shared visual direction plus additional unique-page effort.

| Mode | Shared low/high | Additional-page low/high |
|---|---:|---:|
| Provided design | 2–4 h | 0.25–0.5 h |
| Template adaptation | 6–10 h | 0.5–1 h |
| Custom design | 14–24 h | 1–2 h |
| Full UI/UX | 24–40 h | 2–3.5 h |

Additional-page design applies only beyond the project type’s included page count.

### 5.4 Content

| Selection | Low | High |
|---|---:|---:|
| Client-provided, implementation-ready | 0 h/page | 0 h/page |
| Formatting/entry | 0.5 h/page | 1 h/page |
| Copywriting support | 1.5 h/page | 3 h/page |
| Asset sourcing | 0.5 h/page | 1 h/page |

Content effort applies to all counted unique pages. Large content inventories are handled through migration/discovery.

### 5.5 Core and business features

| Feature | Low | High |
|---|---:|---:|
| Contact form | 2 h | 4 h |
| Blog/CMS | 8 h | 14 h |
| Search | 5 h | 10 h |
| Authentication | 14 h | 24 h |
| User accounts/profile | 12 h | 22 h |
| Admin dashboard | 20 h | 36 h |
| Booking | 12 h | 22 h |
| Payments (one-time) | 10 h | 18 h |
| Ecommerce core | 28 h | 48 h |
| Membership/access rules | 18 h | 32 h |
| Subscriptions | 16 h | 28 h |

These ranges assume established providers and normal happy-path/error-path handling. Bespoke compliance, marketplace/multi-vendor commerce, advanced search, complex permissions, or custom payment infrastructure are out of model and require a discovery warning.

### 5.6 Integrations

| Integration | Low each | High each |
|---|---:|---:|
| Analytics | 2 h | 4 h |
| Maps/location | 3 h | 6 h |
| CRM | 4 h | 8 h |
| Email marketing | 3 h | 6 h |
| Other standard third-party | 4 h | 8 h |
| Third-party API | 8 h | 16 h |
| Custom API | 16 h | 32 h |

Credentials, vendor access, plan fees, data cleanup, and undocumented APIs are exclusions unless separately scoped.

### 5.7 Migration

| Level | Low | High |
|---|---:|---:|
| None | 0 h | 0 h |
| Light | 4 h | 8 h |
| Standard | 10 h | 20 h |
| Complex | 24 h | 48 h |

Complex migration always adds a discovery/uncertainty warning. V1 does not accept raw row counts because content shape and cleanup matter more than volume alone.

### 5.8 Deployment

| Owner | Low | High |
|---|---:|---:|
| Client handles | 0 h | 1 h |
| Freelancer handles | 3 h | 6 h |

Third-party hosting fees and domain/email administration are excluded unless explicitly added in future scope.

## 6. Effort calculation

### 6.1 Direct implementation range and expected point

For every selected line item, calculate a low, configured expected, and high effort value, then sum by category:

```text
lineExpected = lineLow + roundQh(
  (lineHigh - lineLow) × config.expectedEffortPositionBp / 10,000
)

directLow      = Σ selectedLine.lowQh
directExpected = Σ selectedLine.expectedQh
directHigh     = Σ selectedLine.highQh
```

Categories are development, design, features, integrations, content, migration, and deployment.

The UI describes `directExpected` as the calibrated expected point within the planning range. It does not call it a probability, percentile, or guaranteed outcome. The low/high values remain visible so the expected point is not mistaken for false precision.

### 6.2 Complexity score and effort multiplier

The engine creates an explainable point score:

| Signal | Points |
|---|---:|
| Every standard integration after the first two | +1 each |
| Every API/custom API integration | +2 / +3 each |
| Authentication | +2 |
| Accounts, admin, booking, payments | +1 each |
| Ecommerce | +3 |
| Membership or subscriptions | +2 each |
| Standard/complex migration | +1 / +3 |
| More than 20 unique pages/screens | +1 |

Bands:

| Score | Band | Effort multiplier |
|---:|---|---:|
| 0–2 | straightforward | 1.00× |
| 3–6 | moderate | 1.08× |
| 7–11 | complex | 1.16× |
| 12+ | advanced | 1.25× |

Apply the multiplier independently to direct low, expected, and high effort. Return the increase as a separate `complexityAdditionalEffort` line rather than hiding it inside the base categories. The result explanation lists the concrete scope signals that contributed; it never shows an unexplained “complexity tax.”

Declared risk is not a complexity signal. Complexity represents known scope/interaction burden and primarily affects effort. Risk represents uncertainty and primarily affects contingency. A future configuration may apply a risk item to effort only through a separate named rule with an explicit rationale; no such dual-effect rule exists in V1.

```text
complexityAdjustedPoint = roundQh(directPoint × complexityMultiplierBp / 10,000)
complexityAdditionalPoint = complexityAdjustedPoint - directPoint
```

### 6.3 Testing overhead

Testing is explicit project-overhead effort computed after complexity adjustment and before project management:

| Level | Low | Expected | High | Minimum low/expected/high |
|---|---:|---:|---:|---:|
| Essential | 8% | 10% | 12% | 2 / 2.5 / 3 h |
| Enhanced | 14% | 17% | 20% | 4 / 5 / 6 h |

Use the greater of the configured percentage or minimum for each point. Essential covers responsive/functional/accessibility regression appropriate to the scope. Enhanced covers broader browser/device and integration-path verification; it is not a substitute for a project-specific compliance test plan. Testing level affects testing overhead directly and does not also increase complexity score.

### 6.4 Project management overhead

PM effort covers communication, review preparation, scheduling, and handoff:

| Complexity | Low | Expected | High |
|---|---:|---:|---:|
| Straightforward | 8% | 9% | 10% |
| Moderate | 10% | 11% | 12% |
| Complex | 12% | 13.5% | 15% |
| Advanced | 15% | 16.5% | 18% |

Apply to the corresponding `complexityAdjusted + testing` point. Configured minimum PM effort is 1 h low / 1.5 h expected / 2 h high. Testing plus project management form the reported `projectOverheadEffort`; neither is hidden inside the hourly value or margin.

### 6.5 Risk/uncertainty contingency

Contingency is an uncertainty reserve applied after the expected PM-adjusted effort has been calculated:

| Preference | Base reserve |
|---|---:|
| Lean | 5% |
| Balanced | 10% |
| Cautious | 15% |

Declared risk modifies the reserve:

- low: −2 percentage points, floor 3%;
- medium: no change;
- high: +5 percentage points, cap 25%.

```text
plannedLowQh      = complexityLow + testingLow + projectManagementLow
plannedExpectedQh = complexityExpected + testingExpected + projectManagementExpected
plannedHighQh     = complexityHigh + testingHigh + projectManagementHigh

contingencyQh = roundQh(plannedExpectedQh × finalContingencyBp / 10,000)
riskAdjustedExpectedQh = plannedExpectedQh + contingencyQh
safeEffortQh = max(plannedHighQh, riskAdjustedExpectedQh)

deliveryLowQh      = plannedLowQh
deliveryExpectedQh = riskAdjustedExpectedQh
deliveryHighQh     = safeEffortQh
```

The configured low/high effort spread represents ordinary delivery variation for known scope. The separately reported contingency represents project-specific uncertainty selected by the user. Taking the maximum for `safeEffortQh` avoids automatically stacking the full high estimate and the full contingency while still preserving a defensible floor.

Risk has no automatic effect on the complexity multiplier, project-management rate, maintenance burden, or rush premium in V1. Its primary pricing effect is the named contingency line. High risk may still influence the suggested deposit because payment exposure is a commercial term, not an effort multiplier.

## 7. Price calculation

Definitions before urgency and commercial rounding:

```text
lowCost      = deliveryLowHours × hourlyValue
expectedCost = deliveryExpectedHours × hourlyValue
safeCost     = deliveryHighHours × hourlyValue
marginFactor = 1 - targetGrossMargin
```

Target margin is margin on revenue:

```text
priceAtMargin(cost) = cost / (1 - margin)
```

At the V1 maximum 50% margin, division remains defined. UI copy must distinguish 20% margin from a 20% markup.

### 7.1 Minimum safe price

```text
minimumSafeBeforeRush = safeCost
```

This covers the greater of the configured high effort estimate or the risk-adjusted expected effort at the user's minimum hourly value. It does not guarantee the desired margin. It is a planning floor, not a legal minimum.

### 7.2 Recommended quote and range before urgency

```text
recommendedCostBasis = expectedCost
recommendedAtMargin = priceAtMargin(recommendedCostBasis)
recommendedBeforeRush = max(minimumSafeBeforeRush, recommendedAtMargin)

rangeLowBeforeRush = min(
  recommendedBeforeRush,
  max(minimumSafeBeforeRush, priceAtMargin(lowCost))
)

rangeHighBeforeRush = max(
  recommendedBeforeRush,
  priceAtMargin(safeCost)
)
```

The recommended quote is therefore derived from the configured expected effort, explicit complexity effort, testing/project overhead, risk contingency, the user's hourly floor, and target gross margin. If that price would fall below the safe floor, the safe-floor adjustment is shown as a separate reason. The range never falls below the floor, and the recommendation remains inside the range.

There is no hard-coded percentile in the commercial formula. The only interpolation is the named `expectedEffortPositionBp` calibration parameter used to calculate expected effort from configured low/high ranges.

### 7.2.1 Client planning range

The range in 7.2 is a private, freelancer-facing range: its low end is always the minimum safe price. It is never shown to a client. When the freelancer chooses to present a range to the client, it is derived from the final quoted amount (the calculated recommendation or the user's override):

```text
clientLow  = finalQuotedAmount
clientHigh = roundUp(finalQuotedAmount × rangeHigh / recommended, commercialIncrement)
```

The client range therefore never falls below the quote, always contains it, follows custom amounts, and cannot reveal the minimum safe price unless the freelancer quotes it. The upper figure reuses the engine's own high-end spread and adds no new calibration value. Client wording states that the lower figure is the price for the listed scope and the upper figure applies only if the scope grows. A quote below the minimum safe price warns but is not blocked.

### 7.3 Urgency/rush fee

| Urgency | Surcharge | Meaning |
|---|---:|---|
| Standard | 0% | Normal sequencing |
| Priority | 15% | Work reprioritized; moderate compression |
| Rush | 30% | Significant schedule compression/availability cost |

Apply the configured surcharge to minimum safe, range low/high, and recommended values. Return each incremental amount separately; the primary rush fee shown beside the recommendation is:

```text
rushFee = recommendedBeforeRush × rushPercent
recommended = recommendedBeforeRush + rushFee
```

The UI must show the pre-rush base and fee; it must not bury urgency inside an unexplained total. “Rush” does not guarantee a date. The user must validate capacity.

### 7.4 Commercial rounding

Round each displayed commercial amount upward only after expected effort, overhead, contingency, hourly value, gross margin, and urgency have been applied. Preserve raw values and record the rounding increment/delta in the ledger. After rounding, enforce:

```text
minimumSafe ≤ rangeLow ≤ recommended ≤ rangeHigh
```

If independent rounding would violate order, raise the later amount to the prior amount. Do not lower the safe floor.

## 8. Timeline

```text
lowWeeks      = max(1, ceil(deliveryLowHours / weeklyCapacityHours))
expectedWeeks = max(lowWeeks, ceil(deliveryExpectedHours / weeklyCapacityHours))
highWeeks     = max(expectedWeeks, ceil(deliveryHighHours / weeklyCapacityHours))
```

The output is a delivery-effort range, not a calendar commitment. Client waiting time, approval delays, content delays, holidays, and parallel projects are disclosed assumptions. Priority/rush pricing does not mathematically reduce the hours; the summary labels schedule compression as requiring capacity confirmation.

## 9. Revisions

Included rounds are user-selected (default 2). A round means one consolidated set of feedback on the agreed scope, not an unlimited stream of messages.

Extra revision effort is based on design + development + content effort before complexity:

```text
extraRevisionLow  = max(2 h, 4% of eligibleLowHours)
extraRevisionHigh = max(4 h, 8% of eligibleHighHours)
```

The suggested extra-round price range uses the configured expected-effort position, `priceAtMargin`, and commercial rounding. The client summary uses that expected/recommended value unless overridden. New functionality is a change request, not a revision.

### 9.1 Included revision rounds and post-launch support effort (model v2)

Pricing model `webquote-pricing-v2` (config `webquote-v2-calibration@2.0.0`) keeps every v1 effort, overhead, risk, urgency, rounding and milestone number unchanged and adds effort for two commitments the quote makes. Model v1 did not price either.

```text
roundsAboveBaseline = max(0, includedRevisionRounds - baselineRounds)   // baselineRounds = 2
includedRevisionEffort = roundsAboveBaseline × extraRoundEffort         // the per-round effort of section 9
postLaunchSupportEffort = includedWork.postLaunchSupport.byDays[supportDays]
```

- Rounds at or below the baseline add nothing and are not discounted, because the foundation ranges are not decomposed per round.
- Support effort is an **uncalibrated placeholder** table: 0 days 0 h, 14 days 2–4 h, 30 days 4–8 h, 60 days 8–16 h. The config marks it `calibration: "uncalibrated-placeholder"`; replace it from real project data.
- Both are added to planned effort after complexity, testing and project-management overhead, so those multipliers and percentages do not inflate them, and the risk contingency still applies. They are not revision-eligible effort.
- Included revision rounds count toward the build timeline. Post-launch support is excluded from it, because it happens after delivery.
- Each result stores the config identity and model version that produced it. Existing v1 results keep their v1 identity and are never recalculated.

## 10. Change-order pricing

Generate transparent suggested ranges:

- **Additional page/screen:** project-context per-page development + current design/content per-page effort, passed through complexity and margin.
- **Additional standard integration:** 4–8 h at margin.
- **Additional API integration:** 8–16 h at margin.
- **Additional custom API:** 16–32 h at margin.
- **Urgent change:** normal out-of-scope estimate plus the selected rush percentage (default to priority 15% if the quote itself is standard).
- **Hourly out-of-scope work:** `hourlyValue / (1 - targetMargin)`, rounded up to a sensible whole currency unit.

Every change-order item states that final pricing depends on written scope. Third-party fees are excluded.

Suggested change-order ranges also include the current testing and project-management rates; they are not raw build-hours-only prices.

Client-facing output (preview, copied summary, PDF) lists only the per-page, per-revision-round, standard-integration, third-party-API and custom-API prices. The urgent-change and hourly out-of-scope prices are computed directly from the freelancer's hourly value and margin, so they remain on the internal results screen and are never shown to a client.

## 11. Maintenance

Maintenance is a separately priced monthly planning range and is never silently included in the project quote.

### 11.1 Monthly effort

| Tier | Base low/high | Intended coverage |
|---|---:|---|
| None | 0 h | No ongoing maintenance |
| Essential | 2–4 h | updates, backups/checks, small fixes |
| Standard | 4–8 h | essential plus monitoring/content assistance |
| Priority | 8–16 h | higher-touch support and reserved capacity |

Add burden:

- +0.5–1 h for each API/custom API integration;
- +1–2 h if ecommerce is selected;
- +1–2 h for membership/subscriptions combined;
- +1–2 h for business-critical behavior (authentication, admin dashboard,
  booking, or payments);
- +1–3 h for complex migration when it implies ongoing operational complexity;
- multiply by 1.08 / 1.16 / 1.25 for moderate / complex / advanced complexity (straightforward = 1.00).

Declared project risk does not automatically change maintenance burden. Ongoing operational burden must come from concrete selected features/integrations or a separately scoped maintenance input.

### 11.2 Price

```text
maintenanceLow  = priceAtMargin(monthlyLowHours × hourlyValue)
maintenanceHigh = priceAtMargin(monthlyHighHours × hourlyValue)
```

Round commercially. Hosting, licenses, ad spend, content production, redesign, feature development, incident recovery, and third-party charges are explicit exclusions unless separately agreed.

Post-launch support days are part of project scope only for defect correction against the agreed deliverables. They do not include new features or ongoing maintenance.

## 12. Deposit and milestones

Suggested schedule depends on high timeline and risk:

| Condition | Schedule |
|---|---|
| High estimate ≤ 4 weeks | 50% start / 30% approved build milestone / 20% before launch |
| High estimate 5–8 weeks | 40% start / 30% design or foundation approval / 20% feature-complete / 10% before launch |
| High estimate > 8 weeks or advanced complexity | 30% start / 25% foundation / 25% feature-complete / 10% acceptance / 10% before launch |
| Rush or high risk | Deposit is at least 50%; proportionally reduce the middle milestone(s) |

Deposit amount is `recommendedQuote × firstMilestonePercent`, rounded to minor units for arithmetic and formatted commercially. Milestone percentages must be positive integers and total exactly 100%. Users may edit labels/percentages; the UI recalculates amounts and prevents an invalid total from entering the client summary.

## 13. Scope generation

Scope is generated from normalized inputs and line-item IDs, not free-form AI. Examples:

- page count and project type;
- design mode;
- selected features and integration counts/types;
- content services;
- test level and deployment owner;
- included revision rounds;
- post-launch defect-support window; and
- maintenance tier only when selected.

Use deterministic templates with pluralization and human-readable labels. The user may edit the client-facing list after generation without altering the calculation.

## 14. Exclusion generation

Always include:

- work outside the approved scope;
- unlimited or unconsolidated revisions;
- third-party subscriptions, licenses, hosting, domain, payment processing, and usage fees;
- client delays/content delays from the delivery estimate;
- tax/legal/compliance work unless selected and separately agreed; and
- ongoing maintenance unless selected.

Conditionally include:

- copywriting when not selected;
- asset sourcing/licensing when not selected;
- content/data migration when not selected;
- deployment when client-owned;
- custom integrations or undocumented APIs not selected;
- ecommerce data entry and complex catalogue migration;
- accessibility certification/security audit/performance SLA, none of which is implied by baseline good practice.

## 15. Explainability contract

Every result category returns:

- stable line-item ID;
- user-facing label;
- low/expected/high qh;
- source input key/value;
- short reason;
- model/configuration ID and parameter reference; and
- category.

Every multiplier/overhead returns:

- its exact rate;
- the subtotal it applies to;
- the reason it applies; and
- the amount added.

The result also returns a top-level price ledger in this order:

1. expected direct effort;
2. complexity-related additional effort;
3. testing and project-management overhead;
4. risk/uncertainty contingency;
5. expected hours priced at the user's hourly value;
6. target-gross-margin adjustment;
7. any safe-floor adjustment;
8. urgency/rush surcharge; and
9. commercial rounding adjustment.

The UI can therefore answer “Why did this change?” and explain every major contributor without reconstructing formulas. Client-ready copy and PDF exclude this internal ledger by default; an explicit export option may include only the approved client-readable explanation.

## 16. Warnings and discovery triggers

Return warnings for:

- more than 100 pages/screens (validation stop);
- more than 15 total integrations;
- complex migration;
- advanced complexity;
- high risk;
- custom API work;
- ecommerce plus subscriptions/membership/admin combinations;
- target margin of 0%;
- weekly capacity inconsistent with a rush expectation; and
- an overridden quote below the minimum safe price.

Warnings do not claim the project is impossible. They state that discovery and a custom technical estimate may be needed.

## 17. Required invariants

Tests must prove for valid inputs:

1. All hours and money are finite non-negative integers.
2. Every line-item low is less than or equal to its high.
3. Total hours equal the sum of reported components under the documented pipeline.
4. Minimum safe ≤ range low ≤ recommended ≤ range high after rush/rounding.
5. A higher page count cannot reduce effort or price when other inputs are fixed.
6. Adding a feature/integration cannot reduce effort or price.
7. Increasing hourly value, margin, contingency, risk, or urgency cannot reduce the relevant price.
8. Standard urgency has zero rush fee.
9. Milestones total exactly 100% and amounts reconcile to the quote within minor-unit rounding.
10. `maintenanceTier = none` returns no monthly price.
11. Currency changes symbols/rounding increments only; identical minor-unit hourly input and scope do not activate a hidden geographic multiplier.
12. Equivalent normalized dependency selections produce identical results.
13. Re-running identical normalized input and pricing configuration version returns identical commercial values and line items.
14. Risk level cannot change complexity score or complexity-added effort in V1.
15. Changing `expectedEffortPositionBp` through a new config changes expected values without requiring engine-code changes and never mutates stored results from the prior config.

## 18. Edge cases to test

- minimum/maximum page counts;
- every project type, currency, design mode, contingency, risk, urgency, and maintenance tier;
- no optional features vs all valid features;
- auto-added dependencies;
- 0% and 50% target margin;
- smallest accepted hourly value and very large but safe integer values;
- values that land immediately below/above rounding increments;
- long currency formatting and narrow-screen display;
- zero revision rounds and five rounds;
- storage/input version mismatch;
- unsupported enum and malformed numeric values;
- advanced/discovery warning combinations;
- exact milestone reconciliation after rounding; and
- all monotonicity invariants;
- expected-effort calibration at 0, 5,000, and 10,000 bp in test-only configurations;
- risk changes that alter contingency but leave complexity unchanged; and
- historical result rendering after a newer pricing config is registered.

## 19. Model governance

- `PricingConfigV1` is the only authoritative source of calibration values. Engine modules may contain arithmetic algorithms and named zero/one unit identities, but no quote-altering business constants.
- Every config is validated at startup/test time and registered by immutable ID/version. Duplicate identities with different content are rejected.
- Formula/schema changes require a model/result schema version. Calibration-only changes require a new pricing configuration version. Both require fixture updates.
- Old results display their original model and config identities; do not silently recalculate them under new assumptions.
- Historical results persist the resolved ledger needed for display even if the original config is no longer the default.
- Documentation must list every active configuration parameter, its unit, purpose, and rationale—not just the headline effort catalogue.
- Calibration changes require a written rationale and representative before/after fixture table across simple, typical, and complex projects.
- New calculations use the active registered config. Recalculation of an old quote is explicit and produces a separate result that can be compared.
- Do not tune constants solely to make example outputs look more attractive.

## 20. Approved V1 calibration hypotheses

The following are approved for the V1 starting configuration only. They remain centralized, versioned, documented, replaceable, and must never be described as objective industry truths.

1. The initial effort ranges in section 5.
2. `expectedEffortPositionBp` starts at 5,000 bp (the midpoint), explicitly as calibration data rather than a claimed percentile.
3. Complexity signal weights/bands and 1.00/1.08/1.16/1.25 effort multipliers.
4. Testing and project-management overhead rates/minimums in sections 6.3–6.4.
5. Contingency of 5%/10%/15%, modified by declared risk but not by complexity score.
6. Margin is gross margin on revenue and is capped at 50% in V1.
7. Priority/rush surcharges are 15%/30%.
8. Minimum safe effort is the greater of configured high effort or risk-adjusted expected effort; minimum safe price applies the user's hourly value before target margin.
9. Recommended quote prices risk-adjusted expected effort at the user's hourly value, applies target margin, then raises it to the safe floor only if necessary.
10. INR rounds up to ₹500 and other initial currencies to 10 major units, with the rounding delta disclosed.
11. Timeline uses a user-editable 25-hour weekly capacity default.
12. Maintenance, revision, change-order, and milestone models in sections 9–12.
13. High risk may raise the suggested deposit without also increasing complexity effort.
14. Rush adds an availability surcharge but does not pretend to reduce implementation hours or promise a shorter timeline; delivery capacity must be confirmed by the user.

