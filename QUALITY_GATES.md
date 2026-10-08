# WebQuote Quality Gates

Status: Revised measurable gates after the approved planning checkpoint

## 1. Gate policy

- A phase is not complete because code exists or a page looks plausible.
- Run the relevant checks from a clean documented environment and report exact commands and totals.
- Do not suppress rules, weaken assertions, lower thresholds, or mark tests skipped to pass a gate without written justification and approval.
- Any formula/configuration change reruns all pricing-engine tests and representative fixtures.
- Any shared UI change reruns narrow/mobile and keyboard smoke flows.
- Release evidence distinguishes automated pass, manual inspection, and unverified claims.

Severity:

- **P0:** data exposure/loss, unusable release, materially wrong quote math.
- **P1:** blocked primary flow, inaccessible primary action, incorrect commercial output, leaked internal details in a default PDF, or broken persistence/copy/PDF export with no fallback.
- **P2:** significant but recoverable UX, content, responsive, or secondary-flow defect.
- **P3:** minor polish issue with no task obstruction.

Release requires zero open P0/P1 issues. P2 waivers require explicit owner, reason, and follow-up.

## 2. Phase exit gates

Every phase runs format, lint, strict typecheck, relevant tests, and production build after Phase 1 establishes those commands.

| Phase | Additional required exit evidence |
|---|---|
| 1 — Engineering foundation | route/build smoke, Server/Client boundary review, documented PDF-renderer evaluation |
| 2 — Pricing domain | exhaustive domain suites, coverage, fixture ledgers, config validation/versioning/history checks |
| 3 — Design system/product shell | component states, keyboard/accessibility baseline, responsive visual review |
| 4 — Builder | validation/dependency/storage suites, builder E2E, mobile and keyboard completion |
| 5 — Results/commercial terms | ledger reconciliation, override/client-document/copy tests, complexity-risk separation evidence |
| 6 — PDF export | structure/text/confidentiality tests, browser exports, rendered-page inspection, dynamic-bundle check |
| 7 — Landing page | real-product fixture proof, CTA/link/SEO/accessibility/responsive/performance checks |
| 8 — SEO/privacy/resilience/performance | metadata/robots/sitemap, privacy/storage/security, bundle and performance evidence |
| 9 — Release qualification | complete cross-browser E2E, accessibility, visual, PDF, pricing, documentation, and release evidence |

Phase 1 status: **Passed on 2026-09-26.** Exact commands, totals, browser checks, the Turbopack/Webpack finding, and limitations are recorded in `docs/phase-1-evidence.md`. Later-phase gates remain pending and must not be inferred from the Phase 1 pass.

Phase 2 status: **Passed on 2026-09-26.** Pricing-domain command results,
coverage, fixture-ledger evidence, configuration/history checks, Playwright
smoke result, and audit result are recorded in `docs/phase-2-evidence.md`.
Phase 3 status: **Passed on 2026-09-26.** Component tests, shell E2E coverage,
keyboard and viewport checks, rendered visual review, and command results are
recorded in `docs/phase-3-evidence.md`. Phase 4 status: **Passed on
2026-09-27.** Guided-builder unit/component coverage, ten Playwright scenarios,
required viewport inspection, persistence/handoff evidence, and command results
are recorded in `docs/phase-4-evidence.md`. Phase 5 and later gates remain
pending.

## 3. Static and build gates

Required commands will be finalized in `package.json`; expected categories are:

- formatter check;
- ESLint with zero warnings;
- strict TypeScript check with no emit;
- unit/component test run;
- production Next.js build; and
- Playwright test run.

Pass criteria:

- zero TypeScript errors;
- zero ESLint errors and warnings;
- zero unhandled promise rejections;
- production build exit code 0;
- no unexpected dynamic-rendering, metadata, or bundle warnings; and
- no committed generated test artifacts unless intentionally configured.

## 4. Pricing-engine gates

### 4.1 Required suites

- schema acceptance/rejection for every field and dependency;
- normalization and auto-added feature dependencies;
- money, basis-point, quarter-hour, division, and commercial-rounding helpers;
- each effort catalogue category;
- authoritative config schema/registry, duplicate identity rejection, and every documented parameter;
- expected-effort calibration positions and configuration-only changes;
- complexity score boundaries and proof that risk does not change complexity in V1;
- testing, PM, risk contingency, price, rush, timeline, revision, change-order, maintenance, and milestone formulas;
- deterministic scope/exclusion generation;
- explanation-to-line-item traceability;
- simple, typical, and complex approved fixtures;
- all edge cases in `PRICING_ENGINE_SPEC.md`; and
- historical-result behavior across config versions; and
- all 15 required invariants.

### 4.2 Coverage

- `src/domain/quote`: at least 95% statements, branches, functions, and lines.
- Money/rounding/formula orchestration modules: 100% branches and lines.
- Overall tested application code: at least 80% statements/lines, treated as a backstop rather than a substitute for behavior coverage.

Any ignored line requires a reason in code. Generated types and unreachable exhaustive guards may be excluded deliberately.

### 4.3 Reconciliation

For each approved fixture, store an expected ledger showing:

- input snapshot plus model/config identities;
- every low/expected/high effort line;
- complexity-added effort, testing, PM, and separately calculated risk contingency;
- hourly-value basis, target-margin adjustment, safe-floor adjustment, urgency, and rounding delta;
- unrounded/rounded minimum, range, recommendation, and rush fee;
- timeline;
- revisions/change orders;
- maintenance; and
- milestones.

The sum of ledger lines and displayed totals must reconcile exactly under documented rounding. Snapshot-only assertions are insufficient; critical formulas require explicit expectations.

## 5. Functional E2E gates

Required Playwright scenarios:

1. Landing primary CTA → complete a typical quote → result.
2. “See how it works” reaches the process section and gives it focus/meaningful reading position.
3. Simple landing-page quote in each currency.
4. Complex web-app/ecommerce inputs reveal dependencies and warnings.
5. Back/forward step navigation preserves input.
6. Invalid fields show accessible summary and retain valid data.
7. Refresh restores a draft at the correct safe step.
8. Malformed and unsupported-version storage produces recovery, not a crash.
9. Storage unavailable still permits calculation.
10. Empty `/quote/result` shows a useful empty state.
11. Result breakdown reconciles with the tested fixture.
12. Commercial override is labelled; reset restores calculated value.
13. Below-safe override shows a warning.
14. Milestone edit requires a 100% total and updates amounts.
15. Recalculation invalidates stale overrides with notice.
16. Copy succeeds when permitted.
17. Clipboard denied/unavailable shows selectable manual fallback.
18. Default PDF export downloads a valid file and excludes all internal pricing details.
19. Explicitly enabling calculation details includes only the approved client-readable explanation.
20. A complex quote exports across multiple pages with all required sections and currency glyphs.
21. PDF-renderer/download failure preserves the quote and exposes retry plus copy fallback.
22. Start-over confirmation preserves data on cancel and clears it on confirm.
23. 404 provides working navigation.
24. Keyboard-only landing → builder → result → copy/PDF controls.

Every E2E test fails on unexpected page errors, browser console errors, or failed same-origin requests. Known benign browser messages must be narrowly filtered with a documented reason.

## 6. Accessibility gates

Target: WCAG 2.2 AA.

Automated checks run on:

- landing page;
- every builder step including validation errors and conditional fields;
- result overview;
- expanded calculation detail;
- edit/override state;
- client summary; and
- empty/error/404 states.

Automated critical/serious violations: zero.

Manual checks:

- skip link and landmarks;
- one H1 and logical heading order;
- visible focus and sensible tab order;
- fieldset/legend and label/description/error associations;
- focus movement on step change and validation failure;
- keyboard operation for disclosures, dialogs, copy fallback, and all choices;
- Escape/restore-focus behavior for dialog/mobile navigation;
- screen-reader announcement for calculation, save, copy, and errors without chatter;
- color contrast and non-color state cues;
- 200% zoom and text spacing override;
- reduced motion;
- 44 × 44 px touch targets; and
- no inaccessible custom control where native HTML would work.

Manual evidence identifies browser, OS, viewport, input method, and assistive technology used. At least VoiceOver/Safari on macOS or iOS is required before release, plus one Chromium keyboard pass.

## 7. Responsive and visual gates

Review these widths for landing, every builder step, result top/breakdown/client summary, errors, and dialogs:

- 320 × 568;
- 375 × 812;
- 768 × 1024;
- 1024 × 768; and
- 1440 × 900.

Pass criteria:

- no unintentional horizontal scroll;
- no clipped currencies, progress, errors, tables, or action labels;
- no sticky element covering content or focused controls;
- sensible reading order when columns stack;
- line lengths remain readable;
- long translated-like labels and large currency values do not break layout;
- virtual-keyboard/mobile focus does not hide the active control;
- hover is never required; and
- no visible layout shift from fonts or client-state hydration.

Visual review also checks adherence to `DESIGN_SYSTEM.md`: no gradients/glow/glass, excessive cards/radii/shadows, fake proof, meaningless decoration, or unapproved secondary accent.

## 8. PDF export gates

Test at least simple, typical, and complex/multi-page fixtures in INR, USD, GBP, and EUR across the supported browser engines.

Automated structural checks:

- output is a valid parseable PDF with at least one page and expected A4 dimensions;
- title, author, subject, language, creation date, and stable document identifier metadata are present as specified;
- text is selectable/extractable and required section headings/content match `ClientQuoteDocumentV1`;
- default exports contain no hourly value, margin, minimum safe price, internal effort ledger, risk math, config identifiers, or debug data;
- `includeCalculationDetails = true` adds only the approved client-readable explanation;
- all required project/client identifiers, amount/range, scope, exclusions, timeline, milestones, revision, change-request, maintenance/support, and notes fields appear when populated;
- INR/USD/GBP/EUR glyphs survive generation and extraction;
- filename is sanitized and no quote/client data is uploaded or placed in URLs/local storage as PDF bytes;
- errors return typed recoverable outcomes and never corrupt the saved quote; and
- the PDF implementation is dynamically loaded and absent from initial landing/builder/result bundles.

Visual checks:

- render every page of the latest representative PDFs to images and inspect at readable resolution;
- no clipped/overlapping text, black squares, missing glyphs, broken tables, isolated headings, empty trailing pages, or unreadably dense sections;
- header/footer/page numbering and cross-page section transitions are consistent;
- long identifiers, large currency values, long scope lines, and optional notes wrap safely;
- contrast and type size remain legible in print and grayscale; and
- default and details-enabled exports visibly match their approved preview/content policy.

Accessibility baseline:

- logical content order, selectable text, document title/language metadata, meaningful headings/table labels where supported, descriptive links, and sufficient contrast;
- the accessible HTML preview remains available as an equivalent source;
- formal PDF/UA conformance is reported separately and cannot be claimed unless verified by an appropriate checker and assistive-technology review.

## 9. Content and commercial-integrity gates

- Every price is labelled as an estimate/planning range.
- No market-price, savings, customer, usage, or performance claim lacks evidence.
- Client location has no undisclosed multiplier.
- “Margin” is explained as gross margin, not markup.
- “Page” and “revision round” are defined.
- Rush fee, third-party costs, maintenance, post-launch support, and exclusions are unambiguous.
- Internal hourly value, margin, contingency, safe floor, and effort ledger are absent from client copy by default.
- The same internal values are absent from default PDF exports; inclusion requires explicit per-export selection.
- Client copy reflects selected scope and excludes unselected services.
- No Lorem Ipsum, TODO copy, placeholder customer names, dead “Coming soon” controls, or fake testimonials/logos.
- Grammar, pluralization, currency symbols, ranges, and milestone totals are correct.

## 10. Persistence, privacy, and security gates

- Stored draft/result/override envelopes are versioned and schema validated.
- Corrupt, oversized, missing, or unsupported data cannot execute code or crash the route.
- User text is rendered as text, never injected HTML.
- Clear-data action removes both approved V1 keys and confirms completion.
- No project/client inputs appear in query strings, request logs, telemetry, or third-party calls.
- PDF bytes and client-document content never leave the browser in launch V1.
- No secrets or private keys are present in the client bundle/repository.
- No third-party tracking scripts ship in V1.
- Security headers/CSP are tested against required app behavior and documented.
- Dependency audit has no unresolved high/critical production vulnerability, or any exception is explicitly assessed and approved.
- Local-storage privacy notice is visible before/when client-identifying text is stored.

## 11. SEO and link gates

- Unique factual title/description on `/`.
- Correct title template and canonical production URL.
- Valid Open Graph/Twitter image metadata.
- `robots` and `sitemap` return successfully and include only intended public routes.
- `/quote` and `/quote/result` are noindex and excluded from sitemap.
- Legitimate structured data validates with no fabricated rating/offer/customer fields.
- Semantic crawlable landing content exists without client JavaScript.
- All internal links and fragment targets resolve.
- No empty `href`, `#` placeholder, or button disguised as a link.
- 404 returns the correct HTTP behavior in production build.

## 12. Performance gates

Run against a production build, not the development server.

Landing mobile Lighthouse targets:

- Performance ≥ 90;
- Accessibility = 100;
- Best Practices ≥ 95;
- SEO = 100.

Lab experience targets at tested mobile conditions:

- LCP ≤ 2.5 s;
- CLS ≤ 0.10;
- no long main-thread task caused by unnecessary app JavaScript;
- no render-blocking third-party assets; and
- font loading causes no material layout shift.

Builder/result targets:

- route shell appears promptly;
- step changes and synchronous calculation respond without perceptible artificial delay;
- local persistence is debounced and does not block typing;
- PDF dependencies are loaded only after export intent and do not affect initial-route bundle/performance budgets;
- large dependencies are justified; and
- only interactive islands ship client JavaScript.

Record tool version, URL, run mode, and median of at least three Lighthouse runs for release evidence. Treat lab values as evidence, not guaranteed field Core Web Vitals.

## 13. Browser gates

Automated release tests:

- current Playwright Chromium;
- current Playwright WebKit; and
- current Playwright Firefox for primary flows.

Manual smoke:

- current stable Chrome or Edge;
- current stable Safari on macOS; and
- one real or faithfully emulated narrow touch viewport.

Clipboard, local-storage, and PDF-download fallbacks are specifically checked in at least one browser that denies/limits them. At least one representative PDF is generated and parsed from each Playwright browser engine.

## 14. Documentation gates

Before release:

- README contains prerequisites, install, dev, test, build, and run commands;
- README states no account/database/paid API is required;
- architecture matches actual folders and boundaries;
- pricing documentation matches exact active config/model version;
- all environment variables are documented by name and purpose, with no secrets committed;
- limitations include local-only data, no market-rate guarantee, basic WebQuote-branded PDF only, and no tax/legal advice;
- PDF renderer choice, license, document contract, metadata, confidentiality default, page size, and verification commands are documented;
- release checklist records commands, totals, browsers, viewports, PDF fixtures/render inspections, Lighthouse results, accessibility method, and known issues.

## 15. Final release decision

A release candidate is ready only when:

1. all mandatory automated commands pass from a clean checkout;
2. all 24 E2E scenarios pass in the required browser matrix or have an approved browser-specific exception;
3. calculation ledgers reconcile for all approved fixtures;
4. automated accessibility reports zero critical/serious violations and manual checks pass;
5. mobile, desktop, and rendered-PDF visual review passes;
6. no P0/P1 defects remain;
7. SEO, privacy, storage, copy, PDF, link, console, and performance gates pass; and
8. documentation and evidence reflect the exact build being approved.

If a gate is not run, report it as **not verified**, never as passed.

