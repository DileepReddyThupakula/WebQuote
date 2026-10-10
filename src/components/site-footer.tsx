import { Container } from "@/components/layout/container";
import { feedbackHref } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-6">
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="text-sm text-ink-muted">
          WebQuote · Clearer website project quotes
        </p>
        <a
          className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline underline-offset-4"
          href={feedbackHref}
        >
          Send feedback
        </a>
      </Container>
    </footer>
  );
}
