import { resolveIndexableSiteUrl, resolveSiteUrl } from "@/lib/site";

describe("resolveSiteUrl", () => {
  it("uses an explicit valid public origin", () => {
    expect(
      resolveSiteUrl("https://quotes.example.test", "production")?.toString(),
    ).toBe("https://quotes.example.test/");
  });

  it("provides a local-only development fallback", () => {
    expect(resolveSiteUrl(undefined, "development")?.toString()).toBe(
      "http://localhost:3000/",
    );
  });

  it("suppresses a false production origin when none is configured", () => {
    expect(resolveSiteUrl(undefined, "production")).toBeNull();
  });

  it("rejects invalid or unsafe configured origins", () => {
    expect(() => resolveSiteUrl("javascript:alert(1)", "production")).toThrow(
      "NEXT_PUBLIC_SITE_URL must be an absolute http or https URL.",
    );
  });
});

describe("resolveIndexableSiteUrl", () => {
  const url = "https://quotes.example.test";

  it("returns the origin only for a production environment", () => {
    expect(resolveIndexableSiteUrl(url, "production", "production")?.href).toBe(
      "https://quotes.example.test/",
    );
    expect(resolveIndexableSiteUrl(url, "production", undefined)?.href).toBe(
      "https://quotes.example.test/",
    );
  });

  it.each([
    [url, "production", "preview"],
    [url, "production", "development"],
    [url, "development", undefined],
    [url, "test", undefined],
    [undefined, "production", "production"],
    ["  ", "production", "production"],
  ])("returns null for %s / %s / %s", (raw, node, vercel) => {
    expect(resolveIndexableSiteUrl(raw, node, vercel)).toBeNull();
  });
});
