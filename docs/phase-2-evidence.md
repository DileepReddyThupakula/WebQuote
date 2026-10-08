# Phase 2 pricing-domain evidence

Status: Complete  
Date: 2026-09-26  
Scope: pricing domain, authoritative configuration, fixtures, and exhaustive
domain tests only. Phase 3 and UI work remain out of scope.

## Commands and results

| Command | Result |
|---|---|
| `npm run format:check` | Passed; all matched files formatted |
| `npm run lint` | Passed; zero errors and warnings |
| `npm run typecheck` | Passed; zero TypeScript errors |
| `npm run test:run` | Passed; 12 files, 141 tests |
| `npm run test:domain` | Passed; 7 files, 128 tests; 99.39% statements, 97.92% branches, 100% functions, 99.58% lines |
| `npm run build` | Passed; Next.js 16.3.6 Webpack production build |
| `npm run check` | Passed; all format, lint, typecheck, test, coverage, and build stages |
| `npm run test:e2e` | Passed with local-server permission; 3 Chromium smoke tests |
| `npm audit --audit-level=high` | Passed with registry access; 0 vulnerabilities |

The first sandboxed E2E attempt returned `listen EPERM` for
`127.0.0.1:3100`; the exact command passed when the local-server permission
was enabled. The initial audit attempt was blocked by registry DNS; the
network-enabled retry passed.

## Domain evidence

- Domain imports contain no React, Next.js, browser, storage, PDF, or network
  dependencies.
- `PRICING_CONFIG_V1` is Zod-validated, deeply frozen, and registered by
  immutable `configId@configVersion` identity.
- Results contain no wall-clock timestamp and are deterministic for identical
  normalized input plus configuration.
- Fixture snapshots cover eight approved scenarios and resolve effort, price,
  timeline, milestone, warning, and price-ledger outputs.
- Tests cover exact integer arithmetic, schema/config rejection, dependency
  normalization, all project types/currencies/design/risk/urgency/maintenance
  variants, complexity boundaries, risk separation, safe-floor and gross-margin
  math, urgency, rounding, timeline capacity, revisions, change orders,
  maintenance, milestones, warnings, history/config identity, determinism, and
  monotonicity invariants.

The Playwright suite remains the Phase 1 shell suite because builder/results UI
are deliberately deferred to later approved phases. Passing these smoke tests
does not claim Phase 3–9 UI, accessibility, PDF, persistence, or release gates.
