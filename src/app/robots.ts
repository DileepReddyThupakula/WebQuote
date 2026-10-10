import type { MetadataRoute } from "next";

import { getIndexableSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const indexableSiteUrl = getIndexableSiteUrl();

  if (!indexableSiteUrl) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  // Private pages such as /quote/result are not disallowed here: crawlers must
  // be able to fetch them to see their noindex robots meta tag.
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: new URL("/sitemap.xml", indexableSiteUrl).toString(),
  };
}
