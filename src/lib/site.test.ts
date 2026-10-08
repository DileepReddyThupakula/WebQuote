import { resolveSiteUrl } from "@/lib/site";

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
