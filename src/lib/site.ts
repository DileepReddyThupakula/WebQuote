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
