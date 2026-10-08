import { draftToQuoteInput } from "@/features/quote-builder/mapping";
import type {
  BuilderStepId,
  DraftIssue,
  FieldErrors,
  QuoteBuilderDraft,
} from "@/features/quote-builder/types";

const STEP_PREFIXES: Record<BuilderStepId, readonly string[]> = {
  project: ["project."],
  design: ["design.", "content."],
  features: ["features."],
  integrations: ["integrations."],
  delivery: ["delivery."],
  commercial: ["pricing."],
  review: [
    "project.",
    "design.",
    "content.",
    "features.",
    "integrations.",
    "delivery.",
    "pricing.",
  ],
};

function belongsToStep(issue: DraftIssue, step: BuilderStepId): boolean {
  return STEP_PREFIXES[step].some((prefix) => issue.path.startsWith(prefix));
}

export function getStepErrors(
  draft: QuoteBuilderDraft,
  step: BuilderStepId,
): FieldErrors {
  const mapping = draftToQuoteInput(draft);
  if (mapping.ok) return {};

  return Object.fromEntries(
    mapping.issues
      .filter((issue) => belongsToStep(issue, step))
      .map((issue) => [issue.path, issue.message]),
  );
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
