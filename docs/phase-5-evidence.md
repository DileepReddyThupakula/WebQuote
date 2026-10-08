# Phase 5 evidence — Results and commercial terms

Date: 2026-10-08  
Branch: `phase-5-results`  
Scope: Results workspace, validated commercial overrides, and client document/copy boundary. PDF export remains Phase 6.

## Implementation

`/quote/result` restores a validated `QuoteResultV1` and displays the planning range, recommended quote, safe floor, effort range, timeline, complexity, and risk separately. Its expandable internal section uses the engine's existing ledger and explanations. Scope, exclusions, assumptions, revisions, change requests, payments, maintenance, and support come from the result contract.

Commercial edits live in `QuoteOverridesV1`, separate from the immutable calculated result. Override records carry result, model, and pricing-config identities. Each editable field can return to its calculated value. A below-floor quote shows a nonblocking warning. Payment milestone percentages must total exactly 100% before the client preview or copy is available. Recalculation with materially different inputs clears stale overrides and tells the user. Corrupt and unsupported stored values recover without crashing; storage denial preserves an in-memory result.

`ClientQuoteDocumentV1` is a validated, client-only structure shared by the HTML preview and plain-text summary. It excludes the pricing ledger, internal cost/margin/risk details, raw configuration, debugging values, and builder-only working-draft context by default. A project/client label appears only when explicitly entered in the commercial editor. The summary supports Clipboard API success and manual selection when clipboard access is denied or unavailable. No PDF renderer, server persistence, or external sending was added.

The result storage envelope is version 2 under the existing latest-result key. Valid version 1 results remain readable. Historical results render from their stored result/config identity without recalculation. Draft navigation now flushes draft and target step immediately, preventing a refresh race found in Playwright; typing still uses the existing short debounce.

## Automated checks

- `npm install` — completed; lockfile unchanged.
- `npm run format:check` — passed directly and via `npm run check`.
- `npm run lint` — passed directly and via `npm run check`, zero errors and warnings.
- `npm run typecheck` — passed directly and via `npm run check`.
- `npm run test:run` — 23 files, 193 tests passed.
- `npm run check` — passed: format, lint, typecheck, 193 unit/component tests, 7 domain files / 128 tests, and Next.js 16.4.0 Webpack production build.
- `npm run test:e2e` — 13 Chromium scenarios passed.
- `git diff --check` — passed with no output.

The 193 tests include deterministic simple/typical/complex fixtures, exact result amounts, separate complexity/risk, safe floor, overrides/reset/warning, milestone reconciliation, client document confidentiality and content, clipboard success/failure, valid/corrupt result and override storage, stale override handling, historical config identity, empty recovery, and storage failure. Browser scenarios cover result interactions, 320/375/390/768/1024/1440 px, keyboard interaction, empty/corrupt recovery, and the complete builder flow.

Domain coverage in `npm run check`: 99.39% statements, 97.92% branches, 100% functions, 99.58% lines. Pricing formulas and calibration files were not changed.

## Browser review

The results page was manually viewed at 320, 390, 768, 1024, and 1440 px using deterministic local quote inputs. A separate DOM review also checked 375 px. All six widths had no document-level horizontal overflow. Controls had accessible labels, headings were ordered semantically, keyboard focus was visibly outlined, and reduced-motion CSS reduced transitions. The browser reported no console errors. Two font-preload notices appeared in the development session only. Playwright also checked the production-browser flow and a mobile 320 px path.

The effort table is horizontally scrollable on narrow screens and is a named, keyboard-focusable region. A production-browser axe WCAG 2 A/AA and 2.1 A/AA scan reported zero violations at both 1440 and 320 px after that focus fix.

### Browser-native 200% zoom close-out

Google Chrome on macOS 26.6.2 was used against the local Next.js production server. The browser viewport before zoom was 1440 × 756 CSS px at 100%. Chrome's own toolbar reported **Zoom: 200%** after five native zoom commands; the effective CSS viewport was 720 × 378 px, with device pixel ratio rising from 2 to 4. Zoom was restored to 100% afterward.

At 200%, the overview, planning range, recommended quote, minimum safe price, effort/timeline/complexity/risk, expanded internal ledger, scope, calculated commercial terms, override fields, below-floor warning, milestone editor and invalid-total status, client preview, selectable summary, copy button/success status, and empty-result recovery state were visually inspected. Text and amounts remained readable, controls reachable, and the stacked reading order logical. The page had no document-level horizontal overflow; the effort table retained its own keyboard-focusable horizontal scroll region. No values or controls were clipped, and no sticky or fixed control obscured content. A keyboard-focused Restore button retained a visible 3 px outline. The empty state showed a usable “Build a quote” link. Only the skip link used fixed positioning.

Clipboard success was observed in Chrome at 200%. The denied/unavailable message and selectable-text fallback are covered by the clipboard and component tests. Chrome continued to allow Clipboard API writes when its localhost site permission was temporarily set to Block, so that browser setting did not reproduce the fallback; the original Ask (default) setting was restored.

## Security audit disposition

`npm audit` exits 1 and reports five high-severity advisories, all from the development-only ESLint chain: `eslint-config-next@16.4.0` → `@next/eslint-plugin-next@16.4.0` → `fast-glob@3.3.1` → `micromatch@4.0.8` → `braces@3.0.3` (`GHSA-vfj7-8cjw-p6xm`). It reports no other affected package or severity. `eslint-config-next` is a `devDependency`; `npm ls --omit=dev` finds none of these packages in the production tree. No affected package is shipped as an application runtime dependency.

`npm audit --omit=dev` exits 0: **production dependencies have zero reported vulnerabilities**. The full repository audit does not have zero reported vulnerabilities. `npm audit fix --force` proposes `eslint-config-next@14.2.35`, an unacceptable breaking downgrade for the pinned Next.js 16.4.0 setup. It was not run, and no dependency was downgraded. The five development-only advisories are accepted as a documented tooling exception for Phase 5 and must be revisited when the upstream dependency chain publishes a compatible fix.

## Acceptance audit

| Criterion | Result | Evidence |
|---|---|---|
| Displayed totals reconcile with the domain ledger | PASS | `phase5.test.ts` checks ledger totals for three fixtures; `result-workspace.test.tsx` checks rendered engine amounts for the same three; domain invariants pass 128/128. |
| Complexity and risk are separate | PASS | `result-workspace.test.tsx` checks both labels; Chrome 200% review showed separate values and explanations. |
| Internal assumptions are excluded from the client document | PASS | `phase5.test.ts` checks document properties and text; `result-workspace.test.tsx` checks preview content; Chrome review showed the ledger outside the preview. |
| Editable values are marked custom and can be restored | PASS | Component and Playwright tests exercise quote and milestone custom/reset states; Chrome 200% review checked the custom amount, milestone marker, and expanded editor labels/restore controls. |
| Below-floor override warns without blocking | PASS | Component and Playwright tests retain the preview; Chrome 200% review showed the warning and active editor. |
| Milestones require exactly 100% before client-ready output | PASS | `phase5.test.ts` checks 99%/100% documents and exact amount allocation; component/Playwright tests hide preview/copy at 51%; Chrome review showed the status. |
| Clipboard success and denied/unavailable fallback | PASS | `phase5.test.ts` covers resolved, rejected, and absent Clipboard API; component test checks both status messages and selectable text; Chrome 200% review showed live success. |
| Recalculation clears stale overrides | PASS | `phase5.test.ts` checks changed result identity clears persisted custom terms; Playwright checks override restore after reload. |
| Historical config/result identity is preserved | PASS | `phase5.test.ts` stores and restores a historical model/config identity without recalculation. |
| Invalid persisted state fails safely | PASS | `phase5.test.ts` covers malformed/unsupported results and overrides; Playwright checks corrupt-result recovery. |
| Empty result has recovery action | PASS | Component and Playwright tests check the link; Chrome 200% review verified the empty state and visible action. |

## Known test issue resolved

An initial repeat of the pre-existing draft-refresh E2E test exposed a timing race between step navigation and debounced persistence. The implementation now saves the target step and draft synchronously on navigation. The test asserts both persisted values; the focused test and full suite pass after that fix. No test was weakened.

No commit, push, merge, production deployment, domain, DNS, or email changes were made.
