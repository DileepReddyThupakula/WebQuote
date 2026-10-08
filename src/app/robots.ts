import type { MetadataRoute } from "next";

import { getPublicSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const publicSiteUrl = getPublicSiteUrl();

  if (!publicSiteUrl) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/quote", "/quote/"],
    },
    sitemap: new URL("/sitemap.xml", publicSiteUrl).toString(),
  };
}
