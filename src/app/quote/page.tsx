import type { Metadata } from "next";

import { publicPageMetadata } from "@/lib/seo";
import { publicPages } from "@/lib/site";
import { QuoteBuilder } from "@/components/quote-builder/quote-builder";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = publicPageMetadata(publicPages[1]);

export default function QuoteWorkspacePage() {
  return (
    <>
      <SiteHeader variant="workspace" />
      <main id="main-content" tabIndex={-1}>
        <Section size="default">
          <Container>
            <QuoteBuilder />
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
