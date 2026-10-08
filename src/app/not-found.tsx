import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SiteHeader } from "@/components/site-header";
import { buttonClassName } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <Section size="spacious">
          <Container>
            <div className="max-w-[38rem]">
              <p className="text-sm font-semibold text-accent">404</p>
              <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-ink sm:text-5xl">
                This page is not available
              </h1>
              <p className="mt-5 text-lg leading-8 text-ink-muted">
                The address may be incorrect, or the page may not be part of the
                current WebQuote phase.
              </p>
              <Link className={buttonClassName("primary", "mt-8")} href="/">
                Return home
              </Link>
            </div>
          </Container>
        </Section>
      </main>
    </>
  );
}
