import { render, screen } from "@testing-library/react";

import {
  getProgressStepStatus,
  StepProgress,
  type ProgressStep,
} from "@/components/ui/step-progress";

const steps: readonly ProgressStep[] = [
  { id: "project", label: "Project" },
  { id: "design", label: "Design & content" },
  { id: "review", label: "Review" },
];

describe("StepProgress", () => {
  it("derives complete, current, and upcoming states", () => {
    expect(getProgressStepStatus(steps, "design", 0)).toBe("complete");
    expect(getProgressStepStatus(steps, "design", 1)).toBe("current");
    expect(getProgressStepStatus(steps, "design", 2)).toBe("upcoming");
  });

  it("uses the active position when a user returns to an earlier step", () => {
    expect(getProgressStepStatus(steps, "project", 1)).toBe("upcoming");
    expect(getProgressStepStatus(steps, "review", 1)).toBe("complete");
  });

  it("exposes progress semantics and current step text", () => {
    render(<StepProgress currentStep="design" steps={steps} />);

    expect(
      screen.getByRole("navigation", { name: "Quote progress" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "2",
    );
    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent?.replace(/\s+/g, " ").trim() === "Step 2 of 3",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Complete")).toHaveLength(1);
    expect(screen.getAllByText("Current")).toHaveLength(1);
    expect(screen.getAllByText("Upcoming")).toHaveLength(1);
  });
});
