import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { ResultHandoff } from "@/components/quote-builder/result-handoff";
import { loadLatestResult } from "@/features/quote-builder/persistence";

vi.mock("@/features/quote-builder/persistence", () => ({
  loadLatestResult: vi.fn(),
}));

const mockedLoadLatestResult = vi.mocked(loadLatestResult);

describe("ResultHandoff", () => {
  beforeEach(() => {
    mockedLoadLatestResult.mockReset();
  });

  it("keeps the calculated result route minimal and customer-safe", async () => {
    mockedLoadLatestResult.mockReturnValue({
      resultVersion: "quote-result-v1",
    });
    const { container } = render(<ResultHandoff />);

    expect(
      await screen.findByRole("heading", { name: "Your quote is ready" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Quote calculated")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your project inputs and calculation have been saved in this browser.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Detailed pricing, scope, and commercial terms will appear here.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review inputs" })).toHaveAttribute(
      "href",
      "/quote",
    );
    expect(container).not.toHaveTextContent(
      /deterministic result|next approved phase|phase 5 handoff/i,
    );
  });

  it("offers a real route back to the builder when no result is saved", async () => {
    mockedLoadLatestResult.mockReturnValue(null);
    render(<ResultHandoff />);

    expect(
      await screen.findByRole("heading", {
        name: "Start with a project draft",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a quote" })).toHaveAttribute(
      "href",
      "/quote",
    );
  });
});
