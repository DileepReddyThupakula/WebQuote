import { inflateSync } from "node:zlib";

/**
 * Minimal PDF text extractor for tests. It understands exactly what the
 * WebQuote exporter produces: Flate-compressed content streams that show
 * text with Type0 / Identity-H fonts and a ToUnicode CMap per font.
 * It lets tests assert on what a reader would see and select.
 */
export type ExtractedPdf = Readonly<{
  pageCount: number;
  pages: readonly string[];
  /** All page text joined with newlines. */
  text: string;
  /** Raw document information dictionary (title, subject, creator, ...). */
  info: string;
  /** Page size of the first page, in PDF points. */
  mediaBox: readonly [number, number];
  fonts: readonly string[];
}>;

type PdfObject = { id: number; dict: string; stream: Buffer | null };

function parseObjects(bytes: Uint8Array): PdfObject[] {
  const source = Buffer.from(bytes).toString("latin1");
  const objects: PdfObject[] = [];
  const pattern = /(\d+) 0 obj\s*([\s\S]*?)endobj/g;
  for (const match of source.matchAll(pattern)) {
    const id = Number(match[1]);
    const body = match[2] ?? "";
    const streamAt = body.indexOf("stream");
    if (streamAt === -1) {
      objects.push({ id, dict: body, stream: null });
      continue;
    }
    const dict = body.slice(0, streamAt);
    let start = streamAt + "stream".length;
    if (body.startsWith("\r\n", start)) start += 2;
    else start += 1;
    const end = body.lastIndexOf("endstream");
    let data = Buffer.from(body.slice(start, end), "latin1");
    if (dict.includes("FlateDecode")) data = inflateSync(data);
    objects.push({ id, dict, stream: data });
  }
  return objects;
}

function parseCMap(cmap: string): Map<number, string> {
  const map = new Map<number, string>();
  const unicode = (hex: string) =>
    String.fromCharCode(
      ...(hex.match(/.{4}/g) ?? []).map((unit) => parseInt(unit, 16)),
    );
  for (const block of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const row of (block[1] ?? "").matchAll(
      /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g,
    )) {
      map.set(parseInt(row[1]!, 16), unicode(row[2]!));
    }
  }
  for (const block of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const row of (block[1] ?? "").matchAll(
      /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g,
    )) {
      const from = parseInt(row[1]!, 16);
      const to = parseInt(row[2]!, 16);
      const base = parseInt(row[3]!, 16);
      for (let code = from; code <= to; code += 1)
        map.set(code, String.fromCharCode(base + code - from));
    }
  }
  return map;
}

export function extractPdfText(bytes: Uint8Array): ExtractedPdf {
  const header = Buffer.from(bytes.subarray(0, 5)).toString("latin1");
  if (header !== "%PDF-") throw new Error("Not a PDF file.");

  const objects = parseObjects(bytes);
  const byId = new Map(objects.map((object) => [object.id, object]));

  // Resource name (e.g. F15) -> character map, through the Type0 font object.
  const fontMaps = new Map<string, Map<number, string>>();
  const fontNames: string[] = [];
  for (const object of objects) {
    for (const match of object.dict.matchAll(/\/(F\d+) (\d+) 0 R/g)) {
      const font = byId.get(Number(match[2]));
      const toUnicode = font?.dict.match(/\/ToUnicode (\d+) 0 R/);
      const cmap = toUnicode ? byId.get(Number(toUnicode[1])) : undefined;
      if (font && cmap?.stream) {
        fontMaps.set(match[1]!, parseCMap(cmap.stream.toString("latin1")));
        const name = font.dict.match(/\/BaseFont \/([^\s/]+)/);
        if (name?.[1] && !fontNames.includes(name[1])) fontNames.push(name[1]);
      }
    }
  }

  const pageObjects = objects.filter((object) =>
    /\/Type \/Page\b(?!s)/.test(object.dict),
  );
  const pages = pageObjects.map((page) => {
    const contentId = Number(page.dict.match(/\/Contents (\d+) 0 R/)?.[1]);
    const content = byId.get(contentId)?.stream?.toString("latin1") ?? "";
    let current = new Map<number, string>();
    const pieces: string[] = [];
    for (const token of content.matchAll(
      /\/(F\d+) [\d.]+ Tf|<([0-9a-fA-F]+)>\s*Tj|\(((?:\\.|[^\\)])*)\)\s*Tj/g,
    )) {
      if (token[1]) {
        current = fontMaps.get(token[1]) ?? new Map();
      } else if (token[2]) {
        const hex = token[2];
        let text = "";
        for (let index = 0; index + 4 <= hex.length; index += 4) {
          text += current.get(parseInt(hex.slice(index, index + 4), 16)) ?? "�";
        }
        pieces.push(text);
      } else if (token[3] !== undefined) {
        pieces.push(token[3].replace(/\\(.)/g, "$1"));
      }
    }
    return pieces.join("\n");
  });

  const info =
    objects.find((object) => object.dict.includes("/Producer"))?.dict ?? "";
  const box =
    pageObjects[0]?.dict.match(/\/MediaBox \[([^\]]+)\]/)?.[1] ?? "0 0 0 0";
  const [width = 0, height = 0] = box.trim().split(/\s+/).slice(2).map(Number);

  return {
    pageCount: pages.length,
    pages,
    text: pages.join("\n"),
    info,
    mediaBox: [width, height],
    fonts: fontNames,
  };
}
