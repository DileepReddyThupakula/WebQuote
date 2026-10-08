import type { MetadataRoute } from "next";

import { getPublicSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicSiteUrl = getPublicSiteUrl();

  if (!publicSiteUrl) {
    return [];
  }

  return [
    {
      url: new URL("/", publicSiteUrl).toString(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
