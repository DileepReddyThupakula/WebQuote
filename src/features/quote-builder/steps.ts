import type { ProgressStep } from "@/components/ui/step-progress";
import type { BuilderStepId } from "@/features/quote-builder/types";

export const BUILDER_STEPS = [
  { id: "project", label: "Project" },
  { id: "design", label: "Design & content" },
  { id: "features", label: "Features" },
  { id: "integrations", label: "Integrations" },
  { id: "delivery", label: "Delivery" },
  { id: "commercial", label: "Commercial terms" },
  { id: "review", label: "Review" },
] as const satisfies readonly (ProgressStep & { id: BuilderStepId })[];

export const BUILDER_STEP_IDS = BUILDER_STEPS.map(
  ({ id }) => id,
) as BuilderStepId[];

export const BUILDER_STEP_COPY: Record<
  BuilderStepId,
  Readonly<{ eyebrow: string; title: string; description: string }>
> = {
  project: {
    eyebrow: "Step 1 · Project",
    title: "Start with the shape of the work",
    description:
      "Choose the project type, working scale, and currency for this planning range.",
  },
  design: {
    eyebrow: "Step 2 · Design & content",
    title: "Make the starting point clear",
    description:
      "Separate supplied material from the design and content support the project needs.",
  },
  features: {
    eyebrow: "Step 3 · Features",
    title: "Select the capabilities being planned",
    description:
      "Group the meaningful pieces of scope without turning the quote into a wall of options.",
  },
  integrations: {
    eyebrow: "Step 4 · Integrations",
    title: "Account for connected services",
    description:
      "Use counts for integrations and API work so discovery effort remains visible.",
  },
  delivery: {
    eyebrow: "Step 5 · Delivery",
    title: "Set the delivery conditions",
    description:
      "Capture testing, launch responsibility, urgency, support, and the work around launch.",
  },
  commercial: {
    eyebrow: "Step 6 · Commercial terms",
    title: "Anchor the quote to your working terms",
    description:
      "Set your minimum hourly value, gross margin target, contingency preference, and exposure level.",
  },
  review: {
    eyebrow: "Step 7 · Review",
    title: "Check the inputs before calculation",
    description:
      "Review your project assumptions before calculating the quote.",
  },
};

export function getStepIndex(step: BuilderStepId): number {
  return BUILDER_STEP_IDS.indexOf(step);
}

export function getNextStep(step: BuilderStepId): BuilderStepId | null {
  return BUILDER_STEP_IDS[getStepIndex(step) + 1] ?? null;
}

export function getPreviousStep(step: BuilderStepId): BuilderStepId | null {
  return BUILDER_STEP_IDS[getStepIndex(step) - 1] ?? null;
}
