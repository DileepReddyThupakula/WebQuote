# WebQuote

Know what to charge before you send the quote.

WebQuote is a planned professional website-project pricing, scope, revision, payment, maintenance, and quote-building product for freelancers and small digital agencies. The product will use deterministic, explainable calculations based on user inputs; it will not claim to provide an objective market price.

## Current status

Phase 1 — Engineering Foundation is implemented.

The repository currently provides:

- a strict Next.js App Router and TypeScript foundation;
- the approved WebQuote design tokens and reusable semantic primitives;
- minimal development-stage shells at `/` and `/quote`;
- accessible skip navigation, error handling, and 404 behavior;
- fail-closed metadata, robots, and sitemap foundations;
- Vitest/React Testing Library and Playwright infrastructure; and
- documented local-first privacy and architecture boundaries.

Pricing calculations, the guided quote builder, the results workspace, PDF export, and the final landing page are deliberately not implemented yet.

## Requirements

- Node.js 20.9 or newer
- npm 11 or a compatible npm release

The verified local environment used Node.js 24.20.0 and npm 11.19.0.

## Local setup

```bash
npm install
npx playwright install chromium
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No database, authentication, API key, or paid service is required.

## Environment

Copy `.env.example` only when a public deployment origin is known:

```bash
cp .env.example .env.local
```

`NEXT_PUBLIC_SITE_URL` is optional in development. In production, leaving it unset intentionally suppresses sitemap/canonical output and disallows crawling rather than publishing a false production URL. Set it to the final absolute `https://` origin before public release.

Do not place secrets in `NEXT_PUBLIC_*` variables.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next.js development server using Webpack |
| `npm run build` | Create the production build using Webpack |
| `npm run start` | Serve a completed production build |
| `npm run lint` | Run Next.js, React, accessibility, and TypeScript ESLint rules |
| `npm run typecheck` | Run strict TypeScript without emitting files |
| `npm test` | Run Vitest in watch mode |
| `npm run test:run` | Run deterministic unit/component tests once |
| `npm run test:e2e` | Run the Playwright Chromium smoke suite |
| `npm run format` | Format source, tests, and root configuration |
| `npm run format:check` | Check formatting without changing files |
| `npm run check` | Run formatting, lint, typecheck, unit tests, and production build |

Playwright launches a local server on port 3100 when one is not already available.

## Architecture

- `src/app` — App Router pages, layouts, metadata routes, and error surfaces.
- `src/components/layout` — responsive layout primitives.
- `src/components/ui` — small semantic form/action primitives.
- `src/lib` — framework-light shared helpers and public environment validation.
- `src/styles` — global tokens and base behavior.
- `src/test` — shared unit/component test setup.
- `tests/e2e` — browser-level smoke tests.

Server Components are the default. The only current Client Components are the Next.js error boundaries, where browser interaction is required. Future pricing/domain code must remain independent of React, Next.js, storage, and PDF rendering.

The planned `domain`, builder, results, persistence, client-document, and PDF-export modules are not pre-created. They will be introduced only in their approved phases.

## Design foundation

The light-only V1 foundation uses:

- locally bundled Geist Sans and Geist Mono fonts;
- a warm neutral canvas and white surfaces;
- near-black primary text and restrained gray secondary text;
- one deep-teal product accent;
- semantic success, warning, error, and focus colors;
- moderate radii, subtle borders, and limited shadows;
- visible `:focus-visible` treatment and reduced-motion behavior; and
- responsive gutters and readable content widths from 320px upward.

No gradients, glow, glass effects, animation framework, dark mode, generic UI framework, analytics, or third-party scripts are included.

## SEO behavior

- Root title, title template, description, Open Graph, and Twitter defaults are defined in the root layout.
- `/quote` is `noindex`, `nofollow`, and omitted from the sitemap.
- If `NEXT_PUBLIC_SITE_URL` is absent in production, `robots.txt` disallows crawling and `sitemap.xml` is empty.
- The final landing page and future public calculator pages are deferred to their approved phases.

## Build note

The scripts use Next.js's supported Webpack path. In this environment, Turbopack's CSS worker attempted to bind an internal local port and failed with `EPERM`; the same Next.js 16.3.6 production build passes with Webpack. This is an environment/tooling constraint, not an application fallback.

## Product boundaries

- Quote data remains local-first in launch V1.
- No analytics, telemetry, client-data URLs, external APIs, database, or authentication exist in this phase.
- No pricing or calibration values are implemented yet.
- Later pricing values must live in one validated, versioned configuration and remain planning hypotheses.
- PDF export will use the structured client-document boundary, default to A4, preserve a US Letter seam, and exclude internal calculations by default. No renderer has been selected or installed yet.

See the planning documents in the repository root for approved product, architecture, design, pricing, implementation, and quality requirements.
