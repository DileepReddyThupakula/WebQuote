# WebQuote Implementation Plan

Status: Revised phased plan after approved planning checkpoint

## Pre-implementation stop

Do not initialize the application until these revised planning documents have been summarized and the user explicitly authorizes implementation.

Operating rules after authorization:

- Complete phases in the approved order below unless the user approves a plan change.
- A phase is complete only when its acceptance criteria and corresponding `QUALITY_GATES.md` checks pass.
- Keep formulas and calibration data out of interface code from the first implementation commit.
- Use one authoritative validated `PricingConfigV1`; do not scatter quote-altering constants.
- Keep complexity effort and risk contingency separate throughout domain, interface, and tests.
- No phase may silently add V1 non-goals.

## Phase 1 — Engineering foundation

Status: **Complete — 2026-09-26.** Evidence is recorded in `docs/phase-1-evidence.md`.

### Work

- Initialize a Next.js App Router TypeScript application using mutually compatible stable versions.
- Add Tailwind CSS, Zod, Vitest, Playwright, formatting/lint tooling, and focused DOM test tooling.
- Enable strict TypeScript and deterministic scripts.
- Create route shells for `/`, `/quote`, `/quote/result`, plus error/404 surfaces.
- Establish Server/Client boundaries, global tokens, font pipeline, metadata base, accessible skip link, and initial README.
- Define empty interfaces/directories only where needed for the quote domain, client document, and exporter boundaries.
- Confirm that the client-document/export interfaces preserve A4 default and US Letter extensibility without selecting a renderer prematurely. Renderer evaluation remains in Phase 6 unless a foundation constraint makes it necessary.

### Acceptance criteria

- Fresh install and documented setup work.
- Route shells render without console errors.
- Formatting, lint, strict typecheck, smoke test, and production build pass.
- The PDF boundary is documented; no renderer dependency is needed or selected in this phase.
- No database, authentication, paid API, fake product data, or unfinished marketing UI is present.

## Phase 2 — Pricing domain and exhaustive tests

Status: **Complete — 2026-09-26.** Domain coverage, fixture ledgers, static
gates, production build, and Playwright smoke evidence are recorded for this
phase. Phase 3 remains out of scope.

### Work

- Implement branded money, basis-point, and quarter-hour primitives.
- Implement `PricingConfigV1` schema, immutable config registry, approved V1 calibration object, and config identity/version handling.
- Implement input schemas, dependency normalization, and distinct complexity/risk domain concepts.
- Implement low/expected/high effort, complexity-added effort, testing/project overhead, risk contingency, price, urgency, rounding, timeline, revisions, change orders, maintenance, and milestones.
- Implement structured scope, exclusions, warnings, and the complete explanation/price ledger.
- Add approved simple/typical/complex fixtures, boundary matrices, monotonicity/invariant tests, and historical-config compatibility tests.
- Generate or maintain `docs/pricing-model.md` from the shipped authoritative config so every parameter is documented.

### Acceptance criteria

- The domain module imports no React, Next.js, browser, storage, or export-renderer code.
- Quote-altering business constants exist only in validated versioned configuration.
- Identical input plus config identity produces identical results.
- Risk changes contingency but not complexity score/effort in V1.
- Changing the expected-effort calibration in a test config requires no engine-code change.
- Historical stored results remain renderable after a newer config becomes active.
- Every fixture reconciles exactly through the price ledger.
- All domain gates and coverage thresholds pass.

## Phase 3 — Design system and product shell

Status: **Complete — 2026-09-26.** Component, responsive, keyboard, and visual
evidence are recorded in `docs/phase-3-evidence.md`. Phase 4 remains out of
scope.

### Work

- Implement approved tokens, typography, layout primitives, controls, form/error patterns, notices, disclosures, dialogs, and result data patterns.
- Implement focused product navigation/header for quote flows, not the final marketing landing page.
- Build accessible loading, empty, error, and unsupported-browser primitives.
- Implement responsive shells for builder, results, client preview, and future PDF-export controls.
- Establish the PDF visual specification as reusable document tokens without coupling it to web CSS/DOM.

### Acceptance criteria

- Component states cover hover, focus-visible, active, disabled, busy, error, and success.
- Keyboard, reduced-motion, contrast, zoom, and touch-target checks pass.
- Product shells pass 320, 375, 768, 1024, and 1440 px reviews.
- No gradients, glow, glass, fake proof, excessive cards, or dead controls appear.
- The system supports real builder/results content without layout-specific hacks.

Phase 3 does not include builder state, pricing calculations, PDF export, or a
final marketing landing page. The `/quote` route is an intentionally neutral
workspace shell with no fabricated quote values or interactive workflow fields.

## Phase 4 — Guided quote builder

Status: **Complete — 2026-09-27.** Builder architecture, persistence, manual
viewport review, automated coverage, and command results are recorded in
`docs/phase-4-evidence.md`. Phase 5 remains out of scope.

### Work

- Implement the seven-step reducer/state model and progressive disclosure.
- Implement step/complete Zod validation, error summary, dependencies, review screen, and calculation handoff.
- Add versioned draft storage adapter, debounce/flush behavior, restore, start-over, and storage-failure state.
- Implement keyboard/focus behavior and narrow-screen actions.
- Ensure hidden dependent data cannot silently affect results.

Implemented as a native reducer/client-island flow. The final action calculates
the existing `QuoteResultV1`, stores it locally, and routes to the intentional
Phase 5 handoff boundary; it does not render commercial results or export a PDF.

### Acceptance criteria

- Every supported project type completes without irrelevant required fields.
- Back/forward navigation preserves valid entries.
- Validation is inline, summarized, and keyboard/screen-reader navigable.
- Refresh restores a valid draft; malformed/unsupported storage never crashes the app.
- Storage denial does not prevent quote calculation.
- The full builder works at 320 px and keyboard only.

## Phase 5 — Results, scope, overrides, and commercial terms

Status: **Complete — 2026-10-08.** Final verification and the accepted
development-tooling audit exception are recorded in
`docs/phase-5-evidence.md`. Phase 6 has not begun.

### Work

- Implement result hierarchy, low/expected/high effort, recommended range, minimum safe price, timeline, and separate complexity/risk presentation.
- Render the price ledger: expected direct effort, complexity effort, project overhead, contingency, hourly cost basis, margin, safe-floor adjustment, urgency, and rounding.
- Implement scope/exclusions, revision/change-order pricing, payments, maintenance, and support terms.
- Implement immutable calculated result plus separate commercial override layer, reset, below-floor warning, milestone reconciliation, and stale-override handling.
- Implement `ClientQuoteDocumentV1`, accessible preview, optional notes, amount/range presentation, and plain-text copy/fallback.
- Persist/restore latest result and overrides with schema/config identities.

### Acceptance criteria

- Displayed totals reconcile with the domain ledger.
- Complexity and risk are explained separately.
- Internal assumptions are available to the user but excluded from the client document by default.
- Every editable value is marked custom and can be restored.
- Below-floor overrides warn without blocking.
- Milestones cannot be published unless they total 100%.
- Clipboard success and denied/unavailable fallback are tested.
- Recalculation cannot silently carry stale overrides or reinterpret an old config result.

## Phase 6 — Professional PDF export

### Work

- Implement the chosen client-side `QuoteExporter` adapter and restrained WebQuote PDF template.
- Render only from validated `ClientQuoteDocumentV1`; do not inspect/rasterize the results DOM.
- Include header/date, optional identifiers, project type, amount/range, scope, exclusions, timeline, milestones, revisions, change-request pricing, maintenance/support, and optional notes.
- Add an explicit per-export “Include calculation details” option, off by default, limited to the approved client-readable explanation.
- Bundle/embed required fonts and currency glyphs; implement deterministic pagination, page header/footer, page numbering, sanitized filename, Blob download, busy state, retry, and fallback.
- Keep custom logos, branding, templates, cloud storage, and paid controls out of V1.

### Acceptance criteria

- Simple, typical, and complex fixtures generate valid PDFs locally with no network upload.
- Extracted text contains every required client section and no internal pricing detail by default.
- Enabling details adds only the approved explanation, never raw config/debug data.
- Rendered A4 pages show no clipping, overlap, orphaned headings, broken tables, missing glyphs, or unreadable page breaks.
- PDF title/author/subject/language metadata, selectable text, logical reading order, contrast, and print legibility meet the defined V1 accessibility baseline.
- Export failure preserves the quote and permits retry/copy.
- The PDF renderer is absent from initial-route bundles and loaded only on export.

## Phase 7 — Landing page using the real product UI

### Work

- Build the approved hero, benefits, process explanation, and CTAs after builder/results/PDF UI is stable.
- Demonstrate actual product components and an engine-generated labelled fixture rather than a separately mocked dashboard.
- Use real screenshots/rendered components derived from the mature product where appropriate.
- Implement responsive header/navigation and footer with only real destinations.

### Acceptance criteria

- “Build a quote” reaches the builder; “See how it works” reaches/focuses the process section.
- The preview uses the active engine fixture and real product visual language.
- No fake customer data, logos, testimonials, metrics, or dead future-feature controls exist.
- Landing accessibility, responsive, content-integrity, and performance checks pass.

## Phase 8 — SEO/public calculator architecture, privacy, resilience, and performance

### Work

- Finalize title templates, canonical handling, OG asset, sitemap, robots, and factual structured data.
- Keep `/quote` and `/quote/result` noindex and out of sitemap.
- Define the shared route/domain architecture for future public calculators without building thin keyword pages.
- Complete error/empty states, local-data notice, clear-data flow, storage/version recovery, and privacy copy.
- Add and verify security headers/CSP where supported.
- Audit client boundaries, dynamic PDF loading, bundles, fonts, images, layout shifts, and unnecessary dependencies.

### Acceptance criteria

- Public metadata and canonical URLs validate.
- Personalized routes and client data are absent from search indexes, URLs, logs, and third-party requests.
- Future calculator architecture reuses the same domain/config model and contains no forked formulas.
- Error and empty states have clear recovery paths.
- Landing and product routes meet agreed performance gates; PDF code does not penalize initial load.

## Phase 9 — Full release qualification

### Work

- Run the complete static, unit, component, build, E2E, accessibility, responsive, visual, link, console, storage, PDF, SEO, privacy, security, and performance gates.
- Manually reconcile and inspect simple, typical, and complex quotes plus their PDFs.
- Test all supported currencies and browser families.
- Reconcile README, architecture, pricing/config documentation, limitations, and release checklist with shipped behavior.
- Produce release evidence with commands, totals, browsers, viewports, PDF inspections, and known issues.

### Acceptance criteria

- Every mandatory gate in `QUALITY_GATES.md` passes or has an explicitly approved waiver.
- No P0/P1 defects or unresolved calculation, PDF-confidentiality, data-loss, accessibility-blocker, broken-control, or privacy defects remain.
- A clean checkout can be installed, tested, built, and run from the README.
- Final evidence covers real mobile/desktop UI and rendered PDFs, not static inspection alone.

## Deferred work requiring separate approval

- Accounts, database persistence, and multi-quote cloud history.
- Shareable quote links and email delivery.
- Custom PDF branding, uploaded logos, additional templates, and cloud PDF storage.
- Pro billing and subscription features.
- Client acceptance, e-signatures, invoicing, and CRM.
- Additional public SEO calculators beyond the shared architecture.

Each deferred phase requires a product/privacy/security update rather than being partially exposed in launch V1.
