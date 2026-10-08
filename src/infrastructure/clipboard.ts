export function browserClipboard(): Pick<Clipboard, "writeText"> | undefined {
  try {
    return typeof navigator === "undefined" ? undefined : navigator.clipboard;
  } catch {
    return undefined;
  }
}
