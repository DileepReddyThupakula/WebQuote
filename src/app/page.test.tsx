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
});
