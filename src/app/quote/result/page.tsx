import type { Metadata } from "next";

import { ResultWorkspace } from "@/components/quote-results/result-workspace";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Your quote",
  description: "Your private WebQuote result, stored in this browser.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function QuoteResultPage() {
  return (
    <>
      <SiteHeader variant="workspace" />
      <main id="main-content" tabIndex={-1}>
        <Section size="default">
          <Container>
            <div className="mx-auto max-w-[73.75rem]">
              <ResultWorkspace />
            </div>
          </Container>
        </Section>
      </main>
    </>
  );
}
