# WebQuote Product Specification

Status: Revised after the approved planning checkpoint; remaining assumptions are listed for approval  
Product: WebQuote  
Tagline: Know what to charge before you send the quote.

## 1. Product definition

WebQuote is a browser-based planning and quote-building product for freelance website professionals and small digital agencies. It turns a guided description of a project and the user's own pricing preferences into:

- an estimated effort range;
- a minimum safe price and recommended planning range;
- a recommended quote;
- an expected timeline and complexity level;
- a deposit and milestone schedule;
- a revision and change-request policy;
- a maintenance recommendation;
- included scope and exclusions; and
- a concise, editable, client-ready commercial summary; and
- a professional, downloadable client-ready PDF.

WebQuote does not claim to know the objectively correct market price. It supplies a documented calculation using the user's hourly value, target margin, scope, and risk choices.

## 2. Target user

### Primary user

A freelance developer, designer-developer, AI-assisted developer, full-stack developer, or small agency operator who has received a website enquiry and needs to structure a commercially safe quote.

### Initial context

The user understands how to deliver websites but may be uncertain about estimating hidden effort, pricing risk, controlling revisions, setting milestones, and communicating exclusions.

### Not the initial user

- a client seeking the cheapest contractor;
- a large enterprise procurement team;
- a consumer creating an invoice;
- a multi-user agency operations team; or
- a user seeking a live marketplace-rate benchmark.

## 3. Problem

Website quotes frequently understate non-build work and leave commercial terms ambiguous. A page count alone does not account for design, content preparation, integrations, testing, migration, deployment, project management, risk, revisions, or deadline compression. The user needs a repeatable way to reason about those factors and present the result professionally.

## 4. Jobs to be done

When I receive a website enquiry:

1. Help me identify the work implied by the request.
2. Help me estimate a defensible effort range.
3. Help me set a price that does not fall below my own operating floor.
4. Show me how margin, contingency, scope, and urgency affect the number.
5. Help me define what is included and excluded.
6. Help me set revision, out-of-scope, and change-order terms.
7. Help me propose a deposit, milestones, launch support, and maintenance.
8. Give me client-ready wording without exposing my internal costing by default.
9. Let me adjust commercial terms while keeping the calculated recommendation available for comparison.

## 5. Product principles

- **Transparent:** Every total can be traced to an input, assumption, line item, and formula.
- **Separated reasoning:** Known scope complexity changes expected work; uncertainty/risk changes contingency. The UI must not blur them into one opaque multiplier.
- **User-anchored:** The user supplies their minimum hourly value and target margin. WebQuote does not invent market rates.
- **Progressive:** The builder asks only relevant questions and provides context at the point of decision.
- **Commercially practical:** Scope, exclusions, revisions, payments, and changes are first-class outputs.
- **Local-first:** The core flow works without an account or server-side persistence.
- **Restrained:** The product feels like a serious business tool, not an AI landing-page template.
- **Accessible:** Keyboard, screen-reader, reduced-motion, zoom, and narrow-screen use are supported.

## 6. V1 scope

### 6.1 Landing page

The landing page must contain:

- headline: “Know what to charge before you send the quote.”
- supporting copy: “Build a clear project price, scope, payment plan, revision policy, and client-ready quote for your next website project.”
- primary action: “Build a quote”;
- secondary action: “See how it works” that moves focus to or scrolls to the real process demonstration;
- three benefit sections: Price with confidence, Define the scope, Protect your margin;
- a compact, representative product preview based on labelled example inputs, not fake customer data; and
- crawlable explanation of what the calculator does and does not do.

No fake logos, testimonials, customer counts, or performance metrics are permitted.

### 6.2 Guided quote builder

The builder is a linear, resumable flow with a visible step name, progress text, back/continue actions, validation summary, and contextual help. A proposed seven-step structure is:

1. **Project** — project type, unique page/screen count, currency, optional client/pricing-context label.
2. **Design and content** — design starting point, content responsibility, copywriting, formatting, asset sourcing.
3. **Features** — progressively revealed core and business capabilities.
4. **Integrations** — standard and custom integration counts/types, shown only when selected.
5. **Delivery** — testing, deployment, migration, urgency, weekly capacity, launch support, maintenance preference.
6. **Commercial terms** — minimum hourly value, target gross margin, contingency level, included revision rounds.
7. **Review** — a plain-language input summary, assumptions, validation, and “Calculate quote.”

Phase 4 implements this structure with a browser-local draft envelope and a
minimal `/quote/result` handoff. The review contains inputs only; the detailed
planning range, commercial output, client summary, and PDF remain Phase 5/6
work. Numeric UI values are converted to integer minor units or basis points at
the mapping boundary, and restored envelopes are rejected when their version or
shape is unsupported.

The builder must support:

- Landing page
- Business website
- Portfolio
- Blog/content site
- Ecommerce website
- Web application
- Custom website

Supported currencies are INR, USD, GBP, and EUR. Currency changes presentation and minor-unit behavior; they do not introduce a location-based rate multiplier.

### 6.3 Results workspace

The result screen is the product's primary screen. Its reading order is:

1. “Recommended planning range based on your project scope and pricing preferences.”
2. Recommended range and recommended quote.
3. Minimum safe price, low/expected/high estimated hours, expected timeline, complexity, and suggested deposit.
4. A category breakdown for development, design, features/CMS, integrations, content, testing/deployment, project management, complexity-added effort, and risk contingency.
5. A “How this was calculated” explanation that ties line items to inputs without implying market authority.
6. Included scope.
7. Exclusions.
8. Revision and change-request pricing.
9. Payment structure.
10. Maintenance recommendation.
11. Client-ready summary with preview, edit, copy, and PDF-export controls.

Internal details and client wording are visually and semantically separated.

### 6.4 Editable commercial values

The user can adjust the following after calculation:

- quote amount;
- delivery range/statement;
- deposit and milestone percentages, constrained to total 100%;
- included revision rounds and extra-revision amount;
- maintenance offer and amount;
- included-scope lines;
- exclusion lines; and
- project/client labels used in the summary; and
- optional client-facing notes.

Calculated values remain available. Overrides are labelled “Custom,” can be reset individually or together, and trigger a non-blocking warning if the quote drops below the minimum safe price. Editing an output does not mutate the original engine result.

### 6.5 Client-ready summary

The client view includes:

- optional project and client names;
- project overview;
- deliverables/included scope;
- proposed price;
- delivery estimate;
- revision policy;
- payment milestones;
- launch support/maintenance if selected;
- exclusions and change-control wording; and
- an explicit validity placeholder only if the user supplies a validity period.

It excludes hourly value, margin, internal effort categories, risk score, contingency math, and minimum safe price by default. V1 provides copy-to-clipboard with success/error feedback and a manual-selection fallback when clipboard permission is unavailable.

### 6.6 Professional PDF export

Launch V1 generates a clean PDF from the same structured client-ready quote document used by the on-screen preview. The export is generated locally in the browser and downloaded by the user; it does not require an account, database, backend API, or paid service.

The default PDF contains:

- WebQuote / quote header and quote date;
- project and client identifiers when supplied;
- project type;
- quoted amount or planning range, according to the user's selected presentation;
- included scope;
- exclusions;
- delivery timeline;
- payment milestones;
- revision policy;
- additional-work/change-request pricing;
- maintenance and support terms; and
- optional user notes.

The export preview provides an explicit “Include calculation details” option that is off by default. When off, hourly value, target margin, minimum safe price, internal effort ledger, contingency math, and other internal pricing-engine details must not appear in the PDF. When enabled, only the approved client-readable explanation section is added; raw debug/configuration data is never exported.

V1 PDF export uses one restrained WebQuote template. Custom branding, uploaded logos, multiple templates, cloud storage, share links, and paid branding controls remain future work. Export failures preserve the quote and provide a retry plus copy/manual alternative.

### 6.7 Local persistence

V1 stores only:

- the current in-progress draft; and
- the most recently calculated quote and its commercial overrides.

Data is stored in the browser using a versioned schema, restored only after validation, and removable through “Start over”/“Clear saved quote.” The UI explains that browser storage may contain project/client details and is visible to other users of the same browser profile. V1 does not implement an unbounded quote history.

### 6.8 Resilience and states

The product includes:

- initial, saving, calculating, copying, PDF-generating, PDF-success/failure, empty-result, invalid-restored-data, and unexpected-error states;
- recovery actions for each error state;
- an accessible 404;
- route-level error boundaries where useful; and
- safe operation when local storage or clipboard APIs are unavailable.

“Calculating” must be honest and brief; the deterministic engine must not simulate an AI delay.

## 7. Inputs

The canonical input contract is detailed in `PRICING_ENGINE_SPEC.md`. Product-level inputs are:

| Group | Inputs | Conditional behavior |
|---|---|---|
| Project | type, unique pages/screens, currency, optional client context | Project type supplies defaults but never a currency rate |
| Design | provided design, template adaptation, custom design, full UI/UX | One starting point is required |
| Content | provided, formatting, copywriting, asset sourcing | Per-page effort appears only for selected services |
| Core features | contact form, CMS/blog, search, authentication, accounts, admin | Accounts require authentication; dependencies are explained |
| Business features | booking, payments, ecommerce, membership, subscriptions | Dependent fields reveal only when needed |
| Integrations | CRM, email, analytics, maps, third-party API, custom API, counts | Counts and complexity are explicit |
| Delivery | urgency, deployment owner, launch support, maintenance, testing, migration, weekly capacity | Rush shows its surcharge before calculation |
| Pricing | minimum hourly value, target margin, contingency, risk, revisions | Margin is defined as margin on revenue, not markup |

“Number of pages” means unique designed/built content pages or application screens. Repeated CMS entries, products, and blog posts are not each counted as pages; their templates, import, and migration effort are handled separately.

## 8. Outputs

Every calculated quote has:

- model version, pricing-configuration identity, and calculation timestamp;
- normalized input snapshot;
- low/expected/high hours by category and total;
- minimum safe price;
- recommended quote;
- recommended low/high range;
- base quote and separately identified rush fee;
- low/high delivery weeks;
- complexity band/reasons and separately reported risk/contingency;
- deposit amount/percentage;
- milestone schedule;
- included revisions and extra-revision price;
- change-order price suggestions;
- maintenance hours and price range, or “not included”;
- generated scope and exclusions;
- a versioned renderer-neutral client quote document suitable for preview, copy, and PDF export;
- human-readable calculation explanation; and
- warnings/assumptions.

## 9. Main flows

### 9.1 First quote

Landing → Build a quote → complete guided steps → review inputs → calculate → inspect results → adjust commercial terms → copy the client summary or export its PDF.

### 9.2 Resume draft

Open product → see “Continue your quote” with last-saved context → resume at last valid step → edit → calculate.

The landing page must still offer “Start a new quote.” Starting over requires confirmation only if meaningful draft data exists.

### 9.3 Return to last result

Open result URL or choose recent quote → validated local result loads → inspect/edit/copy. If no valid result exists, show an empty state with “Build a quote”; do not silently redirect.

### 9.4 Revise inputs

Results → “Edit project details” → builder restores normalized inputs → recalculate → previous commercial overrides are reviewed and reset by default because their basis changed. The product must not silently carry a stale custom quote into a materially changed scope.

### 9.5 Storage/API failure

If persistence fails, calculation continues and an unobtrusive notice explains that the draft will not survive refresh. If clipboard access fails, the summary remains selectable and a manual-copy instruction appears.

## 10. Validation

- Validate per step for useful guidance and validate the complete contract before calculation.
- Put error text next to the field and provide a linked error summary when multiple fields fail.
- Preserve valid data after an error.
- Reject NaN, Infinity, negative money/hours, invalid enum values, percentages outside allowed bounds, impossible dependency combinations, and malformed restored data.
- Proposed bounds are documented in `PRICING_ENGINE_SPEC.md` and must be tested.
- Do not rely on HTML attributes alone; the Zod domain schema is authoritative.

## 11. Free/core functionality

All V1 functionality in this specification is free and works without signup:

- full guided builder;
- full deterministic result;
- scope/exclusion/payment/revision/maintenance generation;
- result editing;
- client summary;
- copy-to-clipboard;
- professional basic PDF export; and
- local draft/latest-result persistence.

There is no artificially disabled “Pro” button in V1.

## 12. Non-goals for V1

- authentication or user accounts;
- cloud synchronization or database persistence;
- subscription billing or payment processing;
- quote email sending;
- e-signatures;
- invoicing;
- CRM/client portal;
- team collaboration or roles;
- AI-generated advice or paid AI APIs;
- admin dashboard;
- mobile applications;
- live market-rate data;
- tax, legal, or jurisdiction-specific advice;
- exchange-rate conversion; and
- the full family of SEO calculators listed for future expansion.

## 13. Future Pro ideas (not commitments)

Future work may include account-based quote history, branded PDF templates, custom logos, cloud-stored PDFs, shareable read-only quote links, reusable scope templates, version comparison, team approval, currency/tax settings, client acceptance, and analytics. Each requires separate product, privacy, security, storage, and pricing decisions. V1 architecture should leave boundaries for these capabilities without displaying or partially implementing them.

## 14. Success measures for V1

Without analytics in the initial implementation, release success is evaluated through product evidence:

- a new user can complete a representative quote without documentation;
- every result line can be explained from inputs and model configuration;
- a user can finish the full flow at 320 px and with keyboard only;
- the client summary is complete enough to paste into an email or document;
- the exported PDF matches the approved client-summary preview and keeps internal pricing details out by default;
- changing a material input predictably changes the affected categories and explanation; and
- all release gates in `QUALITY_GATES.md` pass.

If privacy-respecting analytics are later proposed, event collection and consent require separate approval.

## 15. Decision status

Confirmed by the approved checkpoint:

- “Page count” means unique designed/built pages or screens, not database-driven entries.
- Client location is visible context only and does not change pricing by geography.
- Target profit margin means gross margin on quoted revenue, not markup.
- V1 persists only the active draft and latest result.
- Scope recalculation cannot silently retain stale commercial overrides.
- Launch includes one locally generated WebQuote PDF template; custom branding, logo upload, template selection, and cloud retention are excluded.
- Internal calculation details are excluded from PDF exports unless the user explicitly selects the approved explanation option.

Also confirmed for the V1 starting point:

- All current effort ranges and calibration values in `PRICING_ENGINE_SPEC.md` are approved as versioned, replaceable hypotheses—not industry truths.
- Weekly capacity defaults to 25 hours and remains user-editable.
- Launch PDF output defaults to A4 while preserving a straightforward US Letter seam.
- Formal PDF/UA certification is not a launch requirement. The required baseline is selectable text, appropriate metadata, readable contrast, logical organization where supported, and an equivalent accessible HTML preview.

