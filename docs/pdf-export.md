# Client PDF export

Status: implemented 2026-10-10. Spec: `ARCHITECTURE.md` (PDF/export),
`QUALITY_GATES.md` section 8.

## Decision

| Option | Verdict |
|---|---|
| Browser print-to-PDF with a print stylesheet | Rejected. It renders the results DOM, which the architecture forbids. Output depends on the browser, fonts and the user's print dialog, and its text cannot be tested without a browser. |
| `jspdf` 4.2.1, MIT, loaded lazily | **Chosen.** Draws selectable text from the structured client document; embeds a font with the currency glyphs; works offline. About 330 KB (104 KB gzip) in a separate chunk loaded only on export. |
| `pdf-lib` | Zero heavy deps, but unmaintained since 2022 and needs a second package for custom fonts. |
| `pdfmake` | Heavier; brings its own font and layout runtime. |

jsPDF has optional dependencies (`html2canvas`, `canvg`, `dompurify`,
`core-js`) that are installed but never imported by this code, so none ship in
the bundle. Only the PDF drawing API is used.

## Boundary

- Input is `ClientQuoteDocumentV1` plus an optional sender name and contact
  line. The renderer has no access to the engine result, the results DOM or
  browser storage, so the floor, rate, margin and hours cannot be included.
- `src/infrastructure/pdf/render-client-quote-pdf.ts` renders;
  `src/features/client-summary/pdf-export.ts` loads fonts and downloads.
- The PDF is not stored and not uploaded. Fonts are fetched from this site
  (`/fonts/pdf/`), never from a third party.
- Sender name and contact line are kept in `localStorage` under
  `webquote.sender-profile.v1` (this browser only).

## Fonts

Geist Regular and SemiBold (SIL Open Font License 1.1; licence file in
`public/fonts/pdf/`). Geist includes the ₹, £ and € glyphs. jsPDF subsets the
embedded font; a typical quote is about 40 KB.

## Verification

- `tests/unit/pdf/client-quote-pdf.test.ts`: parses generated PDFs with a
  test-side extractor (`tests/helpers/pdf-text.ts`), checks A4 size, footer,
  page numbers, currency symbols, pagination, sender header, and scans the text
  of every fixture and audit sample for the floor, hourly value, margin and
  hours.
- `tests/e2e/shell.spec.ts`: downloads a real PDF in Chromium and scans it.
