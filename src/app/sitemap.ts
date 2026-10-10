import type { MetadataRoute } from "next";

import { getIndexableSiteUrl, publicPages } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const indexableSiteUrl = getIndexableSiteUrl();

  if (!indexableSiteUrl) {
    return [];
  }

  return publicPages.map((page) => ({
    url: new URL(page.path, indexableSiteUrl).toString(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
