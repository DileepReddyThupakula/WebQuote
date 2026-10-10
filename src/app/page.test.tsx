import { render, screen } from "@testing-library/react";

import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the product introduction with a working workspace destination", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Know what to charge before you send the quote.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Build a quote" })).toHaveAttribute(
      "href",
      "/quote",
    );
  });

  it("explains the outcome, shows a finished sample quote, the steps, and privacy", () => {
    render(<HomePage />);

    for (const name of [
      "What you get from each quote",
      "See a finished quote",
      "How it works",
      "Your work stays on your device",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name }),
      ).toBeInTheDocument();
    }
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(5);
    const sample = screen.getByRole("article", {
      name: "Sample client quote",
    });
    expect(sample).toHaveTextContent("Included scope");
    expect(sample).toHaveTextContent("Payment plan");
  });

  it("offers one build-a-quote call to action and no invented social proof", () => {
    render(<HomePage />);
    expect(screen.getAllByRole("link", { name: "Build a quote" })).toHaveLength(
      1,
    );
    expect(document.body).not.toHaveTextContent(
      /testimonial|trusted by|customers|\d+\+? (users|freelancers|agencies)/i,
    );
    expect(document.body).not.toHaveTextContent(/minimum safe|hourly value:/i);
  });

  it("links to feedback by email in the footer", () => {
    render(<HomePage />);
    expect(screen.getByRole("link", { name: "Send feedback" })).toHaveAttribute(
      "href",
      "mailto:founder@webquote.in?subject=WebQuote%20feedback",
    );
  });
});
