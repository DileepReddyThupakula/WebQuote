# Phase 4 evidence — Guided quote builder

Date: 2026-09-27  
Scope: Guided quote input flow only. Phase 5 result presentation and Phase 6 PDF export remain deferred.

## State model

`QuoteBuilder` is the only client island for the guided flow. A native React
reducer owns `QuoteBuilderDraft`, `currentStep`, legitimately completed steps,
and field errors. UI-friendly numeric values remain strings while editing so
empty, partial, and decimal states are not corrupted. Draft metadata such as
client/project context is separate from the pricing concepts and is mapped only
when supplied.

The seven step IDs are `project`, `design`, `features`, `integrations`,
`delivery`, `commercial`, and `review`. A step becomes complete only when its
current validation succeeds and Continue advances. Back and completed-step Edit
actions do not discard valid input.

## Mapping into `QuoteInputV1`

`src/features/quote-builder/mapping.ts` is the sole UI-to-domain conversion
boundary. It maps the complete draft into the existing `QuoteInputV1`, then
calls the authoritative domain parser before calculation. Money uses `BigInt`
for scaled decimal parsing and is stored as integer minor units. Gross margin is
converted to integer basis points. Integration counts and other numeric values
use explicit integer/range parsing. No pricing formula or dependency rule is
duplicated in the builder.

## Implemented steps

1. Project: project type, pages/screens, currency, and optional non-pricing client/project context.
2. Design & content: design mode, content responsibility, asset/image sourcing.
3. Features: grouped core site, accounts/operations, and commerce feature checkboxes.
4. Integrations: CRM, email marketing, analytics, maps, other standard integrations, and revealed third-party/custom API counts.
5. Delivery: urgency, revision rounds, optional weekly capacity, migration, support duration, maintenance preference, testing, and deployment responsibility.
6. Commercial terms: currency-prefixed minimum hourly value, target gross margin, contingency, and separately described risk exposure.
7. Review: input-only summaries for all six input sections, with Edit actions and Calculate quote.

## Validation and conditional behavior

Step validation is immediate only after an attempted Continue/Calculate; errors
remain field-addressable, summarized in an alert, and focus moves to the first
invalid field. Final authority is the domain schema and config bounds. The UI
communicates that urgency affects commercial availability pricing but does not
guarantee a shorter schedule, and distinguishes risk exposure from scope
complexity.

The domain remains authoritative for dependencies: ecommerce project type,
accounts, membership, and subscriptions normalize their required feature
dependencies. API count fields are disclosed only after API work is selected;
the first third-party count defaults to one for a quicker mobile flow. Disabling
API work clears both API counts so hidden stale values cannot affect results.

## Final cleanup

Working Draft and desktop progress statuses now share one positional rule: only
steps before the active step are complete, the active step is current, and all
later steps are upcoming. This remains true when someone returns from Review to
edit an earlier section; saved later values do not alter the visible workflow
status. Review is included as the seventh Working Draft step.

Review output uses centralized presentation helpers for design, content,
delivery, contingency, and risk values, so stored enum values are not shown to
users. Single integrations use their plain names while counts greater than one
remain visible. Public builder and result copy no longer mentions internal
storage units, engine terminology, or development phases. Optional text and
numeric overrides are labelled `(optional)`; other inputs are checked when the
user continues, without repeated required-field asterisks.

## Persistence envelope and reset

The local-first adapter uses:

- `webquote.active-draft.v1`
- `webquote.latest-result.v1`

Each envelope has `storageVersion: 1`, payload, `createdAt`, and `updatedAt`
metadata. The deterministic `QuoteResultV1` is not timestamped. Draft writes
are debounced by 250 ms after meaningful state changes. Restored payloads are
strictly parsed; corruption and unsupported versions recover to a fresh draft
with an explanatory notice and are never silently reinterpreted. The latest
result is validated at restore, including the domain-normalized input boundary.
If browser storage is unavailable, calculation still completes through a
current-session result handoff. Start a new quote requires confirmation before
clearing meaningful draft/result data.

## Phase 5 handoff

Successful Review submission maps and validates the full input, calls the
existing deterministic `calculateQuote`, persists `QuoteResultV1`, and routes
to `/quote/result`. That route intentionally renders only a calculation-complete
handoff notice and recovery links. It does not render a planning range, scope
breakdown, commercial output editor, client summary, or PDF.

## Accessibility and responsive checks

The flow preserves semantic headings, fieldsets/legends, native inputs, labels,
descriptions, `aria-describedby` error relationships, alert summaries, focus
management, skip navigation, progress semantics, and reduced-motion tokens from
Phase 3. The mobile progress bar remains available below the desktop stepper;
the form becomes one column and keeps actions reachable.

Manual browser review covered the builder and handoff at:

- 1440×900
- 1280×800
- 1024×768
- 768×1024
- 390×844
- 320×700

Checks included every step, API disclosure, error state, review, refresh/restore,
reset, calculation handoff, no horizontal overflow, and browser console output.

## Automated evidence

Unit/component coverage includes mapping, integer money and percentage parsing,
reducer navigation/completion/reset/design updates, conditional API behavior,
versioned persistence, corruption/unsupported storage, normalized-result
round-trip, validation focus, and calculation integration. Playwright covers:

1. product shell to quote workspace;
2. 320px shell overflow;
3. desktop keyboard focus;
4. recoverable 404;
5. simple landing-page calculation handoff;
6. business quote back/forward preservation;
7. ecommerce dependency/API disclosure and handoff;
8. incomplete-step validation/focus;
9. refresh restore and reset;
10. 390px Project, Commercial terms, and Review usability;
11. 320px Project, Commercial terms, and Review usability.

## Final command results

- `npm run check` — passed: format check, lint (0 errors / 0 warnings), strict typecheck, 21 Vitest files / 172 tests, 7 domain files / 128 tests, production build.
- `npm run test:e2e` — passed: 11 Playwright scenarios.
- `npm audit --audit-level=high` — passed: 0 vulnerabilities.
- `git diff --check` — passed with no output.

Domain coverage from `npm run test:domain`: 99.39% statements, 97.92%
branches, 100% functions, and 99.58% lines.

Production-browser visual evidence covered both `/` and `/quote` at 1440×900,
1280×800, 1024×768, 768×1024, 390×844, and 320×700. All twelve route/viewport
checks reported no horizontal overflow. The final production Playwright
console check reported 0 errors and 0 warnings. The dev-only Fast Refresh
session briefly emitted a Next/React hot-reload warning while files were
changing; it did not reproduce in the production browser or E2E run.

No dependency was added and no pricing-domain formula or calibration file was
changed.
