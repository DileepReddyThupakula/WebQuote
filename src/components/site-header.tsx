import Link from "next/link";

import { Container } from "@/components/layout/container";

export function SiteHeader({
  variant = "public",
}: {
  variant?: "public" | "workspace";
}) {
  const isWorkspace = variant === "workspace";

  return (
    <header className="border-b border-border bg-canvas/95">
      <Container className="flex min-h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            aria-label="WebQuote home"
            className="inline-flex min-h-11 items-center gap-2 text-base font-bold tracking-[-0.02em] text-ink no-underline"
            href="/"
          >
            <span aria-hidden="true" className="wordmark-mark" />
            <span>WebQuote</span>
          </Link>
          {isWorkspace ? (
            <>
              <span
                aria-hidden="true"
                className="h-5 w-px bg-border-strong max-[22rem]:hidden"
              />
              <span className="truncate text-sm text-ink-muted max-[22rem]:hidden">
                Quote workspace
              </span>
            </>
          ) : null}
        </div>
        <nav
          aria-label={
            isWorkspace ? "Workspace navigation" : "Primary navigation"
          }
        >
          <Link
            className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-ink-muted no-underline transition-colors hover:bg-surface-subtle hover:text-ink"
            href={isWorkspace ? "/" : "/quote"}
          >
            {isWorkspace ? "Overview" : "Quote workspace"}
          </Link>
        </nav>
      </Container>
    </header>
  );
}
