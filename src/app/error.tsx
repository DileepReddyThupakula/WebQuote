"use client";

import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button, buttonClassName } from "@/components/ui/button";

export default function RouteError({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" tabIndex={-1}>
      <Section size="spacious">
        <Container>
          <div className="max-w-[38rem]">
            <p className="text-sm font-semibold text-danger">
              Unexpected error
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-ink">
              WebQuote could not load this view
            </h1>
            <p className="mt-5 text-lg leading-8 text-ink-muted">
              Your work has not been intentionally cleared. Try the view again,
              or return to the foundation shell.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={reset}>Try again</Button>
              <Link className={buttonClassName("secondary")} href="/">
                Return home
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
