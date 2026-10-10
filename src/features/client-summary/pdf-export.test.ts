import {
  exportClientQuotePdf,
  formatPreparedOn,
  pdfFilename,
  type PdfExportDependencies,
} from "@/features/client-summary/pdf-export";
import { buildSampleQuote } from "@/features/sample-quote/sample-quote";

const fonts = { regular: new Uint8Array([1]), semiBold: new Uint8Array([2]) };

function dependencies(
  overrides: Partial<PdfExportDependencies> = {},
): PdfExportDependencies & {
  download: ReturnType<typeof vi.fn>;
  render: ReturnType<typeof vi.fn>;
} {
  return {
    loadFonts: vi.fn().mockResolvedValue(fonts),
    render: vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])),
    download: vi.fn(),
    now: () => new Date(2026, 9, 10),
    ...overrides,
  } as never;
}

describe("exportClientQuotePdf", () => {
  it("renders the client document only and downloads a PDF blob", async () => {
    const deps = dependencies();
    const document = buildSampleQuote();
    const outcome = await exportClientQuotePdf(
      document,
      { name: "  Asha  Rao ", contact: "asha@example.com" },
      deps,
    );
    expect(outcome).toEqual({
      status: "downloaded",
      filename: "business-website-quote.pdf",
    });
    expect(deps.render).toHaveBeenCalledTimes(1);
    const [renderedDocument, options, passedFonts] = deps.render.mock.calls[0]!;
    expect(renderedDocument).toBe(document);
    expect(options).toEqual({
      senderName: "Asha Rao",
      contactLine: "asha@example.com",
      preparedOn: "10 October 2026",
    });
    expect(passedFonts).toBe(fonts);
    const [blob, filename] = deps.download.mock.calls[0]!;
    expect((blob as Blob).type).toBe("application/pdf");
    expect(filename).toBe("business-website-quote.pdf");
  });

  it("omits empty sender fields", async () => {
    const deps = dependencies();
    await exportClientQuotePdf(
      buildSampleQuote(),
      { name: " ", contact: "" },
      deps,
    );
    expect(deps.render.mock.calls[0]![1]).toMatchObject({
      senderName: undefined,
      contactLine: undefined,
    });
  });

  it.each([
    ["fonts", { loadFonts: vi.fn().mockRejectedValue(new Error("offline")) }],
    ["render", { render: vi.fn().mockRejectedValue(new Error("boom")) }],
    [
      "download",
      {
        download: vi.fn(() => {
          throw new Error("blocked");
        }),
      },
    ],
  ] as const)(
    "reports a %s failure without throwing",
    async (reason, override) => {
      const deps = dependencies(override as Partial<PdfExportDependencies>);
      const outcome = await exportClientQuotePdf(
        buildSampleQuote(),
        { name: "", contact: "" },
        deps,
      );
      expect(outcome).toEqual({ status: "failed", reason });
      if (reason !== "download") expect(deps.download).not.toHaveBeenCalled();
    },
  );
});

describe("pdfFilename", () => {
  const base = buildSampleQuote();
  it.each([
    [undefined, "business-website-quote.pdf"],
    ["Acme — Spring Launch!", "acme-spring-launch-quote.pdf"],
    ["../../etc/passwd", "etc-passwd-quote.pdf"],
    ["नमस्ते", "project-quote.pdf"],
    ["a".repeat(200), `${"a".repeat(60)}-quote.pdf`],
    ["  ", "business-website-quote.pdf"],
  ])("sanitizes %j", (label, expected) => {
    const document = {
      ...base,
      ...(label?.trim() ? { projectLabel: label } : {}),
    };
    expect(pdfFilename(document)).toBe(expected);
  });
});

describe("formatPreparedOn", () => {
  it("formats a long English date", () => {
    expect(formatPreparedOn(new Date(2026, 0, 5))).toBe("5 January 2026");
  });
});
