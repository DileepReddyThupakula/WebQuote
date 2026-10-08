# WebQuote Architecture

Status: Phase 5 results and commercial terms implemented on `phase-5-results`; Phase 6 PDF export deferred

## 1. Architectural goals

- Keep pricing deterministic, framework-independent, and easy to test.
- Ship the full useful flow without a server database, account, or paid API.
- Keep the public landing content server rendered and crawlable.
- Keep browser-only state limited to the interactive product surface.
- Version every calculation and calibration assumption so future changes cannot silently reinterpret old quotes.
- Generate a professional launch PDF locally from a renderer-neutral client quote document.
- Leave clean seams for future accounts, cloud persistence, branded PDF templates, and server-side export without building those systems now.

## 2. Runtime topology

V1 is a single Next.js App Router application. The diagram below is the target
launch topology; Phase 5 implements the local guided builder, results workspace,
commercial overrides, client document, and clipboard fallback. PDF export remains deferred.

```text
Browser
  ├─ Server-rendered landing and route shells
  ├─ Client-side builder state and validation feedback
  ├─ Pure pricing engine executed locally
  ├─ Versioned localStorage draft/latest result
  ├─ Clipboard integration with manual fallback
  └─ Lazily loaded client-side PDF exporter and browser download

Next.js host
  ├─ Static/server-rendered route output
  ├─ Metadata, sitemap, robots, icons and OG image
  └─ No V1 database, authentication, server mutation, or internal API
```

The pure engine is safe to run in the browser because it contains no secret rates or proprietary remote data. Phase 4 calls the same domain function locally after authoritative validation; a future server environment can call it without changing the domain contract.

## 3. Routes and rendering

| Route | Role | Rendering | Indexing |
|---|---|---|---|
| `/` | Landing and process demonstration | Server Component-first | index, canonical |
| `/quote` | Guided builder | Server page shell + client builder island | noindex |
| `/quote/result` | Results, commercial terms, and client preview | Server page shell + client results island | noindex |
| not-found | Recoverable 404 | Server UI | noindex behavior via status |

`/` remains a restrained product introduction and `/quote` is a server-rendered
shell around the client-only guided builder. `/quote/result` restores and
validates the latest local result, then renders the Phase 5 workspace or a
recoverable empty/corrupt state. Builder and result routes never encode client
information into query strings.

### Phase 4 implemented subset

```text
src/
├── app/quote/
│   ├── page.tsx
│   └── result/page.tsx
├── components/quote-builder/
│   ├── quote-builder.tsx
│   └── result-handoff.tsx
└── features/quote-builder/
    ├── defaults.ts
    ├── mapping.ts
    ├── persistence.ts
    ├── reducer.ts
    ├── steps.ts
    ├── types.ts
    └── validation.ts
```

The draft remains UI-friendly and incomplete until mapping. `mapping.ts` is the
only conversion boundary into `QuoteInputV1`; it uses integer minor units and
basis points, then calls the domain parser. `reducer.ts` owns navigation and
completion state. `persistence.ts` owns versioned local envelopes, corruption
recovery, and the latest-result handoff. No pricing formula or calibration value
is duplicated in the builder.

### Phase 5 implemented subset

`features/quote-results/result-schema.ts` validates complete stored results and
checks ledger invariants. `quote-builder/persistence.ts` writes result-envelope
version 2 with deterministic result and config identities, while reading
validated version 1 envelopes for compatibility. Historical valid results render
from their stored ledger without recalculation. `features/quote-results/overrides.ts`
validates a separate versioned commercial layer bound to the result identity.
Changed inputs or config identity reset stale overrides with an explicit notice.
`features/client-summary/document.ts` constructs `ClientQuoteDocumentV1` from
the result plus approved overrides; the HTML preview and plain-text copy consume
this document. No PDF adapter is implemented in Phase 5.

Use route-level `loading.tsx` only where navigation can honestly wait. Use `error.tsx` as a Client Component for recoverable route failures and `global-error.tsx` only for root-layout failure. Do not simulate loading for a synchronous calculation.

## 4. Target V1 folder structure

```text
.
├── AGENTS.md
├── PRODUCT_SPEC.md
├── ARCHITECTURE.md
├── DESIGN_SYSTEM.md
├── PRICING_ENGINE_SPEC.md
├── IMPLEMENTATION_PLAN.md
├── QUALITY_GATES.md
├── README.md
├── public/
│   └── brand/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   └── page.tsx
│   │   ├── quote/
│   │   │   ├── page.tsx
│   │   │   └── result/page.tsx
│   │   ├── error.tsx
│   │   ├── global-error.tsx
│   │   ├── not-found.tsx
│   │   ├── layout.tsx
│   │   ├── manifest.ts
│   │   ├── robots.ts
│   │   ├── sitemap.ts
│   │   └── opengraph-image.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── marketing/
│   │   ├── builder/
│   │   └── results/
│   ├── domain/
│   │   └── quote/
│   │       ├── config/
│   │       │   ├── schema.ts
│   │       │   ├── registry.ts
│   │       │   └── v1.ts
│   │       ├── calculate.ts
│   │       ├── change-orders.ts
│   │       ├── complexity.ts
│   │       ├── explain.ts
│   │       ├── maintenance.ts
│   │       ├── milestones.ts
│   │       ├── money.ts
│   │       ├── normalization.ts
│   │       ├── rounding.ts
│   │       ├── schema.ts
│   │       ├── scope.ts
│   │       └── types.ts
│   ├── features/
│   │   ├── quote-builder/
│   │   │   ├── state/
│   │   │   ├── steps/
│   │   │   └── validation/
│   │   ├── quote-results/
│   │   │   ├── overrides/
│   │   │   └── presentation/
│   │   ├── client-summary/
│   │   │   ├── document.ts
│   │   │   ├── plain-text.ts
│   │   │   └── schema.ts
│   │   └── quote-export/
│   │       ├── exporter.ts
│   │       ├── options.ts
│   │       └── pdf-template.ts
│   ├── infrastructure/
│   │   ├── clipboard/
│   │   ├── pdf/
│   │   └── storage/
│   ├── lib/
│   │   ├── env.ts
│   │   └── seo.ts
│   └── styles/
│       └── globals.css
├── tests/
│   ├── unit/domain/quote/
│   ├── component/
│   ├── export/
│   ├── fixtures/quotes/
│   └── e2e/
└── docs/
    ├── pricing-model.md
    └── release-checklist.md
```

Exact generated configuration filenames depend on the stable toolchain selected during initialization. Do not create folders merely to match the diagram; create them when they own a real module.

### Phase 1 implemented subset

```text
src/
├── app/
│   ├── quote/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── error.tsx
│   ├── global-error.tsx
│   ├── icon.svg
│   ├── layout.tsx
│   ├── not-found.tsx
│   ├── page.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── layout/
│   ├── ui/
│   └── site-header.tsx
├── lib/
│   ├── classes.ts
│   └── site.ts
├── styles/globals.css
└── test/setup.ts

tests/e2e/shell.spec.ts
```

`domain`, client-document/export model, and PDF exporter remain outside the Phase 4 implementation. The guided builder now owns real state, mapping, validation, persistence, and the minimal result handoff.

### Phase 3 implemented subset

At the Phase 3 boundary, the shared shell included the product header, responsive layout primitives,
semantic progress stepper, form-field primitives, notices, native disclosure
content, recoverable status panels, and data-only financial presentation
primitives. Those components contained no builder reducer, storage adapter,
pricing calculation, or PDF renderer. Phase 4 composes them around the real
client builder described below.

## 5. Domain boundaries

### 5.1 `domain/quote`

Owns:

- input and output types;
- Zod schemas for canonical domain data;
- normalization and dependency rules;
- the authoritative typed/versioned pricing configuration and registry;
- money, hours, percentages, and rounding;
- effort, complexity, pricing, timeline, revisions, maintenance, and milestones;
- scope/exclusion generation; and
- explanation records.

It imports no React, Next.js, Web APIs, browser storage, or formatted UI strings that depend on locale. Functions accept data and return serializable data.

### 5.2 `features/quote-builder`

Owns the seven-step graph, visible conditional questions, draft reducer,
field-level errors, progress, local persistence adapter, review summaries, and
translation between form values and canonical engine input. It can call domain
schemas and calculation entry points but cannot contain pricing formulas or
dependency normalization.

### 5.3 `features/quote-results`

Owns presentation, commercial overrides, comparison with calculated values, warning states, and output editing. Overrides are a separate object layered on an immutable engine result.

### 5.4 `features/client-summary`

Owns the transformation from calculated result plus overrides into `ClientQuoteDocumentV1`, HTML preview sections, and plain text. The document is presentation-neutral and excludes internal costing unless an explicit, validated export option requests the approved client-readable calculation explanation.

### 5.5 `features/quote-export`

Owns export options, filename generation, the `QuoteExporter` port, and orchestration of document-to-file conversion. It accepts `ClientQuoteDocumentV1`; it cannot read result-page DOM, local storage, or raw engine state. Its V1 PDF template is a replaceable adapter, not part of the pricing domain.

### 5.6 `infrastructure`

Owns browser adapters. Storage, clipboard, PDF rendering, and download access are behind small interfaces so unsupported/denied behavior is testable. Domain and feature code must not call browser globals directly.

## 6. Data contracts

### 6.1 Input

`QuoteInputV1` is a versioned, serializable object. UI draft values may be incomplete strings; they are not domain input. The complete Zod schema parses and normalizes draft values before calculation.

### 6.2 Result

`QuoteResultV1` contains:

- `modelVersion`;
- `pricingConfigId` and `pricingConfigVersion`;
- `inputVersion`;
- a normalized input snapshot;
- integer hours/money/percentage primitives;
- category line items with stable IDs;
- explanation records with stable reason codes;
- generated structured scope/exclusion/change-order data;
- warnings; and
- no wall-clock creation timestamp inside the deterministic result; persistence
  envelopes may add `createdAt` later.

Results contain plain objects and arrays only. Do not put `Date`, `Map`, class instances, or functions across Server/Client boundaries or into storage.

### 6.3 Commercial overrides

`QuoteOverridesV1` stores only changed client-facing fields. It references the result model version, config identity, and a deterministic input fingerprint. If that identity changes after recalculation, the override layer is considered stale and is reset after an explicit UI notice.

### 6.4 Pricing configuration

`PricingConfigV1` is the single authoritative calibration model. It contains every effort range, expected-effort interpolation position, complexity signal/threshold/multiplier, testing and project-overhead rate, risk contingency, urgency premium, commercial rounding increment, timeline default, revision/change-order/maintenance/milestone parameter, validation bound, and warning threshold.

The engine receives a validated config explicitly; it does not import loose constants. A registry resolves a known configuration ID/version for new calculations. Completed `QuoteResultV1` records the config identity and all resolved ledger contributions needed to display the historical result without loading or applying a newer config. Recalculation under a newer config is an explicit user action that creates a new result.

### 6.5 Client quote document and export contract

`ClientQuoteDocumentV1` contains only client-presentable structured sections: header/identifiers, project type, amount/range, scope, exclusions, timeline, milestones, revision terms, change-request pricing, maintenance/support, and optional notes. Phase 5 excludes calculation detail entirely; a future explicit export option requires its own approved client-readable explanation.

`PdfExportOptionsV1` includes page size, amount presentation, and `includeCalculationDetails` (default `false`). `QuoteExporter` accepts the validated document/options and returns a typed download result or failure. Future logo/template/branding/cloud fields are not included in the V1 options.

## 7. Calculation pipeline

```text
Incomplete UI draft
  → step validation
  → complete-schema validation
  → normalization/dependency resolution
  → configured low/expected/high direct effort
  → complexity-related additional effort
  → testing and project-overhead effort
  → separate risk/uncertainty contingency and timeline
  → hourly-value cost basis and target-margin price
  → urgency surcharge and commercial rounding
  → minimum/recommended/range ledger
  → revisions, changes, milestones, maintenance
  → scope and exclusions
  → explanation records
  → invariant check
  → QuoteResultV1
```

Each stage is a pure function. The orchestrator returns a typed success or typed domain failure; it does not throw for expected validation failures.

Complexity and risk are distinct inputs and calculations. Complexity is derived primarily from concrete scope and affects expected effort. Risk reflects uncertainty and affects contingency. A configuration may not map one risk selection into complexity effort unless it declares a separate named rule with rationale and tests.

## 8. Numeric model

- Money: integer minor units (`MoneyMinor`). INR, USD, GBP, and EUR use two display decimals, even if the UI normally shows whole-unit quotes.
- Percentages: integer basis points; 1% = 100 basis points.
- Effort: integer quarter-hours; 1 hour = 4 units. Fifteen minutes is sufficiently granular for project estimation, supports half-hour and three-quarter-hour assumptions exactly, and avoids binary floating-point; finer units require a documented model need.
- Ratios/multipliers: integer basis points or explicit rational numerator/denominator.
- Rounding: performed by named helpers and documented in the pricing spec. Intermediate monetary arithmetic uses integer operations with a single declared half-up step per formula.
- Presentation: `Intl.NumberFormat` formats values by selected currency and an explicit application locale policy; formatting never changes stored values.

Branded numeric types or constructors should prevent adding hours to money or treating a margin as a multiplier.

## 9. Validation architecture

- Step schemas validate what can be known at each step.
- The canonical schema validates the complete domain contract.
- Refinements enforce dependencies, such as accounts requiring authentication and subscription work requiring payments/authentication as configured.
- Restored storage is untrusted and always parsed through its envelope and payload schema.
- Result invariants run in tests and optionally in non-production builds.
- Validation error codes are stable; UI copy maps codes to accessible messages.

## 10. State and persistence

Use a reducer or explicit state machine rather than unrelated component state. State categories are:

- incomplete draft;
- current step and visited steps;
- validation status;
- calculation status;
- immutable latest result;
- client-facing overrides; and
- storage status.

Local-storage records:

```text
webquote.active-draft.v1
webquote.latest-result.v1 (envelope version 2; version 1 remains readable)
webquote.commercial-overrides.v1
```

The draft uses `storageVersion: 1`, draft/step/completion state, and creation/update timestamps. The result uses `storageVersion: 2`, a validated immutable `QuoteResultV1`, result identity, pricing config identity, and a save timestamp; the valid version 1 result envelope remains readable. Overrides use `storageVersion: 1`, `overrideVersion`, result/model/config identity, and validated client-facing values. Draft typing is debounced and step navigation is saved immediately. Storage errors do not block calculation. Invalid or unsupported payloads are not reinterpreted, and the user is offered recovery.

No client/project data is logged to analytics or server logs in V1. Do not store clipboard text separately.

## 11. Server and Client Component boundaries

- Root layout, landing page, metadata, and route shells remain Server Components.
- The builder's reducer/form island is a Client Component.
- The result workspace is a Client Component because it restores storage, edits overrides, and copies text.
- Move the smallest possible interactive pieces to client files; do not mark a page or layout client-side merely for one control.
- Props crossing into Client Components are serializable primitives/plain objects.
- Browser-only values are initialized after mount to avoid hydration mismatch; server shells render stable skeleton/empty framing rather than timestamp- or storage-dependent text.
- The PDF renderer is dynamically imported only when export is requested so it does not inflate the initial landing, builder, or result bundle.

Phase 3 keeps the header, `/`, and `/quote` route shell as Server Components.
The progress stepper and form/financial primitives are render-neutral and do not
require a client boundary; Phase 4 will add client components only around actual
draft state and input interaction.

## 12. Error handling

- Domain validation returns structured field/form errors.
- Expected adapter failures return typed outcomes (`unavailable`, `denied`, `quotaExceeded`, `invalidData`).
- PDF generation failures preserve the document and overrides, clear the busy state, and offer retry plus copy/manual recovery.
- Unexpected rendering failures reach the nearest Next.js error boundary with “Try again” and safe navigation.
- A calculation invariant failure shows a non-sensitive error reference and preserves the draft; it never produces a partial quote.
- Do not expose stack traces, raw Zod dumps, or serialized project data in the UI.

## 13. SEO architecture

- Root metadata uses a title template and canonical base URL from validated public environment configuration.
- `/` has unique title, description, canonical, Open Graph data, and legitimate `SoftwareApplication`/`WebApplication` structured data only when fields are factual.
- `sitemap.ts` initially includes only public indexable routes.
- `robots.ts` permits public content and keeps personalized tool routes out of search results.
- The future calculator-page family must use shared domain modules and unique useful content, not thin keyword variants.
- Metadata remains in Server Components. The OG image uses the built-in Next.js image response capability or a static asset, never a fake dashboard metric.

## 14. Testing architecture

### Unit

Vitest covers pure calculation stages, schemas, dependency normalization, rounding, formatting-independent output, scope generation, and invariants. Table-driven fixtures cover all project types and currencies.

### Component

DOM-focused tests cover step disclosure, accessible errors, keyboard actions, override/reset behavior, storage fallback, clipboard fallback, PDF option defaults, and export failure recovery. Select the smallest compatible React testing tools during initialization.

### End to end

Playwright covers landing → builder → result → edit → copy/PDF export, resume draft, empty result, invalid storage, and narrow-screen/keyboard flows. Tests assert no console errors and no failed internal requests.

### Visual/manual

Stable representative states are reviewed at defined viewports. Generated PDFs for representative fixtures are parsed, rendered to page images, and visually inspected for hierarchy, overflow, clipping, page breaks, and content accuracy. Automated screenshots may detect regressions, but approval requires human inspection.

## 15. Future compatibility seams

### Database/accounts

A future `QuoteRepository` can store the same versioned domain records. Authentication and authorization belong at a new application/service boundary; they must not leak into calculation functions. Local quote IDs are not assumed to be globally unique or secure identifiers.

### PDF/export

V1 uses a dedicated client-side document-to-PDF adapter that produces paginated, selectable text from `ClientQuoteDocumentV1`; it must not screenshot or rasterize the results DOM. The exact renderer is selected during Phase 6 after compatibility, bundle, license, font, and security checks. It is dynamically loaded, uses bundled/embedded fonts with all required currency glyphs, generates a `Blob`, and downloads a sanitized filename. The PDF itself is not placed in local storage.

The default template is a restrained WebQuote layout. Calculation details are excluded unless the user explicitly enables the export option. Because the document and exporter interfaces are renderer-neutral, future adapters can add custom branding, logos, template selection, cloud storage, or server rendering without changing the pricing engine or result model.

### Additional calculators

Future SEO calculators should compose subsets of the same versioned inputs and calculation primitives. They must not fork formulas into pages.

### API

No internal REST layer is needed in V1. A future external/mobile API can wrap application services through Route Handlers with explicit authentication, rate limits, and versioned contracts.

## 16. Security and privacy baseline

- No secrets are needed in client code.
- Treat all restored and URL-derived values as untrusted.
- Do not render user text as HTML.
- Treat PDF-bound user text as untrusted plain text; sanitize filenames separately and never interpret notes as markup.
- Set an explicit Content Security Policy during implementation if compatible with the chosen hosting/runtime; document any exceptions.
- Avoid third-party scripts in V1.
- Do not claim local storage is encrypted.
- Provide a visible clear-data action.
- Keep client names optional and state that project data remains in the current browser in V1.

## 17. Architectural decision status

Confirmed by the approved checkpoint:

1. No server endpoint, database, authentication, or paid API for launch calculation/persistence/export.
2. Builder at `/quote` and restorable result at `/quote/result`, both noindex.
3. Active draft plus latest result only, stored in versioned local storage.
4. Integer minor units, basis points, and justified quarter-hour units throughout the domain.
5. Scope changes invalidate client-facing overrides rather than silently carrying them forward.
6. The client-summary document is the stable seam for launch PDF export and future branded/server-side renderers.
7. Launch PDF generation is local, dynamically loaded, and does not store or upload the produced file.

Additional confirmed PDF direction:

- A4 is the default page size; the options contract preserves US Letter extensibility.
- Formal PDF/UA certification is not required for launch. The accessibility baseline is selectable text, appropriate metadata, readable contrast, logical organization where supported, and an equivalent accessible HTML preview.
- Renderer evaluation remains deferred to Phase 6 because the renderer-neutral boundary avoids foundation lock-in.

## 18. Phase 1 implementation notes

- Next.js 16.3.6, React 19.3.0, strict TypeScript 6.0.3, Tailwind CSS 4.3.3, Zod 4.6.5, Vitest 5.0.2, React Testing Library 16.3.3, and Playwright 1.63.0 are installed at exact versions.
- Server Components are the default. Only `error.tsx` and `global-error.tsx` are Client Components because retry interaction requires the browser.
- Geist is locally bundled through the `geist` package's `next/font/local` integration; builds do not fetch fonts from a remote host.
- `NEXT_PUBLIC_SITE_URL` is validated with Zod. When missing in production, canonical/sitemap URLs are suppressed and robots fail closed.
- The quote shell owns a route-level `noindex`, `nofollow`, and `nocache` policy.
- Webpack is used for `dev` and `build`: Turbopack's CSS worker attempted to bind an internal port and failed with `EPERM` in this execution environment, while the supported Webpack build passed.
- No PDF renderer was evaluated or installed. The already approved renderer-neutral document/export boundary prevents an architectural lock-in, so dependency selection remains correctly deferred to Phase 6.
