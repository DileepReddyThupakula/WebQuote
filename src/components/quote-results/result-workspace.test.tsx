import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ResultWorkspace } from "@/components/quote-results/result-workspace";
import { calculateQuote, PRICING_CONFIG_V1 } from "@/domain/quote";
import { formatMoney } from "@/features/client-summary/document";
import {
  clearPersistedQuote,
  RESULT_STORAGE_KEY,
  saveLatestResult,
} from "@/features/quote-builder/persistence";
import { quoteFixtures } from "../../../tests/fixtures/quotes/v1";

function fixture(input: typeof quoteFixtures.smallBusinessSite) {
  const outcome = calculateQuote(input, PRICING_CONFIG_V1);
  if (!outcome.ok) throw new Error("invalid fixture");
  return outcome.result;
}

const quotes = [
  fixture(quoteFixtures.simpleLandingPage),
  fixture(quoteFixtures.smallBusinessSite),
  fixture(quoteFixtures.saasWebApplication),
];

describe("ResultWorkspace", () => {
  beforeEach(() => {
    clearPersistedQuote();
    window.localStorage.clear();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
  });

  it.each(quotes)(
    "renders engine totals, separate complexity and risk, and the internal ledger",
    async (quote) => {
      saveLatestResult(quote);
      render(<ResultWorkspace />);
      expect(
        await screen.findByRole("heading", {
          name: /Recommended planning range based on your project scope/,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          `${formatMoney(quote.pricing.rangeLowMinor, quote.pricing.currency)}–${formatMoney(quote.pricing.rangeHighMinor, quote.pricing.currency)}`,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getAllByText(
          formatMoney(quote.pricing.minimumSafeMinor, quote.pricing.currency),
        ).length,
      ).toBeGreaterThan(0);
      expect(screen.getByText("Complexity")).toBeInTheDocument();
      expect(screen.getByText("Risk / contingency")).toBeInTheDocument();
      const disclosure = screen.getByText(
        "How this was calculated · internal details",
      );
      expect(disclosure).toBeInTheDocument();
      expect(screen.getByText("Expected direct effort")).toBeInTheDocument();
      const preview = screen.getByRole("article");
      expect(preview).not.toHaveTextContent("Hourly cost basis");
      expect(preview).not.toHaveTextContent("Target margin");
    },
  );

  it.each([
    [{ lowWeeks: 2, expectedWeeks: 2, highWeeks: 2 }, "2 weeks", "2 weeks"],
    [
      { lowWeeks: 2, expectedWeeks: 3, highWeeks: 4 },
      "3 weeks expected (2–4 weeks planned)",
      "2–4 weeks",
    ],
  ])(
    "shows an equal planned timeline once and an unequal one as a range",
    async (weeks, summary, statement) => {
      const quote = {
        ...quotes[1]!,
        timeline: { ...quotes[1]!.timeline, ...weeks },
      };
      saveLatestResult(quote);
      render(<ResultWorkspace />);
      const label = await screen.findByText("Expected timeline");
      expect(label.nextElementSibling).toHaveTextContent(summary);
      expect(label.nextElementSibling?.textContent).not.toMatch(/(\d)–\1\b/);
      expect(screen.getByLabelText(/Delivery statement/)).toHaveAttribute(
        "placeholder",
        statement,
      );
      expect(screen.getByRole("article")).toHaveTextContent(
        `Expected delivery: ${statement}`,
      );
    },
  );

  it("offers mailto feedback links and no feedback form", async () => {
    saveLatestResult(quotes[1]!);
    render(<ResultWorkspace />);
    await screen.findByRole("article");
    const links = screen.getAllByRole("link", { name: "Send feedback" });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links)
      expect(link).toHaveAttribute(
        "href",
        "mailto:founder@webquote.in?subject=WebQuote%20feedback",
      );
  });

  it("marks and resets a below-floor quote without blocking the client preview", async () => {
    const user = userEvent.setup();
    const quote = quotes[1]!;
    saveLatestResult(quote);
    render(<ResultWorkspace />);
    const amount = await screen.findByRole("textbox", {
      name: /Final quoted amount/,
    });
    await user.clear(amount);
    await user.type(amount, "0");
    expect(
      screen.getByText("Below your minimum safe price"),
    ).toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveTextContent(
      formatMoney(0, quote.pricing.currency),
    );
    expect((amount as HTMLInputElement).labels?.[0]).toHaveTextContent(
      "Custom",
    );
    await user.click(
      within(amount.parentElement!).getByRole("button", { name: "Restore" }),
    );
    expect(
      screen.queryByText("Below your minimum safe price"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveTextContent(
      formatMoney(quote.pricing.recommendedMinor, quote.pricing.currency),
    );
  });

  it("blocks client preview on an invalid milestone total and restores it", async () => {
    const user = userEvent.setup();
    saveLatestResult(quotes[1]!);
    render(<ResultWorkspace />);
    const first = (
      await screen.findAllByRole("textbox", { name: /calculated.*%/ })
    )[0]!;
    await user.clear(first);
    await user.type(first, "1");
    expect(
      screen.getByText(/Must equal 100% before client preview or copy/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy client summary" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Restore milestones" }),
    );
    expect(screen.getByRole("article")).toBeInTheDocument();
  });

  it("supports clipboard success and the selectable manual fallback", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    saveLatestResult(quotes[1]!);
    render(<ResultWorkspace />);
    await screen.findByRole("article");
    await user.click(
      screen.getByRole("button", { name: "Copy client summary" }),
    );
    await waitFor(() =>
      expect(screen.getByText("Copied client summary.")).toBeInTheDocument(),
    );
    expect(writeText).toHaveBeenCalledOnce();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    await user.click(
      screen.getByRole("button", { name: "Copy client summary" }),
    );
    await waitFor(() =>
      expect(
        screen.getByText(/Select and copy the text above manually/),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("textbox", { name: "Client-ready text" }),
    ).toHaveAttribute("readonly");
  });

  it("shows a working empty-state link for absent or corrupt results", async () => {
    render(<ResultWorkspace />);
    expect(
      await screen.findByRole("heading", { name: "No valid quote to show" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Build a quote" })).toHaveAttribute(
      "href",
      "/quote",
    );
    clearPersistedQuote();
    window.localStorage.setItem(RESULT_STORAGE_KEY, "{");
    const { unmount } = render(<ResultWorkspace />);
    await screen.findAllByRole("heading", { name: "No valid quote to show" });
    unmount();
  });
});
