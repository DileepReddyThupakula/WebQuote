import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SiteHeader } from "@/components/site-header";
import { buttonClassName } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

const workflowItems = [
  {
    title: "Project requirements",
    description: "Describe the shape, content, and capabilities of the work.",
  },
  {
    title: "Effort and pricing",
    description:
      "Turn visible assumptions into a planning range you can explain.",
  },
  {
    title: "Scope and terms",
    description:
      "Make revisions, payment timing, and boundaries clear before sending.",
  },
] as const;

export default function HomePage() {
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
                WebQuote brings project requirements, effort assumptions, scope,
                and commercial terms into one clear working document.
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
              <p className="text-sm font-semibold text-accent">
                One clear workflow
              </p>
              <h2 className="mt-2 text-[length:var(--text-section-heading)] font-semibold tracking-[-0.025em] text-ink">
                A quote should make its reasoning visible
              </h2>
              <p className="mt-3 text-base leading-7 text-ink-muted">
                Start with what the project needs. Finish with a client-ready
                explanation of what is included, what it costs, and what happens
                next.
              </p>
            </div>
            <div className="mt-10 grid border-t border-border md:grid-cols-3">
              {workflowItems.map((item) => (
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
      </main>
      <footer className="border-t border-border py-6">
        <Container>
          <p className="text-sm text-ink-muted">
            WebQuote · Clearer website project quotes
          </p>
        </Container>
      </footer>
    </>
  );
}
