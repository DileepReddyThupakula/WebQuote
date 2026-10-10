import type { Metadata } from "next";

import { getPublicSiteUrl, siteConfig, type PublicPage } from "@/lib/site";

/** Page-level metadata with canonical and Open Graph tags for a public page. */
export function publicPageMetadata(page: PublicPage): Metadata {
  const hasOrigin = getPublicSiteUrl() !== null;
  const title =
    typeof page.title === "string" ? page.title : page.title.absolute;

  return {
    title: page.title,
    description: page.description,
    ...(hasOrigin ? { alternates: { canonical: page.path } } : {}),
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title,
      description: page.description,
      ...(hasOrigin ? { url: page.path } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description: page.description,
    },
  };
}
