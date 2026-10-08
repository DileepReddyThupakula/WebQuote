import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { QuoteBuilder } from "@/components/quote-builder/quote-builder";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("QuoteBuilder", () => {
  beforeEach(() => {
    window.localStorage.clear();
    push.mockReset();
  });

  it("moves backward without losing a project input", async () => {
    const user = userEvent.setup();
    render(<QuoteBuilder />);

    const pages = screen.getByRole("spinbutton", { name: "Pages / screens" });
    await user.clear(pages);
    await user.type(pages, "12");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", { name: "Make the starting point clear" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("spinbutton", { name: "Pages / screens" }),
    ).toHaveValue(12);
  });

  it("shows API count fields only after API work is selected", async () => {
    const user = userEvent.setup();
    render(<QuoteBuilder />);

    for (let index = 0; index < 3; index += 1) {
      await user.click(screen.getByRole("button", { name: "Continue" }));
    }

    expect(
      screen.queryByRole("spinbutton", { name: "Third-party APIs" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("checkbox", { name: "Include API work" }),
    );
    expect(
      screen.getByRole("spinbutton", { name: "Third-party APIs" }),
    ).toHaveValue(1);
  });

  it("shows a field error and keeps the user on the current step", async () => {
    const user = userEvent.setup();
    render(<QuoteBuilder />);

    const pages = screen.getByRole("spinbutton", { name: "Pages / screens" });
    await user.clear(pages);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a valid number of pages.",
    );
    expect(
      screen.getByRole("heading", { name: "Start with the shape of the work" }),
    ).toBeInTheDocument();
  });

  it("derives Working Draft statuses strictly from the active step", async () => {
    const user = userEvent.setup();
    const { container } = render(<QuoteBuilder />);
    const status = (step: string) =>
      container
        .querySelector(`[data-workflow-step="${step}"]`)
        ?.getAttribute("data-status");

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(status("project")).toBe("complete");
    expect(status("design")).toBe("current");
    expect(status("features")).toBe("upcoming");
    expect(status("review")).toBe("upcoming");

    for (let index = 0; index < 4; index += 1) {
      await user.click(screen.getByRole("button", { name: "Continue" }));
    }
    expect(status("project")).toBe("complete");
    expect(status("delivery")).toBe("complete");
    expect(status("commercial")).toBe("current");
    expect(status("review")).toBe("upcoming");

    await user.type(
      screen.getByRole("textbox", { name: "Minimum hourly value" }),
      "75",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(status("project")).toBe("complete");
    expect(status("commercial")).toBe("complete");
    expect(status("review")).toBe("current");

    await user.click(screen.getAllByRole("button", { name: "Edit" })[1]!);
    expect(status("project")).toBe("complete");
    expect(status("design")).toBe("current");
    expect(status("features")).toBe("upcoming");
    expect(status("commercial")).toBe("upcoming");
    expect(status("review")).toBe("upcoming");
  });

  it("shows human review labels and readable integration quantities", async () => {
    const user = userEvent.setup();
    const { container } = render(<QuoteBuilder />);

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("radio", { name: "Custom design" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.clear(screen.getByRole("spinbutton", { name: "CRM" }));
    await user.type(screen.getByRole("spinbutton", { name: "CRM" }), "3");
    for (const name of ["Analytics", "Maps"] as const) {
      await user.clear(screen.getByRole("spinbutton", { name }));
      await user.type(screen.getByRole("spinbutton", { name }), "1");
    }
    await user.click(
      screen.getByRole("checkbox", { name: "Include API work" }),
    );
    await user.clear(screen.getByRole("spinbutton", { name: "Custom APIs" }));
    await user.type(
      screen.getByRole("spinbutton", { name: "Custom APIs" }),
      "2",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(
      screen.getByRole("textbox", { name: "Minimum hourly value" }),
      "75",
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Custom design")).toBeInTheDocument();
    expect(screen.getByText("Client supplies content")).toBeInTheDocument();
    expect(screen.getByText("Normal")).toBeInTheDocument();
    expect(screen.getByText("No migration")).toBeInTheDocument();
    expect(screen.getByText("Essential testing")).toBeInTheDocument();
    expect(screen.getByText("I handle deployment")).toBeInTheDocument();
    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(screen.getByText("Medium exposure")).toBeInTheDocument();
    expect(
      screen.getByText(
        "3 CRM integrations, Analytics, Maps, Third-party API, 2 custom APIs",
      ),
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent(
      /deterministic pricing engine|minor units|approved phase|phase 5 handoff/i,
    );
  });
});
