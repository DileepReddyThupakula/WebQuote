import { browserClipboard } from "@/infrastructure/clipboard";

export type CopyOutcome = "copied" | "manual";

export async function copyClientSummary(
  text: string,
  clipboard: Pick<Clipboard, "writeText"> | undefined = browserClipboard(),
): Promise<CopyOutcome> {
  if (!clipboard?.writeText) return "manual";
  try {
    await clipboard.writeText(text);
    return "copied";
  } catch {
    return "manual";
  }
}
