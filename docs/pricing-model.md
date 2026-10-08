# WebQuote V1 pricing model

Status: Phase 2 implementation complete and validated on 2026-09-26  
Model: `webquote-pricing-v1`  
Configuration: `webquote-v1-calibration@1.0.0`  
Effective: `2026-09-26T00:00:00.000Z`

This is a deterministic planning model, not a market-price oracle. The result
is a planning range derived from the selected scope and the freelancer's own
minimum hourly value. Location is not a pricing input or multiplier.

## Units and identity

- Money is a non-negative safe integer in minor units. INR, USD, GBP, and EUR
  use two decimal places.
- Effort is a non-negative safe integer in quarter-hours; four quarter-hours
  equal one hour.
- Percentages and multipliers are integer basis points; 10,000 bp equals 100%.
- Expected effort uses `expectedEffortPositionBp = 5,000`, a midpoint
  calibration value rather than a statistical claim.
- A result stores the model/config identity, normalized input, resolved effort
  values, warnings, milestones, and ledgers. A wall-clock creation time is not
  part of the deterministic result; persistence envelopes may add it later.

## Configuration structure

`PRICING_CONFIG_V1` is parsed by `parsePricingConfigV1` and deeply frozen.
Calculation functions receive the validated config explicitly. Its authoritative
groups are:

| Group | Active parameters |
|---|---|
| Identity | config id/version, model version, effective time, input/result schema versions |
| Units | quarter-hours per hour, basis-point scale |
| Validation | pages 1–100, integrations 0–10 each, capacity 5–60 hours/week, revisions 0–5, hourly value 1–100,000,000 minor units, margin 0–5,000 bp, 80-character client context |
| Currency | INR, USD, GBP, EUR metadata; INR commercial increment 50,000 minor units; other currencies 1,000 minor units; hourly change-order increment 100 minor units |
| Effort catalogue | project foundations, additional pages/screens, design modes, content, asset sourcing, features, integrations, migration, deployment |
| Complexity | free standard integrations, thresholds, signal weights, bands 0–2 / 3–6 / 7–11 / 12+, multipliers 10,000 / 10,800 / 11,600 / 12,500 bp |
| Overhead | testing rates/minima by testing level and project-management rates/minima by complexity |
| Risk | lean/balanced/cautious reserves 500/1,000/1,500 bp; low/medium/high adjustments -200/0/+500 bp; final reserve floor/cap 300/2,500 bp |
| Urgency | standard/priority/rush 0/1,500/3,000 bp |
| Timeline | default 25 delivery hours/week and one-week minimum |
| Revisions | 400/800 bp low/high eligible-effort rates and 8/16 quarter-hour minima |
| Change orders | contextual page/integration/API ranges, urgent default priority, one-hour hourly unit |
| Maintenance | tier ranges plus per-API, ecommerce, membership/subscription, business-critical, complex-migration, and complexity burden |
| Milestones | short/medium/long schedules, 5,000 bp elevated deposit, risk/urgency triggers |
| Warnings | integration, custom API, large scope, rush capacity, and complex-commerce thresholds |

The parser rejects inverted bounds, invalid effort ranges, non-consecutive
complexity bands, duplicate milestone codes, invalid currency identity, and
margin caps at or above 100%. Registry identity is `configId@configVersion`;
duplicates are rejected and older configs remain independently retrievable.

## Effort and complexity formulas

For each selected line:

```text
expectedQh = lowQh + roundHalfUp((highQh - lowQh) × expectedEffortPositionBp / 10,000)
direct = sum(selected low, expected, high)
complexityAdjusted = roundHalfUp(direct × complexityMultiplierBp / 10,000)
complexityAdditional = complexityAdjusted - direct
```

Known-scope complexity signals are standard integrations after two free,
third-party/custom APIs, authentication, accounts, admin, booking, payments,
ecommerce, membership, subscriptions, standard/complex migration, and more
than 20 pages/screens. Risk is not a complexity signal.

Testing is the greater of the configured percentage and configured minimum.
Project management is the same operation applied after testing, using the
complexity-specific rate. Planned effort is complexity-adjusted effort plus
testing plus project management.

Risk is applied separately:

```text
contingencyQh = roundHalfUp(plannedExpectedQh × finalContingencyBp / 10,000)
riskAdjustedExpectedQh = plannedExpectedQh + contingencyQh
safeEffortQh = max(plannedHighQh, riskAdjustedExpectedQh)
delivery = (plannedLowQh, riskAdjustedExpectedQh, safeEffortQh)
```

## Price, floor, range, and rounding

Costs use the selected hourly value and exact integer division:

```text
cost = roundHalfUp(effortQh × hourlyValueMinor / 4)
priceAtMargin = cost × 10,000 / (10,000 - targetMarginBp)
minimumSafeBeforeUrgency = cost(deliveryHighQh)
recommendedBeforeUrgency = max(minimumSafeBeforeUrgency, priceAtMargin(deliveryExpectedQh))
rangeLowBeforeUrgency = min(recommendedBeforeUrgency, max(minimumSafeBeforeUrgency, priceAtMargin(deliveryLowQh)))
rangeHighBeforeUrgency = max(recommendedBeforeUrgency, priceAtMargin(deliveryHighQh))
```

Urgency adds its configured percentage to each raw commercial point. Displayed
amounts then round upward: INR to ₹500, USD/GBP/EUR to 10 major units. Later
points are raised to the previous point if needed, so:

```text
minimumSafe ≤ rangeLow ≤ recommended ≤ rangeHigh
```

The price ledger records expected labor value, gross-margin adjustment,
safe-floor adjustment, urgency, and rounding. The effort ledger separately
records direct effort, complexity effort, testing, project management, and risk
contingency.

## Timeline, revisions, and change orders

```text
weeks = max(1, ceil(deliveryQh / (weeklyCapacityHours × 4)))
```

Urgency changes price and capacity-confirmation state, not effort or promised
weeks. Extra revision effort uses eligible design/development/content lines:

```text
low = max(8 qh, roundHalfUp(eligibleLowQh × 400 / 10,000))
high = max(16 qh, roundHalfUp(eligibleHighQh × 800 / 10,000))
```

Change orders include an additional page/screen, extra revision round, standard
integration, third-party API, custom API, urgent change, and one-hour generic
out-of-scope work. Each is priced through contextual testing/PM overhead,
gross-margin math, urgency where applicable, and configured rounding.

## Maintenance and payment terms

Maintenance is separate from the project quote. The selected tier is increased
only by concrete burden: each third-party/custom API, ecommerce, membership or
subscriptions, business-critical behavior (authentication, admin, booking, or
payments), complex migration, and the complexity multiplier. Generic risk does
not change maintenance. The monthly range is priced with the same gross-margin
formula and commercial rounding.

Milestone schedules are configuration-driven: short 50/30/20, medium 40/30/20/10,
and long 30/25/25/10/10. High risk or priority/rush raises the deposit to at
least 50% by reducing middle milestones proportionally. The final milestone
receives the residual minor units so amounts reconcile exactly to the displayed
recommendation.

## Warnings and fixtures

Warnings are deterministic, non-blocking discovery notices for complex
migration, more than 15 integrations, advanced complexity, custom APIs,
multiple custom APIs, complex ecommerce combinations, web-app auth/admin/
payments, more than 50 pages/screens, zero margin, high risk, and rush with
capacity below 20 hours/week.

Reusable fixtures cover: a simple one-page landing page, five-page small
business site, content-heavy CMS site, ecommerce, SaaS web application,
integration-heavy custom project, rush project, and high-risk moderate-complexity
project. Resolved expected ledgers live in
`tests/fixtures/quotes/v1-ledgers.ts`.
