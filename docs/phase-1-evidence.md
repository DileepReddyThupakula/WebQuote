# Phase 1 Engineering Foundation Evidence

Date: 2026-09-26  
Status: Complete  
Scope: Phase 1 only

## Implemented scope

Phase 1 establishes the Next.js application, strict TypeScript and code-quality configuration, restrained design tokens and reusable primitives, the minimal `/` and `/quote` shells, error and not-found handling, metadata/SEO foundations, and unit/component/browser test infrastructure.

The pricing domain, calibration object, quote builder, results experience, persistence implementation, client quote document, PDF renderer/export flow, and launch landing page are not implemented.

## Final verification

The following deterministic quality sequence passed:

```text
npm run format
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Results:

- Prettier completed successfully.
- ESLint completed with no errors or warnings.
- TypeScript completed with no errors.
- Vitest passed 5 test files and 13 tests.
- Next.js 16.3.6 production compilation with Webpack passed.
- The production route manifest contained `/`, `/_not-found`, `/icon.svg`, `/quote`, `/robots.txt`, and `/sitemap.xml`; all are statically rendered.

The browser suite also passed:

```text
npm run test:e2e
```

Results: 3 Playwright tests passed in Chromium. The tests cover accessible shell navigation, the 320-pixel layout without horizontal overflow, a real HTTP 404 and recoverable not-found view, and rejection of unexpected browser console or page errors. The test for the intentional missing route filters only the browser's expected resource-level 404 message while continuing to fail on every other console error.

Dependency security and install-script state were checked with:

```text
npm audit --audit-level=high
npm install-scripts ls
```

Results: npm reported 0 vulnerabilities. The two reviewed native install scripts, `unrs-resolver@1.12.2` and `fsevents@2.3.3`, are explicitly approved in `package.json`; no unreviewed blocked install scripts remained.

## Development and browser checks

`npm run dev -- --hostname 127.0.0.1 --port 3100` reached the ready state successfully.

Rendered-browser checks against that server confirmed:

- `/` rendered meaningful Phase 1 content with no error overlay and no console errors.
- `/quote` rendered the intentional workspace shell with no error overlay and no console errors.
- Desktop screenshots were visually inspected for both routes.
- A 320 by 700 viewport had a document width of 320 pixels and no horizontal overflow; the mobile screenshot was visually inspected.
- Keyboard Tab exposed the “Skip to main content” link; activating it moved navigation to `#main-content` and focused the main region.

These checks validate only the Phase 1 shell. They are not a release-level accessibility, visual-regression, or cross-browser certification.

## Server and client boundary review

All page, layout, header, layout-primitive, and form-primitive components are Server Components by default. The only `"use client"` boundaries are `error.tsx` and `global-error.tsx`, where Next.js requires interactive reset handlers. A React best-practices review found no effects, browser-global access, client-side data fetching, unnecessary memoization, or avoidable client component boundaries.

No pricing, storage, export, analytics, authentication, database, API-key, or third-party telemetry code is present.

## Toolchain findings and limitations

- Next.js `dev` and `build` use the supported Webpack path. In this execution environment, Turbopack's CSS worker attempted to bind an internal local port and failed with `EPERM`, including outside the filesystem sandbox; the same production build passed with Webpack. This is documented rather than hidden.
- ESLint is pinned to 9.39.5 because ESLint 10.0.3 is incompatible with the React lint plugin bundled by `eslint-config-next` 16.3.6 in this stack. npm therefore prints ESLint 9's upstream end-of-support deprecation notice during installation. Lint itself passes cleanly. Re-evaluate when Next's lint stack supports ESLint 10.
- TypeScript is pinned to 6.0.3 because the current `typescript-eslint` package used by the Next.js lint stack declares support below TypeScript 6.1; TypeScript 7 was not selected merely to claim the newest version.
- Playwright currently installs and runs Chromium only. Its configuration is ready to add Firefox and WebKit in release qualification.
- Playwright prints a harmless `NO_COLOR`/`FORCE_COLOR` environment warning in this host environment; it does not originate from WebQuote and does not affect test results.
- The public production URL remains intentionally unset. `NEXT_PUBLIC_SITE_URL` is validated when supplied; development and tests can use localhost, while production omits canonical/base URLs rather than inventing a domain.
- No PDF renderer was selected. The renderer-neutral client-document/export boundary remains documented and renderer evaluation is deferred to Phase 6 as approved.

## Scope audit

Phase 1 stops at the engineering foundation. No pricing formula or calibration constant is present in application code. The existing approved calibration values remain planning data for Phase 2 and must be introduced through the single versioned configuration model, not through UI code.

No commit was created.
