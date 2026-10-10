import type { ClientQuoteDocumentV1 } from "@/features/client-summary/document";
import {
  normalizeSenderProfile,
  type SenderProfile,
} from "@/features/client-summary/sender-profile";
import { downloadBlob } from "@/infrastructure/download";
import type {
  ClientQuotePdfOptions,
  PdfFonts,
} from "@/infrastructure/pdf/render-client-quote-pdf";

export type PdfExportOutcome =
  | Readonly<{ status: "downloaded"; filename: string }>
  | Readonly<{ status: "failed"; reason: "fonts" | "render" | "download" }>;

export type PdfExportDependencies = Readonly<{
  loadFonts: () => Promise<PdfFonts>;
  render: (
    document: ClientQuoteDocumentV1,
    options: ClientQuotePdfOptions,
    fonts: PdfFonts,
  ) => Promise<Uint8Array>;
  download: (blob: Blob, filename: string) => void;
  now: () => Date;
}>;

const FONT_URLS = {
  regular: "/fonts/pdf/Geist-Regular.ttf",
  semiBold: "/fonts/pdf/Geist-SemiBold.ttf",
} as const;

async function fetchFont(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Font request failed: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

/** Same-origin fonts, bundled with the site. No third-party request. */
async function loadBundledFonts(): Promise<PdfFonts> {
  const [regular, semiBold] = await Promise.all([
    fetchFont(FONT_URLS.regular),
    fetchFont(FONT_URLS.semiBold),
  ]);
  return { regular, semiBold };
}

const defaultDependencies: PdfExportDependencies = {
  loadFonts: loadBundledFonts,
  // The renderer, and jsPDF behind it, are loaded only when export is asked for.
  render: async (document, options, fonts) =>
    (
      await import("@/infrastructure/pdf/render-client-quote-pdf")
    ).renderClientQuotePdf(document, options, fonts),
  download: downloadBlob,
  now: () => new Date(),
};

/** A safe, readable file name derived from the project label or type. */
export function pdfFilename(document: ClientQuoteDocumentV1): string {
  const base = (document.projectLabel ?? document.projectType)
    .normalize("NFKD")
    .replace(/[^\x00-\x7f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return `${base || "project"}-quote.pdf`;
}

export function formatPreparedOn(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Builds the PDF from the client-facing document only and downloads it.
 * The document, not the engine result or the page, is the sole input, so
 * internal pricing detail cannot appear in the file.
 */
export async function exportClientQuotePdf(
  document: ClientQuoteDocumentV1,
  profile: SenderProfile,
  dependencies: PdfExportDependencies = defaultDependencies,
): Promise<PdfExportOutcome> {
  let fonts: PdfFonts;
  try {
    fonts = await dependencies.loadFonts();
  } catch {
    return { status: "failed", reason: "fonts" };
  }

  const clean = normalizeSenderProfile(profile);
  let bytes: Uint8Array;
  try {
    bytes = await dependencies.render(
      document,
      {
        senderName: clean.name || undefined,
        contactLine: clean.contact || undefined,
        preparedOn: formatPreparedOn(dependencies.now()),
      },
      fonts,
    );
  } catch {
    return { status: "failed", reason: "render" };
  }

  const filename = pdfFilename(document);
  try {
    dependencies.download(
      new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
      filename,
    );
  } catch {
    return { status: "failed", reason: "download" };
  }
  return { status: "downloaded", filename };
}
