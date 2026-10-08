import { render, screen } from "@testing-library/react";

import { Disclosure } from "@/components/ui/disclosure";
import { StatusPanel } from "@/components/ui/status-panel";

describe("status and disclosure primitives", () => {
  it("uses native disclosure semantics", () => {
    render(
      <Disclosure summary="How this works">
        The detail stays available without a client-side component.
      </Disclosure>,
    );

    expect(screen.getByText("How this works").tagName).toBe("SUMMARY");
    expect(screen.getByText(/The detail stays available/)).toBeInTheDocument();
  });

  it("exposes recoverable status semantics", () => {
    render(
      <StatusPanel
        id="browser-support"
        title="Use a current browser"
        tone="unsupported"
      >
        This workspace needs local browser storage and clipboard support.
      </StatusPanel>,
    );

    expect(
      screen.getByRole("heading", { name: "Use a current browser" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Browser support needed")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Use a current browser" }),
    ).toBeInTheDocument();
  });
});
