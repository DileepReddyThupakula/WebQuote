"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { buttonClassName } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { loadLatestResult } from "@/features/quote-builder/persistence";

export function ResultHandoff() {
  const [hasResult, setHasResult] = useState<boolean | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const timeout = window.setTimeout(() => {
      if (!mounted.current) return;
      setHasResult(loadLatestResult() !== null);
    }, 0);
    return () => {
      mounted.current = false;
      window.clearTimeout(timeout);
    };
  }, []);

  if (hasResult === null) {
    return (
      <p className="text-sm text-ink-muted">
        Checking this browser&apos;s saved quote…
      </p>
    );
  }

  if (!hasResult) {
    return (
      <div className="grid gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
            No calculated quote
          </p>
          <h1 className="mt-3 text-[length:var(--text-page-title)] font-semibold tracking-[-0.04em] text-ink">
            Start with a project draft
          </h1>
          <p className="mt-4 text-base leading-7 text-ink-muted sm:text-lg">
            Complete the guided inputs before opening the quote results.
          </p>
        </div>
        <Link className={buttonClassName("primary", "w-fit")} href="/quote">
          Start a quote
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">
          Quote calculated
        </p>
        <h1 className="mt-3 text-[length:var(--text-page-title)] font-semibold tracking-[-0.04em] text-ink">
          Your quote is ready
        </h1>
        <p className="mt-4 text-base leading-7 text-ink-muted sm:text-lg">
          Your project inputs and calculation have been saved in this browser.
        </p>
      </div>
      <Notice title="Quote details">
        Detailed pricing, scope, and commercial terms will appear here.
      </Notice>
      <div className="flex flex-wrap gap-3">
        <Link className={buttonClassName("secondary")} href="/quote">
          Review inputs
        </Link>
        <Link className={buttonClassName("primary")} href="/">
          Return home
        </Link>
      </div>
    </div>
  );
}
