import { QuoteBuilder } from "@/components/quote-builder/quote-builder";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SiteHeader } from "@/components/site-header";

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
    </>
  );
}
