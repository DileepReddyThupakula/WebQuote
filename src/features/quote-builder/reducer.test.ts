import { createDefaultDraft } from "@/features/quote-builder/defaults";
import {
  builderReducer,
  INITIAL_BUILDER_STATE,
  updateDraftField,
} from "@/features/quote-builder/reducer";

describe("quote builder reducer", () => {
  it("updates nested draft values without changing other sections", () => {
    const draft = updateDraftField(
      createDefaultDraft(),
      "project.pageCount",
      "12",
    );
    const next = builderReducer(INITIAL_BUILDER_STATE, {
      type: "set-draft",
      draft,
      path: "project.pageCount",
    });

    expect(next.draft.project.pageCount).toBe("12");
    expect(next.draft.pricing.targetMarginPercent).toBe("20");
  });

  it("updates controlled design choices", () => {
    const next = updateDraftField(
      createDefaultDraft(),
      "design.mode",
      "fullUx",
    );

    expect(next.design.mode).toBe("fullUx");
  });

  it("only marks a step complete when continue validates it", () => {
    const next = builderReducer(INITIAL_BUILDER_STATE, {
      type: "complete-step",
      step: "project",
      nextStep: "design",
    });

    expect(next.currentStep).toBe("design");
    expect(next.completedSteps).toEqual(["project"]);
  });

  it("restores a persisted location and clears transient errors", () => {
    const next = builderReducer(
      { ...INITIAL_BUILDER_STATE, errors: { "project.pageCount": "Invalid" } },
      {
        type: "hydrate",
        snapshot: {
          draft: createDefaultDraft(),
          currentStep: "commercial",
          completedSteps: [
            "project",
            "design",
            "features",
            "integrations",
            "delivery",
          ],
          createdAt: "2026-09-27T00:00:00.000Z",
          updatedAt: "2026-09-27T00:01:00.000Z",
        },
      },
    );

    expect(next.currentStep).toBe("commercial");
    expect(next.completedSteps).toHaveLength(5);
    expect(next.errors).toEqual({});
  });

  it("resets all draft values and progress", () => {
    const next = builderReducer(
      {
        ...INITIAL_BUILDER_STATE,
        currentStep: "review",
        completedSteps: ["project"],
      },
      { type: "reset" },
    );
    expect(next).toEqual(INITIAL_BUILDER_STATE);
  });
});
