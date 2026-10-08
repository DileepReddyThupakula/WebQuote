import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Quote workspace",
  description: "WebQuote’s private quote-building workspace.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function QuoteLayout({ children }: { children: ReactNode }) {
  return children;
}
