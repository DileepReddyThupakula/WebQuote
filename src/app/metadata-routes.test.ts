import { afterEach, describe, expect, it, vi } from "vitest";

import { metadata as homeMetadata } from "@/app/page";
import { metadata as quoteMetadata } from "@/app/quote/page";
import { metadata as resultMetadata } from "@/app/quote/result/page";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { publicPages } from "@/lib/site";

function stubEnvironment(values: {
  siteUrl?: string | undefined;
  nodeEnv: string;
  vercelEnv?: string | undefined;
}) {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", values.siteUrl ?? "");
  vi.stubEnv("NODE_ENV", values.nodeEnv);
  vi.stubEnv("VERCEL_ENV", values.vercelEnv ?? "");
}

const disallowAll = { rules: { userAgent: "*", disallow: "/" } };

describe("metadata routes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("production-like configuration", () => {
    const production = {
      siteUrl: "https://webquote.example.test",
      nodeEnv: "production",
      vercelEnv: "production",
    };

    it("allows crawling and advertises the sitemap", () => {
      stubEnvironment(production);

      expect(robots()).toEqual({
        rules: { userAgent: "*", allow: "/" },
        sitemap: "https://webquote.example.test/sitemap.xml",
      });
    });

    it("lists exactly the public pages in the sitemap", () => {
      stubEnvironment(production);

      expect(sitemap().map((entry) => entry.url)).toEqual(
        publicPages.map(
          (page) => new URL(page.path, "https://webquote.example.test").href,
        ),
      );
      expect(sitemap().map((entry) => entry.url)).toEqual([
        "https://webquote.example.test/",
        "https://webquote.example.test/quote",
      ]);
    });

    it("works without VERCEL_ENV for self-hosted production builds", () => {
      stubEnvironment({ ...production, vercelEnv: undefined });

      expect(sitemap()).toHaveLength(publicPages.length);
    });

    it("emits canonical and Open Graph URLs for public pages", () => {
      stubEnvironment(production);

      // Page modules compute metadata at import time, so re-import them.
      vi.resetModules();
      return Promise.all([
        import("@/app/page"),
        import("@/app/quote/page"),
      ]).then(([home, quote]) => {
        expect(home.metadata.alternates?.canonical).toBe("/");
        expect(home.metadata.openGraph).toMatchObject({ url: "/" });
        expect(quote.metadata.alternates?.canonical).toBe("/quote");
        expect(quote.metadata.openGraph).toMatchObject({ url: "/quote" });
      });
    });
  });

  describe("preview-like and local configurations", () => {
    it.each([
      [
        "Vercel preview with the production URL set",
        {
          siteUrl: "https://webquote.example.test",
          nodeEnv: "production",
          vercelEnv: "preview",
        },
      ],
      [
        "production build with no site URL",
        { nodeEnv: "production", vercelEnv: "production" },
      ],
      [
        "local development",
        { siteUrl: "https://webquote.example.test", nodeEnv: "development" },
      ],
      ["development with no site URL", { nodeEnv: "development" }],
    ])("blocks crawling: %s", (_name, environment) => {
      stubEnvironment(environment);

      expect(robots()).toEqual(disallowAll);
      expect(sitemap()).toEqual([]);
    });
  });

  describe("page metadata", () => {
    it("writes search copy for the public pages", () => {
      expect(homeMetadata.title).toEqual({
        absolute: "Website Quote Builder for Freelancers | WebQuote",
      });
      expect(homeMetadata.description).toContain("freelancers");
      expect(quoteMetadata.title).toBe("Build a Website Quote");
      expect(quoteMetadata.description).toBeTruthy();
      expect(quoteMetadata.robots).toBeUndefined();
    });

    it("keeps the private result page out of search results", () => {
      expect(resultMetadata.robots).toMatchObject({
        index: false,
        follow: false,
        nocache: true,
      });
      expect(resultMetadata.alternates).toBeUndefined();
    });
  });
});
