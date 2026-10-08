import { createDefaultDraft } from "@/features/quote-builder/defaults";
import type {
  BuilderState,
  BuilderStepId,
  FieldErrors,
  PersistedDraftSnapshot,
  QuoteBuilderDraft,
} from "@/features/quote-builder/types";

export const INITIAL_BUILDER_STATE: BuilderState = {
  draft: createDefaultDraft(),
  currentStep: "project",
  completedSteps: [],
  errors: {},
};

export type BuilderAction =
  | Readonly<{ type: "set-draft"; draft: QuoteBuilderDraft; path?: string }>
  | Readonly<{ type: "set-errors"; errors: FieldErrors }>
  | Readonly<{ type: "clear-errors" }>
  | Readonly<{
      type: "complete-step";
      step: BuilderStepId;
      nextStep: BuilderStepId;
    }>
  | Readonly<{ type: "go-to-step"; step: BuilderStepId }>
  | Readonly<{ type: "hydrate"; snapshot: PersistedDraftSnapshot }>
  | Readonly<{ type: "reset" }>;

export function updateDraftField(
  draft: QuoteBuilderDraft,
  path: string,
  value: string | boolean,
): QuoteBuilderDraft {
  const [section, field] = path.split(".");
  if (!section || !field) return draft;

  if (section === "features" && field in draft.features) {
    return {
      ...draft,
      features: { ...draft.features, [field]: Boolean(value) },
    };
  }
  if (section === "integrations" && field in draft.integrations) {
    return {
      ...draft,
      integrations: { ...draft.integrations, [field]: String(value) },
    };
  }
  if (section === "project" && field in draft.project) {
    return {
      ...draft,
      project: { ...draft.project, [field]: value },
    } as QuoteBuilderDraft;
  }
  if (section === "design" && field === "mode") {
    return {
      ...draft,
      design: { mode: String(value) } as QuoteBuilderDraft["design"],
    };
  }
  if (section === "content" && field in draft.content) {
    return {
      ...draft,
      content: { ...draft.content, [field]: value },
    } as QuoteBuilderDraft;
  }
  if (section === "delivery" && field in draft.delivery) {
    return {
      ...draft,
      delivery: { ...draft.delivery, [field]: value },
    } as QuoteBuilderDraft;
  }
  if (section === "pricing" && field in draft.pricing) {
    return {
      ...draft,
      pricing: { ...draft.pricing, [field]: value },
    } as QuoteBuilderDraft;
  }
  if (section === "ui" && field === "apiWorkEnabled") {
    return { ...draft, ui: { ...draft.ui, apiWorkEnabled: Boolean(value) } };
  }
  return draft;
}

function uniqueSteps(
  steps: readonly BuilderStepId[],
  step: BuilderStepId,
): BuilderStepId[] {
  return steps.includes(step) ? [...steps] : [...steps, step];
}

export function builderReducer(
  state: BuilderState,
  action: BuilderAction,
): BuilderState {
  switch (action.type) {
    case "set-draft":
      return {
        ...state,
        draft: action.draft,
        errors: action.path
          ? removeError(state.errors, action.path)
          : state.errors,
      };
    case "set-errors":
      return { ...state, errors: action.errors };
    case "clear-errors":
      return { ...state, errors: {} };
    case "complete-step":
      return {
        ...state,
        currentStep: action.nextStep,
        completedSteps: uniqueSteps(state.completedSteps, action.step),
        errors: {},
      };
    case "go-to-step":
      return { ...state, currentStep: action.step, errors: {} };
    case "hydrate":
      return {
        draft: action.snapshot.draft,
        currentStep: action.snapshot.currentStep,
        completedSteps: [...action.snapshot.completedSteps],
        errors: {},
      };
    case "reset":
      return INITIAL_BUILDER_STATE;
  }
}

function removeError(errors: FieldErrors, path: string): FieldErrors {
  if (!(path in errors)) return errors;
  const next = { ...errors };
  delete next[path];
  return next;
}
