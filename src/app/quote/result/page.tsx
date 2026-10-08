import { ResultHandoff } from "@/components/quote-builder/result-handoff";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { SiteHeader } from "@/components/site-header";

export default function QuoteResultHandoffPage() {
  return (
    <>
      <SiteHeader variant="workspace" />
      <main id="main-content" tabIndex={-1}>
        <Section size="default">
          <Container>
            <div className="mx-auto max-w-[48rem]">
              <ResultHandoff />
            </div>
          </Container>
        </Section>
      </main>
    </>
  );
}
