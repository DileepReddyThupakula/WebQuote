import { afterEach, describe, expect, it, vi } from "vitest";

import { metadata as quoteMetadata } from "@/app/quote/layout";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("metadata route foundations", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps the quote workflow out of search results", () => {
    expect(quoteMetadata.robots).toMatchObject({
      index: false,
      follow: false,
      nocache: true,
    });
  });

  it("uses the configured public origin for crawlable metadata", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://webquote.example.test");
    vi.stubEnv("NODE_ENV", "production");

    expect(robots()).toMatchObject({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/quote", "/quote/"],
      },
      sitemap: "https://webquote.example.test/sitemap.xml",
    });
    expect(sitemap()).toEqual([
      expect.objectContaining({
        url: "https://webquote.example.test/",
      }),
    ]);
  });

  it("fails closed when a production origin is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "production");

    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    });
    expect(sitemap()).toEqual([]);
  });
});
