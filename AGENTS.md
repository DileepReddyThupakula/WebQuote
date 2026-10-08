# WebQuote Repository Instructions

## Product intent

WebQuote helps freelancers and small digital agencies turn website-project inputs into an explainable planning range, scope, payment plan, revision policy, and client-ready quote. It is a deterministic planning tool, not a market-price oracle.

The product promise is: **Know what to charge before you send the quote.**

## Current phase boundary

Phase 1 — Engineering Foundation is complete. The source of truth is:

- `PRODUCT_SPEC.md`
- `ARCHITECTURE.md`
- `DESIGN_SYSTEM.md`
- `PRICING_ENGINE_SPEC.md`
- `IMPLEMENTATION_PLAN.md`
- `QUALITY_GATES.md`

The initial planning checkpoint and Phase 1 implementation were approved and completed on 2026-09-26. Do not begin Phase 2 or implement pricing calculations until the user explicitly authorizes that phase. Preserve the existing Phase 1 shell, quality gates, and renderer-neutral PDF boundary while later work proceeds in its approved phase order.

## Non-negotiable product rules

- Keep the useful V1 available without signup, a database, or a paid API.
- Include professional client-ready PDF export in launch V1 without requiring a backend.
- Make every commercial output traceable to user inputs and documented effort assumptions.
- Describe results as planning ranges; never claim objective or guaranteed market prices.
- Do not use client location as a hidden price multiplier.
- Do not add authentication, billing, client portals, invoicing, CRM, AI chat, admin features, teams, or a mobile app in V1.
- Do not fabricate customers, logos, testimonials, usage metrics, prices, or photography.
- No dead controls: every visible button or link must perform a clear action or navigate to a real destination.
- Accessibility and mobile behavior are release requirements, not cleanup tasks.
- Preserve user work. Do not overwrite or remove unrelated changes, and do not weaken tests to pass a gate.

## Engineering rules for the approved implementation

- Use Next.js App Router, strict TypeScript, Tailwind CSS, Zod, Vitest, and Playwright with mutually compatible stable versions selected at initialization time.
- Use the repository scripts as the supported workflow: `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test:run`, and `npm run test:e2e`.
- Keep the approved Webpack flags in `dev` and `build` unless a later environment proves Turbopack can process CSS without the recorded internal-port `EPERM` failure.
- Prefer Server Components for static/SEO content. Isolate browser-only builder, persistence, editing, and clipboard behavior in small Client Components.
- Keep `src/domain/quote` framework-independent. It must not import React, Next.js, browser APIs, storage APIs, or UI-formatting helpers.
- Treat quote inputs and engine results as versioned schemas. Validate at every untrusted boundary, including restored local storage.
- Store money as integer minor units and percentage values as integer basis points. Store effort as integer quarter-hours. Do not use binary floating-point for persisted or contractual monetary values.
- Keep every effort range, interpolation/calibration position, threshold, multiplier, overhead rate, contingency, rush premium, rounding increment, maintenance formula, revision formula, milestone rule, validation bound, and warning trigger in one authoritative, typed, versioned pricing configuration. Do not scatter calibration values across engine or UI modules.
- Return calculation explanations and line items from the engine; do not reconstruct explanations from UI labels.
- Keep scope complexity and project risk as separate domain concepts. Complexity may add expected delivery effort; risk may add uncertainty contingency. Applying one selection to both requires a named, documented configuration rule and explicit test coverage.
- Use semantic HTML first. A div with click handling is not a substitute for a button, link, fieldset, table, or heading.
- Use `next/font` through the root layout, the Metadata API in Server Components, and file-based `robots`/`sitemap` metadata.
- Do not introduce a Route Handler or Server Action unless a real server-side V1 requirement is documented first.
- Generate launch PDFs through the dedicated client-document/export boundary. Do not read the rendered results DOM, rasterize the page, or place internal pricing details in the PDF unless the user explicitly enables that option.
- Prefer pure functions, discriminated unions, exhaustive switches, focused modules, and deterministic fixtures.
- Errors shown to users must explain what happened and how to recover without exposing stack traces.

## UX and content rules

- Use the design tokens and patterns in `DESIGN_SYSTEM.md`; do not improvise a second visual language.
- Use a warm neutral canvas, near-black text, restrained teal accent, subtle borders, limited shadows, and moderate radii.
- Do not use gradients, glow, glassmorphism, decorative dashboards, generic AI language, excessive animation, or a card around every section.
- Use progressive disclosure. Hidden dependent fields must not remain active in the calculation unless their values are explicitly preserved and disclosed.
- Keep plain-language labels. Explain margin, contingency, minimum safe price, and rush fee near the relevant controls.
- Never expose the internal effort/cost breakdown in the client-ready output by default.
- Mark user-overridden outputs and always provide a way to restore calculated values.
- Warn, but do not block, when a commercial override falls below the calculated minimum safe price.

## Verification expectations

Use `QUALITY_GATES.md` as the definition of done for each phase. At minimum, a release candidate requires:

- formatting, lint, strict typecheck, unit/component tests, production build, and Playwright tests passing;
- pricing-engine fixtures, boundary cases, and invariants passing;
- no browser console errors or broken internal links;
- keyboard-only completion of the quote flow;
- mobile checks at 320 px and 375 px, plus tablet and desktop checks;
- an accessibility audit and documented manual checks;
- README and pricing documentation matching the shipped behavior;
- PDF structure, extracted text, default confidentiality, pagination, and rendered pages verified against representative fixtures.

Report commands and actual pass/fail totals. Do not call a gate complete from static inspection alone.

## Change discipline

- Keep commits and diffs phase-scoped.
- When an approved requirement changes, update the relevant specification in the same change as the implementation.
- A change to formulas, tables, rounding, defaults, or thresholds requires pricing-engine tests and a pricing-model version increment.
- A new pricing calibration version must coexist with stored historical results. Never reinterpret an existing result under a newer configuration without an explicit recalculation action.
- A change to persisted input/result shape requires a storage schema version decision: migrate, safely discard, or support both. Never silently reinterpret old data.
- New V1 scope requires explicit approval and an implementation-plan update.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
