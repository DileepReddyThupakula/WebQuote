# Phase 3 evidence

Date: 2026-09-26

Phase 3 — WebQuote Design System and Product Shell is implemented locally. The
work stops at the reusable product shell; guided quote state, pricing-domain
integration, results, PDF export, and the final marketing page remain out of
scope.

## Scope evidence

- `/quote` is a server-rendered workspace shell with a focused product header,
  seven-stage progress map, primary content region, and contextual workspace map.
- The progress labels follow the seven-step structure in `PRODUCT_SPEC.md`:
  Project; Design & content; Features; Integrations; Delivery; Commercial terms;
  Review.
- No quote fields, reducer, storage adapter, calculation call, result fixture,
  PDF renderer, account control, analytics, or external API was added.
- `/quote` remains `noindex`, `nofollow`, and `nocache`.
- The pricing domain was not changed.

## Design-system evidence

- Warm-neutral canvas, near-black text, restrained teal accent, semantic warning/
  error/success tokens, Geist typography, tabular-number support, 4 px spacing
  scale, 8/12 px radii, restrained shadows, focus ring, and reduced-motion rules
  are documented in `DESIGN_SYSTEM.md` and implemented in `globals.css`.
- Shared layout gutters are 16 px, 24 px, 32 px, and 40 px across the supported
  widths; the shared container is capped at 1280 px.
- Reusable controls cover text/number and prefix/suffix inputs, select,
  checkbox, textarea, semantic radio groups, compact segmented choices,
  fieldsets, notices, and field descriptions/errors.
- Native `Disclosure` and `StatusPanel` primitives cover explanation content and
  loading, empty, error, and unsupported-browser states without a modal/state
  framework.
- Data-only financial primitives cover integer minor-unit formatting, planning
  ranges, metric pairs, and definition/value rows. They are not connected to
  production quote data.

## Visual QA

Rendered `/quote` in Chromium with Playwright browser tooling and inspected the
actual page at:

| Viewport | Result |
| --- | --- |
| 1440 × 900 | Desktop workspace hierarchy, seven-step progress, two-column content, and readable labels pass visual review. |
| 1280 × 800 | Laptop gutters, content density, and contextual column remain balanced. |
| 1024 × 768 | Large-laptop breakpoint remains usable with wrapped step labels and no overflow. |
| 768 × 1024 | Compact progress replaces the wide stepper; workspace becomes a natural single column with no overflow. |
| 390 × 844 | Mobile header, title, progress text/bar, and stacked content remain usable. |
| 320 × 700 | Minimum supported width has no horizontal overflow; the secondary header context is hidden to preserve the wordmark and Overview action. |

The settled browser checks reported `document.documentElement.scrollWidth ===
window.innerWidth` at 320, 390, 768, and 1024 px. The settled `/quote` browser
checks reported no page errors or console errors. Development-only Next tooling
indicators visible during the dev-server inspection are not product UI.

## Automated evidence

- `npm run check`: passed. This ran format check, ESLint, strict TypeScript,
  149/149 Vitest tests, 128/128 pricing-domain tests, 99.39% domain statement
  coverage / 97.92% branch coverage / 100% function coverage / 99.58% line
  coverage, and the Webpack production build.
- `npm run test:e2e`: passed, 4/4 Chromium tests. Coverage includes route
  navigation, skip-link focus, quote-shell landmarks, 320 px overflow, mobile
  progress semantics, 1440 px keyboard focus, and the recoverable 404.
- `npm audit --audit-level=high`: passed, 0 vulnerabilities.

The prescribed `agent-browser` executable was not installed in the workspace;
Playwright CLI was used for the equivalent rendered browser inspection. No
dependency was added for this fallback.

## Accessibility evidence and limits

The shell preserves the skip link and landmarks, uses one H1 with ordered
headings, gives the progress system `nav`/`ol` semantics and a mobile
`progressbar`, keeps controls native, associates descriptions/errors through
`aria-describedby`, exposes field groups with `fieldset`/`legend`, and provides
visible `:focus-visible` styling and reduced-motion behavior.

This is a Phase 3 baseline, not a claim of full WCAG conformance. VoiceOver,
automated axe coverage, validation focus movement, and full builder/result
interaction are Phase 4/5 release work.
