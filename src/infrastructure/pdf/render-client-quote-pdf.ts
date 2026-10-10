import type { ClientQuoteDocumentV1 } from "@/features/client-summary/document";
import { formatMoney } from "@/features/client-summary/document";
import { PLANNING_RANGE_NOTE } from "@/features/client-summary/planning-range";

/**
 * Renders a ClientQuoteDocumentV1 to an A4 PDF with selectable text.
 *
 * Input is the client-facing document only. It has no access to the engine
 * result, the results page DOM or browser storage, so internal pricing detail
 * cannot reach the file. The jsPDF library is imported lazily inside
 * `renderClientQuotePdf`, so it stays out of the initial route bundles.
 */

export type PdfFonts = Readonly<{
  regular: Uint8Array;
  semiBold: Uint8Array;
}>;

export type ClientQuotePdfOptions = Readonly<{
  /** Optional name or business name shown in the header. Plain text. */
  senderName?: string | undefined;
  /** Optional single contact line (email, phone, website). Plain text. */
  contactLine?: string | undefined;
  /** Human-readable preparation date, e.g. "10 October 2026". */
  preparedOn?: string | undefined;
}>;

const FOOTER_TEXT = "Prepared with WebQuote";
const FONT_FAMILY = "Geist";

const PAGE = { width: 210, height: 297, margin: 18, footerHeight: 14 } as const;
const COLOR = {
  ink: [28, 32, 30],
  muted: [94, 100, 95],
  accent: [15, 107, 93],
  rule: [216, 218, 212],
} as const;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

/** Removes control characters; PDF text is always treated as plain text. */
export function plainPdfText(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function renderClientQuotePdf(
  document: ClientQuoteDocumentV1,
  options: ClientQuotePdfOptions,
  fonts: PdfFonts,
): Promise<Uint8Array> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
  });

  pdf.addFileToVFS("Geist-Regular.ttf", toBase64(fonts.regular));
  pdf.addFont("Geist-Regular.ttf", FONT_FAMILY, "normal");
  pdf.addFileToVFS("Geist-SemiBold.ttf", toBase64(fonts.semiBold));
  pdf.addFont("Geist-SemiBold.ttf", FONT_FAMILY, "bold");

  const money = (minor: number) => formatMoney(minor, document.currency);
  const title =
    plainPdfText(document.projectLabel ?? "") || document.projectType;
  pdf.setProperties({
    title: `Project quote: ${title}`,
    subject: "Project quote",
    creator: "WebQuote",
  });

  const contentWidth = PAGE.width - PAGE.margin * 2;
  const bottomLimit = PAGE.height - PAGE.margin - PAGE.footerHeight;
  let y = PAGE.margin;

  const setText = (
    weight: "normal" | "bold",
    size: number,
    color: readonly [number, number, number] = COLOR.ink,
  ) => {
    pdf.setFont(FONT_FAMILY, weight);
    pdf.setFontSize(size);
    pdf.setTextColor(color[0], color[1], color[2]);
  };
  const lineHeight = (size: number) => size * 0.4;
  const ensureSpace = (height: number) => {
    if (y + height > bottomLimit) {
      pdf.addPage();
      y = PAGE.margin;
    }
  };
  const paragraph = (
    text: string,
    options: {
      weight?: "normal" | "bold";
      size?: number;
      color?: readonly [number, number, number];
      indent?: number;
      gapAfter?: number;
    } = {},
  ) => {
    const {
      weight = "normal",
      size = 10,
      color = COLOR.ink,
      indent = 0,
      gapAfter = 1.5,
    } = options;
    setText(weight, size, color);
    const lines = pdf.splitTextToSize(
      plainPdfText(text),
      contentWidth - indent,
    ) as string[];
    const step = lineHeight(size) * 1.35;
    for (const line of lines) {
      ensureSpace(step);
      y += step;
      pdf.text(line, PAGE.margin + indent, y);
    }
    y += gapAfter;
  };
  /** Starts a section; `keepWith` is the height that must stay on the same page. */
  const heading = (text: string, keepWith = 14) => {
    ensureSpace(keepWith + 12);
    y += 4;
    paragraph(text, { weight: "bold", size: 12, gapAfter: 2 });
    pdf.setDrawColor(COLOR.rule[0], COLOR.rule[1], COLOR.rule[2]);
    pdf.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
    y += 1;
  };
  const bullet = (text: string) => {
    setText("normal", 10);
    const lines = pdf.splitTextToSize(
      plainPdfText(text),
      contentWidth - 6,
    ) as string[];
    const step = lineHeight(10) * 1.35;
    lines.forEach((line, index) => {
      ensureSpace(step);
      y += step;
      if (index === 0) pdf.text("•", PAGE.margin + 1, y);
      pdf.text(line, PAGE.margin + 6, y);
    });
    y += 0.8;
  };

  // Header: sender (optional), then the quote title block.
  const senderName = plainPdfText(options.senderName ?? "");
  const contactLine = plainPdfText(options.contactLine ?? "");
  if (senderName)
    paragraph(senderName, { weight: "bold", size: 13, gapAfter: 0 });
  if (contactLine)
    paragraph(contactLine, { size: 9, color: COLOR.muted, gapAfter: 0 });
  if (senderName || contactLine) y += 6;

  paragraph("PROJECT QUOTE", {
    weight: "bold",
    size: 9,
    color: COLOR.accent,
    gapAfter: 0,
  });
  paragraph(title, { weight: "bold", size: 20, gapAfter: 1 });
  if (document.projectLabel) {
    paragraph(document.projectType, {
      size: 10,
      color: COLOR.muted,
      gapAfter: 1,
    });
  }
  if (document.clientLabel)
    paragraph(`Prepared for ${document.clientLabel}`, { gapAfter: 1 });
  if (options.preparedOn)
    paragraph(`Prepared on ${options.preparedOn}`, {
      size: 9,
      color: COLOR.muted,
      gapAfter: 3,
    });

  // Price.
  y += 3;
  if (document.price.presentation === "range") {
    paragraph("Planning range", { size: 9, color: COLOR.muted, gapAfter: 0 });
    paragraph(
      `${money(document.price.lowMinor)} – ${money(document.price.highMinor)}`,
      { weight: "bold", size: 22, gapAfter: 1 },
    );
    paragraph(PLANNING_RANGE_NOTE, { size: 9, color: COLOR.muted });
  } else {
    paragraph("Proposed quote", { size: 9, color: COLOR.muted, gapAfter: 0 });
    paragraph(money(document.price.quoteMinor), {
      weight: "bold",
      size: 22,
      gapAfter: 1,
    });
  }
  paragraph(`Expected delivery: ${document.timeline}`, { gapAfter: 2 });

  heading("Included scope");
  for (const item of document.scope) bullet(item);

  heading("Not included");
  for (const item of document.exclusions) bullet(item);

  // The payment plan is short and reads as one table: keep it on one page.
  heading("Payment plan", document.milestones.length * 7);
  for (const item of document.milestones) {
    ensureSpace(7);
    setText("normal", 10);
    y += lineHeight(10) * 1.5;
    const labelLines = pdf.splitTextToSize(
      plainPdfText(item.label),
      contentWidth - 55,
    ) as string[];
    pdf.text(labelLines[0] ?? "", PAGE.margin, y);
    pdf.text(`${item.percentBp / 100}%`, PAGE.margin + contentWidth - 50, y, {
      align: "right",
    });
    setText("bold", 10);
    pdf.text(money(item.amountMinor), PAGE.margin + contentWidth, y, {
      align: "right",
    });
    y += 1.8;
  }

  heading("Revisions and additional work");
  paragraph(
    `${document.revisions.includedRounds} ${document.revisions.includedRounds === 1 ? "round of revisions is" : "rounds of revisions are"} included. An additional round is ${money(document.revisions.extraRoundPriceMinor)}.`,
  );
  if (document.changeRequests.length > 0) {
    paragraph("Additional work is quoted by written change request:", {
      color: COLOR.muted,
      gapAfter: 1,
    });
    for (const item of document.changeRequests)
      bullet(`${item.label}: from ${money(item.priceMinor)}`);
  }

  heading("Support and maintenance");
  paragraph(document.support);
  paragraph(document.maintenance);

  if (document.clientNotes) {
    heading("Notes");
    paragraph(document.clientNotes);
  }

  // Footer and page numbers on every page.
  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    const footerY = PAGE.height - PAGE.margin + 4;
    pdf.setDrawColor(COLOR.rule[0], COLOR.rule[1], COLOR.rule[2]);
    pdf.line(PAGE.margin, footerY - 5, PAGE.width - PAGE.margin, footerY - 5);
    setText("normal", 8, COLOR.muted);
    pdf.text(FOOTER_TEXT, PAGE.margin, footerY);
    pdf.text(
      `Page ${page} of ${pageCount}`,
      PAGE.width - PAGE.margin,
      footerY,
      { align: "right" },
    );
  }

  return new Uint8Array(pdf.output("arraybuffer"));
}
