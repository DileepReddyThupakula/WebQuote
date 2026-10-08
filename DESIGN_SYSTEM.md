# WebQuote Design System

Status: Phase 3 implementation complete — 2026-09-26. PDF document tokens remain a later export concern.

## 1. Design character

WebQuote should feel calm, exact, and commercially credible. It is an operational tool for deciding and communicating a price, not a lifestyle brand or AI showcase.

The visual hierarchy should come from typography, spacing, alignment, rules, and careful numeric presentation. Containers exist to group related content, not to turn every paragraph into a card.

Keywords: restrained, warm, precise, trustworthy, capable.

## 2. Foundations

### 2.1 Color tokens

Proposed light theme:

| Token | Value | Use |
|---|---:|---|
| `canvas` | `#F7F6F2` | Page background |
| `surface` | `#FFFFFF` | Forms, result sections, elevated content |
| `surface-subtle` | `#F0EFEA` | Secondary rows and quiet callouts |
| `ink` | `#1C201E` | Primary text |
| `ink-muted` | `#5E645F` | Secondary text |
| `ink-faint` | `#787E79` | Tertiary text that still passes contrast at intended size |
| `border` | `#D8DAD4` | Default dividers and controls |
| `border-strong` | `#B7BCB6` | Strong separators and active fields |
| `accent` | `#0F6B5D` | Primary actions, links, progress, selected state |
| `accent-hover` | `#0B554A` | Primary hover |
| `accent-soft` | `#E3F0EC` | Selected backgrounds and explanatory highlights |
| `danger` | `#B42318` | Errors/destructive actions |
| `danger-soft` | `#FDEBE8` | Error background |
| `warning` | `#8A4B08` | Warnings, below-floor state |
| `warning-soft` | `#FFF1D6` | Warning background |
| `success` | `#247A52` | Confirmed copy/save state |
| `focus` | `#2A7FCE` | Focus ring distinct from accent and error |

Semantic colors are functional exceptions to the single-accent rule. Do not use them decoratively. All foreground/background pairs must meet WCAG 2.2 AA contrast; normal text target is at least 4.5:1 and large text/UI boundaries at least 3:1.

Dark mode is not a V1 requirement. Do not ship an incomplete automatic dark theme.

### 2.2 Typography

- Primary family: Geist Sans through the Next.js font pipeline; fallback `Inter, ui-sans-serif, system-ui, sans-serif`.
- Numeric/technical labels: Geist Mono sparingly for calculated values, formulas, or step indices—not body copy.
- Body base: 16 px / 1.55 line height.
- Small copy: 14 px / 1.45; never use tiny text for important terms.
- Display: fluid 40–64 px, 1.02–1.08 line height, maximum 16–18 words per line.
- H1 app screen: 32–44 px.
- H2: 24–32 px.
- H3: 18–22 px.
- Labels/buttons: 14–16 px, medium weight.
- Monetary headline: tabular figures, 36–56 px depending on viewport.

Use sentence case. Reserve all-caps for short overlines with increased tracking. Do not use a display serif or multiple decorative families.

### 2.3 Spacing

Use a 4 px base scale:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`

Guidance:

- control internal padding: 10–14 px vertical, 12–16 px horizontal;
- related field gap: 16–20 px;
- form group gap: 28–32 px;
- section gap: 48–72 px;
- landing-page major section gap: 80–112 px on desktop, 56–72 px on mobile;
- never reduce hit targets to create density.

### 2.4 Radius, borders, and shadows

- Small radius: 6 px for badges and compact controls.
- Default radius: 8 px for inputs and buttons.
- Section radius: 12 px for the few bordered panels that need containment.
- Avoid pill shapes except status/toggle labels with short content.
- Default border: 1 px solid `border`.
- Use horizontal rules and open whitespace before adding a card.
- Default surfaces have no shadow.
- Floating/sticky elements may use one restrained shadow: `0 8px 24px rgba(28, 32, 30, 0.08)`.

## 3. Layout

### 3.1 Global frame

- Maximum marketing content width: 1200 px.
- Maximum reading/form width: 760 px.
- Result workspace width: 1180 px with a 7/5 desktop split where useful.
- Page gutters: 16 px at 320–479; 20–24 px at 480–767; 32 px at 768–1199; 40 px at 1200+.
- Use full-width canvas with aligned inner columns; do not place the entire product in one rounded container.

The Phase 3 shared `Container` uses a maximum width of 1280 px and responsive
gutters of 16, 24, 32, and 40 px. Workspace content uses a two-column layout
from large laptop widths upward; the content column remains flexible while the
context column is capped at approximately 304 px. The mobile workspace is one
column and does not depend on horizontal scrolling.

### 3.2 Breakpoints

Design mobile-first around content behavior, with expected reviews at:

- 320 px: minimum supported phone width;
- 375 px: common phone;
- 768 px: tablet/small window;
- 1024 px: laptop/tablet landscape;
- 1440 px: large desktop.

At narrow widths:

- stack form columns;
- keep primary actions reachable without obscuring content;
- allow currency figures to wrap deliberately rather than overflow;
- convert result sidebars to document order;
- preserve visible labels; and
- avoid horizontal scrolling except an explicitly labelled data table wrapper.

## 4. Navigation and page patterns

### 4.1 Header

Use a compact wordmark, one primary “Build a quote” action on marketing pages, and only real navigation. In the builder, replace marketing navigation with a focused product header containing logo/home, saved state, and safe exit/start-over actions.

Mobile navigation must have an accessible name, correct expanded state, focus management, Escape dismissal, and outside-click behavior without trapping the user.

### 4.2 Landing hero

Use an editorial two-column layout or a single strong text column paired with a real product preview. The preview must communicate inputs → result, not a decorative browser mockup full of fake data. Use a solid accent action, warm canvas, thin rules, and no gradient backdrop.

### 4.3 Builder

- One conceptual step per screen.
- Show “Step 2 of 7” plus the step name; do not rely on color alone.
- Use a short orientation sentence before fields.
- Group related choices with `fieldset`/`legend`.
- Prefer radio groups and checkboxes over custom select cards when the choice set is short.
- Reveal dependent fields directly beneath the trigger with a short transition that respects reduced motion.
- Back is secondary; Continue/Calculate is primary.
- Desktop may use a quiet left step list. Mobile uses compact progress text/bar, not a horizontally scrolling stepper.
- Provide a save-state message without announcing every keystroke to screen readers.

### 4.4 Results

The top result uses open layout and typographic emphasis, not a grid of six equal cards. Recommended range is the first visual anchor. Supporting metrics sit in a compact definition list.

Use:

- a bordered breakdown table/list with category, hours, and contribution;
- disclosure for formula detail;
- two-column internal/client sections on wide screens;
- sticky client-summary actions only when they do not cover content;
- an explicit “Calculated” or “Custom” label beside editable commercial values; and
- a persistent warning near, not just above, a custom quote below the safe floor.

### 4.5 PDF document

The launch PDF is a client document, not a screenshot of the result screen. It uses dedicated document tokens and a restrained single-column print layout.

- Default page: A4 portrait with 18–20 mm margins; page-size policy remains a final approval item.
- Header: WebQuote wordmark/title, “Website project quote,” quote date, and optional project/client identifiers.
- Primary amount: prominent but compact enough to remain stable for long currency values and ranges.
- Body order: project summary, amount/timeline, scope, exclusions, milestones, revisions, change requests, maintenance/support, optional notes, then optional calculation explanation.
- Section headings must remain with at least the first content row; avoid orphan headings and split short tables/lists only when necessary.
- Repeat a quiet document title/identifier and page number after page one; do not repeat the large price.
- Use white background, `ink`, `ink-muted`, `border`, and restrained `accent`; do not reproduce app controls, warnings, edit affordances, or navigation.
- Use bundled/embedded type with selectable text and INR/USD/GBP/EUR glyph coverage. Do not rasterize text.
- Use sufficient contrast, logical reading order, document language/title metadata, descriptive link text, and meaningful table headers.
- Internal hourly value, margin, safe floor, effort ledger, contingency math, and configuration data are absent by default. The optional client-readable calculation section appears only after explicit selection.
- Custom logos, brand colors, template selection, background artwork, and decorative cover pages are not V1 features.

## 5. Components

### 5.1 Buttons

**Primary:** solid accent, white text. One dominant primary action per region.  
**Secondary:** white/transparent surface, ink text, visible border.  
**Tertiary:** text/link button for low-emphasis actions.  
**Destructive:** danger text/border; confirmation when work would be lost.

All buttons:

- minimum target size 44 × 44 px;
- visible hover, active, focus-visible, disabled, and busy states;
- stable width where status text changes;
- labels that describe the result (“Copy client quote,” not “Submit”).

Disabled controls must remain legible and have a nearby reason when the cause is not obvious. Prefer allowing an action and showing validation over silently disabling it.

### 5.2 Inputs

- Persistent visible label above control.
- Optional/required status in text where useful; do not rely on asterisks alone.
- Description before error; error is linked with `aria-describedby`.
- Error state changes border and adds icon/text, not color alone.
- Currency input has a non-editable currency prefix/suffix associated with the label.
- Numeric controls accept keyboard entry and do not unexpectedly change on mouse wheel.
- Select/search patterns remain native where possible.
- Choice rows may use a restrained border and selected accent-soft background; they are not oversized marketing cards.

The reusable field set is intentionally small: `InputField` handles text,
number, prefix, suffix, optional, disabled, and error states; `SelectField` and
`CheckboxField` preserve native controls; `TextareaField` handles long text;
`RadioGroupField` provides semantic list/card choices; `SegmentedField` is
reserved for compact mutually exclusive choices; and `FieldGroup` provides a
fieldset/legend boundary for related controls.

Phase 4 uses these primitives as a restrained builder pattern: one conceptual
step per screen, grouped controls instead of a card wall, native numeric inputs
with domain bounds, a visible currency prefix for money, and a definition-list
review of inputs before calculation. The review uses Edit actions to return to a
completed step; it does not expose calculated commercial output before the final
action.

### 5.3 Help and definitions

Important concepts such as gross margin, contingency, unique page, and minimum safe price receive inline one-sentence definitions. Tooltips are supplemental only and must work with keyboard/touch. Never hide essential contract meaning exclusively behind a tooltip.

### 5.4 Notices

- Info: neutral/accent-soft with descriptive heading.
- Warning: warning-soft for below-floor quotes, stale overrides, and local-only storage.
- Error: danger-soft with recovery action.
- Success: brief inline status for copy/save; no celebratory confetti.

Use `role="status"` for non-urgent async feedback and `role="alert"` only for immediate errors that require attention.

`StatusPanel` is the shared loading, empty, error, and unsupported-browser
pattern. It requires a stable heading ID, uses an explicit recovery action when
one is available, and does not expose stack traces. `Disclosure` wraps native
`details`/`summary` so explanation content remains keyboard and touch accessible
without a client-side state abstraction.

### 5.5 Tables and breakdowns

Use semantic tables when comparing aligned numeric columns. Right-align monetary/hour values with tabular figures. On mobile, preserve row labels and values in a stacked definition-list alternative or a scroll region with a clear label; do not clip columns.

Financial presentation primitives are data-only: `MoneyDisplay` formats integer
minor units, `PriceRange` establishes the primary range hierarchy,
`MetricPair` supports secondary metrics, and `DefinitionValue` supports compact
label/value rows. They are not connected to the pricing engine in Phase 3 and
ship without production quote values.

### 5.6 Dialogs

V1 should need at most confirmation dialogs for start-over/clear-data actions. A dialog must trap focus, label itself, close with Escape, restore focus, and never contain a multi-step form.

## 6. Content style

- Direct, professional, and specific.
- Use “planning range,” “estimate,” and “based on your inputs.”
- Avoid “perfect price,” “true market rate,” “AI-powered,” “revolutionary,” and fear-based sales language.
- Explain commercial terms before asking for them.
- Use concrete recovery text: “Your browser blocked clipboard access. Select the quote below and copy it manually.”
- Client-ready copy avoids internal jargon and hedging that undermines the quote.
- Use en dashes for numeric ranges and consistent currency formatting.

## 7. Motion

- Default duration: 120–180 ms for control feedback; up to 240 ms for step/disclosure transitions.
- Animate opacity and short transforms only when they clarify state.
- Do not animate monetary totals from zero, use parallax, loop decorative movement, or delay navigation.
- With `prefers-reduced-motion: reduce`, remove non-essential transitions and scrolling animation.

## 8. Accessibility requirements

- Target WCAG 2.2 AA.
- Logical heading structure with one page H1.
- Skip link to main content.
- Visible focus for every interactive element; focus is never removed without replacement.
- Keyboard completion of every step and result action.
- On step change, move focus to the new step heading without causing disorientation.
- On validation failure, focus the error summary; its links focus fields.
- Group controls semantically and expose selected/expanded states.
- Announce calculate/copy/save results appropriately without noisy live regions.
- Support 200% browser zoom and text resizing without loss of content/action.
- Do not use placeholder text as a label.
- Icons require accessible names when actionable and are hidden when decorative.
- Touch targets are at least 44 × 44 CSS px.

## 9. Product preview and examples

Examples must be clearly labelled “Example” and use generic project descriptors, such as “8-page business website.” Do not imply the example came from a customer. Example prices are generated from a documented fixture using the same engine; they are not handwritten marketing claims.

## 10. Patterns to avoid

- purple/blue or multicolor gradients;
- glows, glass panels, translucent navigation, and excessive shadows;
- a floating rounded card for every content block;
- giant empty hero space with vague copy;
- decorative 3D blobs, robots, sparkles, or AI imagery;
- fake browser chrome that obscures the actual product;
- automatic carousels;
- excessive pills and badges;
- icon-only critical actions;
- low-contrast gray text;
- progress communicated only by color;
- hover-only help;
- animated number theatrics; and
- mobile layouts that merely shrink desktop columns.

## 11. Confirmed direction

- The restrained warm-neutral and deep-teal direction is approved. Do not introduce competing accents later.
- A4 portrait is the launch PDF default; preserve the design-token seam for US Letter.
- The V1 PDF accessibility baseline in section 4.5 is approved. Formal PDF/UA certification is not required and must not be claimed without separate verification.

