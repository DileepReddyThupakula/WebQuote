import { render, screen } from "@testing-library/react";

import { SiteFooter } from "@/components/site-footer";
import { feedbackEmail, feedbackHref } from "@/lib/site";

describe("SiteFooter", () => {
  it("offers a plain mailto feedback link and nothing that tracks", () => {
    render(<SiteFooter />);
    const link = screen.getByRole("link", { name: "Send feedback" });
    expect(feedbackEmail).toBe("founder@webquote.in");
    expect(link).toHaveAttribute("href", feedbackHref);
    expect(feedbackHref).toBe(
      "mailto:founder@webquote.in?subject=WebQuote%20feedback",
    );
    expect(link).not.toHaveAttribute("ping");
    expect(link).not.toHaveAttribute("target");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("puts no quote data in the mailto link", () => {
    expect(feedbackHref).not.toMatch(/body=|price|quote=|rate/i);
  });
});
