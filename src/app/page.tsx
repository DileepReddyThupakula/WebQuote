import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SampleQuote } from "@/components/landing/sample-quote";
import { buttonClassName } from "@/components/ui/button";
import { publicPageMetadata } from "@/lib/seo";
import { buildSampleQuote } from "@/features/sample-quote/sample-quote";
import { publicPages, siteConfig } from "@/lib/site";

const outcomes = [
  {
    title: "A price you can explain",
    description:
      "A recommended quote built from your own hourly value and the margin you want, plus a lowest price you should not go under.",
  },
  {
    title: "Scope your client can read",
    description:
      "A plain list of what is included and what is not, with the number of revision rounds written into the price.",
  },
  {
    title: "Terms with numbers on them",
    description:
      "A payment plan with deposit and milestone amounts, and set prices for extra pages, extra revision rounds and add-on integrations.",
  },
] as const;

const steps = [
  {
    title: "Describe the project",
    description:
      "Pick the project type, the number of pages, the design and content you are providing, and the features and integrations you need.",
  },
  {
    title: "Set your rate and margin",
    description:
      "Enter the lowest hourly value you will accept and the margin you want. Where your client is based does not change the price.",
  },
  {
    title: "Review, adjust and copy",
    description:
      "Check the price, change any figure you disagree with (you can always restore the calculated one), then copy the client summary into your proposal.",
  },
] as const;

export const metadata: Metadata = publicPageMetadata(publicPages[0]);

export default function HomePage() {
  const sampleQuote = buildSampleQuote();

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <Section size="spacious">
          <Container>
            <div className="max-w-[54rem]">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.12em] text-accent">
                Website project quoting
              </p>
              <h1 className="max-w-[15ch] text-pretty text-[length:var(--text-display)] font-semibold leading-[1.04] tracking-[-0.045em] text-ink">
                {siteConfig.tagline}
              </h1>
              <p className="mt-6 max-w-[45rem] text-lg leading-8 text-ink-muted sm:text-xl">
                Answer a few questions about a website project. WebQuote gives
                you a recommended price, a scope your client can read, a payment
                plan and a revision policy, ready to paste into your proposal.
                It is free and needs no account.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link className={buttonClassName("primary")} href="/quote">
                  Build a quote
                </Link>
              </div>
            </div>
          </Container>
        </Section>

        <Section className="border-t border-border" size="compact">
          <Container>
            <div className="max-w-[46rem]">
              <h2 className="text-[length:var(--text-section-heading)] font-semibold tracking-[-0.025em] text-ink">
                What you get from each quote
              </h2>
            </div>
            <div className="mt-8 grid border-t border-border md:grid-cols-3">
              {outcomes.map((item) => (
                <article
                  className="border-b border-border py-6 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
                  key={item.title}
                >
                  <h3 className="text-base font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </Section>

        <Section
          aria-labelledby="sample-heading"
          className="border-t border-border"
          size="compact"
        >
          <Container>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12">
              <div>
                <h2
                  className="text-[length:var(--text-section-heading)] font-semibold tracking-[-0.025em] text-ink"
                  id="sample-heading"
                >
                  See a finished quote
                </h2>
                <p className="mt-3 text-base leading-7 text-ink-muted">
                  This is what your client receives for an example project: a
                  5-page business website with a template design, a contact form
                  and analytics.
                </p>
                <p className="mt-3 text-base leading-7 text-ink-muted">
                  The figures were calculated by the same engine you use. The
                  client sees the price, scope and terms only. Your hourly
                  value, margin and working hours stay with you.
                </p>
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  WebQuote gives a planning figure from your inputs and
                  documented effort assumptions. It is not a market price and it
                  is not guaranteed.
                </p>
              </div>
              <SampleQuote document={sampleQuote} />
            </div>
          </Container>
        </Section>

        <Section className="border-t border-border" size="compact">
          <Container>
            <h2 className="text-[length:var(--text-section-heading)] font-semibold tracking-[-0.025em] text-ink">
              How it works
            </h2>
            <ol className="mt-8 grid border-t border-border md:grid-cols-3">
              {steps.map((item, index) => (
                <li
                  className="border-b border-border py-6 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
                  key={item.title}
                >
                  <p className="text-sm font-semibold text-accent">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {item.description}
                  </p>
                </li>
              ))}
            </ol>
          </Container>
        </Section>

        <Section
          aria-labelledby="privacy-heading"
          className="border-t border-border"
          size="compact"
        >
          <Container>
            <div className="max-w-[46rem]">
              <h2
                className="text-[length:var(--text-section-heading)] font-semibold tracking-[-0.025em] text-ink"
                id="privacy-heading"
              >
                Your work stays on your device
              </h2>
              <p className="mt-3 text-base leading-7 text-ink-muted">
                There is no account and no sign-up. Your drafts and quotes are
                saved in this browser only, on this device, and are not sent to
                a server. Clearing your browser&apos;s site data removes them.
              </p>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
