import { z } from "zod";

const publicSiteUrlSchema = z
  .string()
  .trim()
  .url()
  .transform((value) => new URL(value))
  .refine(
    (url) => url.protocol === "https:" || url.protocol === "http:",
    "Site URL must use http or https.",
  );

export const siteConfig = {
  name: "WebQuote",
  tagline: "Know what to charge before you send the quote.",
  description:
    "Build a clear project price, scope, payment plan, revision policy, and client-ready quote for your next website project.",
} as const;

/**
 * Plain mailto link for feedback. No form, no tracking: it only opens the
 * visitor's own email program. Never put quote details in the subject or body.
 */
export const feedbackEmail = "founder@webquote.in";
export const feedbackHref = `mailto:${feedbackEmail}?subject=${encodeURIComponent("WebQuote feedback")}`;

/**
 * Public, indexable pages. Add new public pages here: the sitemap and the
 * per-page metadata both read this list. Private pages (for example
 * /quote/result) must not be listed and must set `robots: noindex`.
 */
export const publicPages = [
  {
    path: "/",
    title: {
      absolute: "Website Quote Builder for Freelancers | WebQuote",
    },
    description:
      "Free website quote builder for freelancers and small agencies. Turn project details into a planning range, scope, payment plan, and client-ready quote, with no signup.",
    changeFrequency: "monthly",
    priority: 1,
  },
  {
    path: "/quote",
    title: "Build a Website Quote",
    description:
      "Answer a few questions about a website project and get a planning range, scope, payment plan, and revision policy you can explain to your client.",
    changeFrequency: "monthly",
    priority: 0.8,
  },
] as const;

export type PublicPage = (typeof publicPages)[number];

export function resolveSiteUrl(
  rawValue: string | undefined,
  environment: string | undefined,
): URL | null {
  const value = rawValue?.trim();

  if (value) {
    const parsed = publicSiteUrlSchema.safeParse(value);

    if (!parsed.success) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL must be an absolute http or https URL.",
      );
    }

    return parsed.data;
  }

  if (environment === "development" || environment === "test") {
    return new URL("http://localhost:3000");
  }

  return null;
}

export function getPublicSiteUrl(): URL | null {
  return resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL, process.env.NODE_ENV);
}

/**
 * The origin to advertise to search engines, or null when this deployment must
 * not be crawled. Requires an explicit NEXT_PUBLIC_SITE_URL, a production
 * build, and, on Vercel, the production environment, so preview deployments
 * and local runs stay out of search even when the variable is set everywhere.
 */
export function resolveIndexableSiteUrl(
  rawValue: string | undefined,
  nodeEnv: string | undefined,
  vercelEnv: string | undefined,
): URL | null {
  if (nodeEnv !== "production") {
    return null;
  }

  if (vercelEnv && vercelEnv !== "production") {
    return null;
  }

  if (!rawValue?.trim()) {
    return null;
  }

  return resolveSiteUrl(rawValue, nodeEnv);
}

export function getIndexableSiteUrl(): URL | null {
  return resolveIndexableSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NODE_ENV,
    process.env.VERCEL_ENV,
  );
}
