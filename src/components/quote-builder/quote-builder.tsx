"use client";

import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { calculateQuote, PRICING_CONFIG_V1 } from "@/domain/quote";
import type { FeatureKey, IntegrationKey } from "@/domain/quote/types";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FieldGroup } from "@/components/ui/field-group";
import { InputField } from "@/components/ui/input-field";
import { Notice } from "@/components/ui/notice";
import {
  RadioGroupField,
  type RadioOption,
} from "@/components/ui/radio-group-field";
import { SelectField, type SelectOption } from "@/components/ui/select-field";
import {
  getProgressStepStatus,
  StepProgress,
} from "@/components/ui/step-progress";
import { TextareaField } from "@/components/ui/textarea-field";
import {
  updateDraftField,
  builderReducer,
  INITIAL_BUILDER_STATE,
} from "@/features/quote-builder/reducer";
import {
  BUILDER_STEP_COPY,
  BUILDER_STEPS,
  getNextStep,
  getPreviousStep,
} from "@/features/quote-builder/steps";
import { draftToQuoteInput } from "@/features/quote-builder/mapping";
import {
  clearPersistedQuote,
  loadPersistedDraft,
  saveLatestResult,
  savePersistedDraft,
} from "@/features/quote-builder/persistence";
import { getStepErrors, hasErrors } from "@/features/quote-builder/validation";
import {
  contingencyLabel,
  contentLabel,
  deploymentLabel,
  designLabel,
  formatIntegrationSummary,
  maintenanceLabel,
  migrationLabel,
  riskLabel,
  supportLabel,
  testingLabel,
  urgencyLabel,
} from "@/features/quote-builder/presentation";
import type {
  BuilderStepId,
  FieldErrors,
  QuoteBuilderDraft,
} from "@/features/quote-builder/types";

const currencySymbols = { INR: "₹", USD: "$", GBP: "£", EUR: "€" } as const;

const projectOptions: readonly SelectOption[] = [
  { value: "landing", label: "Landing page" },
  { value: "business", label: "Business website" },
  { value: "portfolio", label: "Portfolio" },
  { value: "blog", label: "Blog / content site" },
  { value: "ecommerce", label: "Ecommerce website" },
  { value: "webApp", label: "Web application" },
  { value: "custom", label: "Custom website" },
];

const currencyOptions: readonly SelectOption[] = [
  { value: "INR", label: "INR — Indian rupee" },
  { value: "USD", label: "USD — US dollar" },
  { value: "GBP", label: "GBP — British pound" },
  { value: "EUR", label: "EUR — Euro" },
];

const designOptions: readonly RadioOption[] = [
  { value: "provided", label: "Existing design provided" },
  { value: "template", label: "Template-based" },
  { value: "custom", label: "Custom design" },
  { value: "fullUx", label: "Full UI/UX design" },
];

const contentOptions: readonly RadioOption[] = [
  { value: "provided", label: "Client supplies content" },
  { value: "formatting", label: "Formatting and support required" },
  { value: "copywriting", label: "Copywriting support" },
];

const testingOptions: readonly RadioOption[] = [
  { value: "essential", label: "Essential testing" },
  { value: "enhanced", label: "Enhanced testing" },
];

const deploymentOptions: readonly RadioOption[] = [
  { value: "client", label: "Client handles deployment" },
  { value: "freelancer", label: "I handle deployment" },
];

const urgencyOptions: readonly RadioOption[] = [
  { value: "standard", label: "Normal" },
  { value: "priority", label: "Priority" },
  { value: "rush", label: "Rush" },
];

const contingencyOptions: readonly RadioOption[] = [
  { value: "lean", label: "Lean" },
  { value: "balanced", label: "Balanced" },
  { value: "cautious", label: "Cautious" },
];

const riskOptions: readonly RadioOption[] = [
  { value: "low", label: "Low exposure" },
  { value: "medium", label: "Medium exposure" },
  { value: "high", label: "High exposure" },
];

const supportOptions: readonly SelectOption[] = [
  { value: "0", label: "None" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
];

const migrationOptions: readonly SelectOption[] = [
  { value: "none", label: "No migration" },
  { value: "light", label: "Light migration" },
  { value: "standard", label: "Standard migration" },
  { value: "complex", label: "Complex migration" },
];

const maintenanceOptions: readonly SelectOption[] = [
  { value: "none", label: "No maintenance plan" },
  { value: "essential", label: "Essential" },
  { value: "standard", label: "Standard" },
  { value: "priority", label: "Priority" },
];

const featureGroups: readonly Readonly<{
  legend: string;
  items: readonly Readonly<{
    key: FeatureKey;
    label: string;
    description?: string;
  }>[];
}>[] = [
  {
    legend: "Core site",
    items: [
      { key: "contactForm", label: "Contact forms" },
      { key: "blogCms", label: "CMS / blog" },
      { key: "search", label: "Site search" },
    ],
  },
  {
    legend: "Accounts and operations",
    items: [
      { key: "authentication", label: "Authentication" },
      { key: "userAccounts", label: "User accounts" },
      { key: "adminDashboard", label: "Admin dashboard" },
      { key: "booking", label: "Booking" },
    ],
  },
  {
    legend: "Commerce",
    items: [
      { key: "payments", label: "Payments" },
      { key: "ecommerce", label: "Ecommerce" },
      { key: "membership", label: "Membership" },
      { key: "subscriptions", label: "Subscriptions" },
    ],
  },
];

const standardIntegrations: readonly Readonly<{
  key: IntegrationKey;
  label: string;
}>[] = [
  { key: "crm", label: "CRM" },
  { key: "emailMarketing", label: "Email marketing" },
  { key: "analytics", label: "Analytics" },
  { key: "maps", label: "Maps" },
  { key: "otherStandard", label: "Other standard integrations" },
];

const featureLabels = new Map<FeatureKey, string>(
  featureGroups.flatMap((group) =>
    group.items.map(({ key, label }) => [key, label] as const),
  ),
);

function fieldId(path: string): string {
  return `quote-${path.replaceAll(".", "-")}`;
}

function eventValue(
  event: ChangeEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >,
): string {
  return event.currentTarget.value;
}

function errorFor(errors: FieldErrors, path: string): string | undefined {
  return errors[path];
}

function focusFirstError(errors: FieldErrors) {
  const path = Object.keys(errors)[0];
  if (!path) return;
  window.requestAnimationFrame(() => {
    const id = fieldId(path);
    const target =
      document.getElementById(id) ??
      document.querySelector<HTMLElement>(`[name="${id}"]`);
    target?.focus();
  });
}

function selectedLabels(
  values: Readonly<Record<FeatureKey, boolean>>,
): string[] {
  return Object.entries(values)
    .filter(([, selected]) => selected)
    .map(([key]) => featureLabels.get(key as FeatureKey) ?? key);
}

function ReviewSection({
  children,
  onEdit,
  title,
}: {
  children: ReactNode;
  onEdit: () => void;
  title: string;
}) {
  return (
    <section
      className="grid gap-4 border-t border-border pt-5"
      aria-labelledby={`${fieldId(title)}-heading`}
    >
      <div className="flex items-start justify-between gap-4">
        <h3
          className="text-base font-semibold text-ink"
          id={`${fieldId(title)}-heading`}
        >
          {title}
        </h3>
        <Button
          className="shrink-0 px-2 text-sm"
          onClick={onEdit}
          variant="tertiary"
        >
          Edit
        </Button>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

export function QuoteBuilder() {
  const router = useRouter();
  const [state, dispatch] = useReducer(builderReducer, INITIAL_BUILDER_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const createdAt = useRef(new Date().toISOString());
  const skipPersist = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const loaded = loadPersistedDraft();
    let notice: string | null = null;
    if (loaded.status === "restored") {
      createdAt.current = loaded.snapshot.createdAt;
      dispatch({ type: "hydrate", snapshot: loaded.snapshot });
      notice = "Your saved draft was restored from this browser.";
    } else if (loaded.status === "corrupt") {
      notice = "The saved draft could not be restored. A fresh draft is ready.";
    } else if (loaded.status === "unsupported") {
      notice =
        "The saved draft version is not supported. A fresh draft is ready.";
    } else if (loaded.status === "unavailable") {
      notice =
        "Local draft storage is unavailable. You can still complete and calculate this quote in the current session.";
    }
    const timeout = window.setTimeout(() => {
      if (!mounted.current) return;
      if (notice) setStorageNotice(notice);
      setHydrated(true);
    }, 0);
    return () => {
      mounted.current = false;
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    const timeout = window.setTimeout(() => {
      if (!mounted.current) return;
      const saved = savePersistedDraft({
        draft: state.draft,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        createdAt: createdAt.current,
      });
      if (!saved) {
        setStorageNotice(
          "Local draft storage is unavailable. Your current session is still usable.",
        );
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [hydrated, state]);

  function update(path: string, value: string | boolean) {
    dispatch({
      type: "set-draft",
      draft: updateDraftField(state.draft, path, value),
      path,
    });
  }

  function updateApiWork(enabled: boolean) {
    let draft = updateDraftField(state.draft, "ui.apiWorkEnabled", enabled);
    if (
      enabled &&
      draft.integrations.thirdPartyApi === "0" &&
      draft.integrations.customApi === "0"
    ) {
      draft = updateDraftField(draft, "integrations.thirdPartyApi", "1");
    }
    if (!enabled) {
      draft = updateDraftField(draft, "integrations.thirdPartyApi", "0");
      draft = updateDraftField(draft, "integrations.customApi", "0");
    }
    dispatch({ type: "set-draft", draft, path: "ui.apiWorkEnabled" });
  }

  function handleContinue() {
    const errors = getStepErrors(state.draft, state.currentStep);
    if (hasErrors(errors)) {
      dispatch({ type: "set-errors", errors });
      focusFirstError(errors);
      return;
    }

    if (state.currentStep === "review") {
      const mapped = draftToQuoteInput(state.draft);
      if (!mapped.ok) {
        const finalErrors = Object.fromEntries(
          mapped.issues.map((item) => [item.path, item.message]),
        );
        dispatch({ type: "set-errors", errors: finalErrors });
        focusFirstError(finalErrors);
        return;
      }
      const outcome = calculateQuote(mapped.input, PRICING_CONFIG_V1);
      if (!outcome.ok) {
        const calculationErrors = Object.fromEntries(
          outcome.issues.map((item) => [
            item.path || "review",
            "The quote could not be calculated from these inputs. Check the highlighted fields and try again.",
          ]),
        );
        dispatch({ type: "set-errors", errors: calculationErrors });
        focusFirstError(calculationErrors);
        return;
      }
      saveLatestResult(outcome.result);
      router.push("/quote/result");
      return;
    }

    const nextStep = getNextStep(state.currentStep);
    if (nextStep)
      dispatch({ type: "complete-step", step: state.currentStep, nextStep });
  }

  function handleBack() {
    const previous = getPreviousStep(state.currentStep);
    if (previous) dispatch({ type: "go-to-step", step: previous });
  }

  function goToStep(step: BuilderStepId) {
    dispatch({ type: "go-to-step", step });
    window.requestAnimationFrame(() =>
      document.getElementById("quote-step-heading")?.focus(),
    );
  }

  function resetQuote() {
    clearPersistedQuote();
    createdAt.current = new Date().toISOString();
    skipPersist.current = true;
    dispatch({ type: "reset" });
    setConfirmReset(false);
    setStorageNotice("A new quote draft is ready.");
  }

  const copy = BUILDER_STEP_COPY[state.currentStep];
  const currentIndex = BUILDER_STEPS.findIndex(
    ({ id }) => id === state.currentStep,
  );

  return (
    <div className="grid gap-8">
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 lg:flex-row lg:items-end">
        <div className="max-w-[48rem]">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">
            Quote workspace
          </p>
          <h1 className="mt-3 text-[length:var(--text-page-title)] font-semibold tracking-[-0.04em] text-ink">
            Build a clear website quote
          </h1>
          <p className="mt-4 max-w-[42rem] text-base leading-7 text-ink-muted sm:text-lg">
            Work through the project one decision at a time, then review the
            inputs before calculation.
          </p>
        </div>
        <div className="shrink-0 border-l-2 border-accent pl-4 text-sm text-ink-muted">
          <p className="font-semibold text-ink">Local workspace</p>
          <p className="mt-1 max-w-[14rem]">
            Your draft stays in this browser. No account is needed.
          </p>
        </div>
      </div>

      <StepProgress currentStep={state.currentStep} steps={BUILDER_STEPS} />

      {storageNotice ? <Notice>{storageNotice}</Notice> : null}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-12">
        <section
          aria-labelledby="quote-step-heading"
          className="min-w-0 rounded-section border border-border bg-surface p-5 sm:p-8"
        >
          <div className="grid gap-2 border-b border-border pb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-accent">
              {copy.eyebrow}
            </p>
            <h2
              className="text-[length:var(--text-section-heading)] font-semibold tracking-[-0.03em] text-ink"
              id="quote-step-heading"
              tabIndex={-1}
            >
              {copy.title}
            </h2>
            <p className="max-w-[42rem] text-base leading-7 text-ink-muted">
              {copy.description}
            </p>
            <p className="text-sm leading-6 text-ink-muted">
              Fields marked optional can be left blank. Other inputs are checked
              when you continue.
            </p>
          </div>

          {Object.keys(state.errors).length ? (
            <div
              aria-labelledby="quote-errors-heading"
              className="mt-6 rounded-section border border-danger/40 bg-danger-soft p-4"
              role="alert"
            >
              <h3
                className="text-sm font-semibold text-ink"
                id="quote-errors-heading"
              >
                Check these fields before continuing
              </h3>
              <ul className="mt-2 grid gap-1 text-sm text-ink-muted">
                {Object.entries(state.errors).map(([path, message]) => (
                  <li key={path}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <form
            className="mt-8 grid gap-8"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              handleContinue();
            }}
          >
            {renderStepContent(
              state.draft,
              state.currentStep,
              state.errors,
              update,
              updateApiWork,
              goToStep,
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              {currentIndex > 0 ? (
                <Button onClick={handleBack} variant="secondary">
                  Back
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit">
                {state.currentStep === "review"
                  ? "Calculate quote"
                  : "Continue"}
              </Button>
            </div>
          </form>
        </section>

        <aside className="grid gap-5" aria-label="Quote workspace context">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-ink-muted">
              Working draft
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-ink">
              Step {currentIndex + 1} of {BUILDER_STEPS.length}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              Completed steps remain available through Back and the Review edit
              links.
            </p>
          </div>
          <div className="grid border-t border-border">
            {BUILDER_STEPS.map(({ id, label }, index) => {
              const status = getProgressStepStatus(
                BUILDER_STEPS,
                state.currentStep,
                index,
              );
              const isComplete = status === "complete";
              const content = (
                <>
                  <span
                    className={
                      isComplete ? "font-semibold text-ink" : "text-ink-muted"
                    }
                  >
                    {label}
                  </span>
                  <span className="text-xs text-ink-faint">
                    {status === "complete"
                      ? "Complete"
                      : status === "current"
                        ? "Current"
                        : "Upcoming"}
                  </span>
                </>
              );

              return isComplete ? (
                <button
                  className="flex items-center justify-between gap-3 border-b border-border py-3 text-left text-sm"
                  data-status={status}
                  data-workflow-step={id}
                  key={id}
                  onClick={() => goToStep(id)}
                  type="button"
                >
                  {content}
                </button>
              ) : (
                <div
                  className="flex items-center justify-between gap-3 border-b border-border py-3 text-left text-sm"
                  data-status={status}
                  data-workflow-step={id}
                  key={id}
                >
                  {content}
                </div>
              );
            })}
          </div>
          <div className="grid gap-3 border-t border-border pt-5">
            <p className="text-sm leading-6 text-ink-muted">
              Start over only when you no longer need the current draft.
            </p>
            {confirmReset ? (
              <div
                className="grid gap-3 rounded-section border border-warning/40 bg-warning-soft p-4"
                role="alert"
              >
                <p className="text-sm font-semibold text-ink">
                  Clear this draft?
                </p>
                <p className="text-sm leading-6 text-ink-muted">
                  Entered information and the latest local result will be
                  removed.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setConfirmReset(false)}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button onClick={resetQuote} variant="tertiary">
                    Start over
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="justify-self-start px-0"
                onClick={() => setConfirmReset(true)}
                variant="tertiary"
              >
                Start a new quote
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function renderStepContent(
  draft: QuoteBuilderDraft,
  step: BuilderStepId,
  errors: FieldErrors,
  update: (path: string, value: string | boolean) => void,
  updateApiWork: (enabled: boolean) => void,
  goToStep: (step: BuilderStepId) => void,
) {
  switch (step) {
    case "project":
      return <ProjectStep draft={draft} errors={errors} update={update} />;
    case "design":
      return <DesignStep draft={draft} errors={errors} update={update} />;
    case "features":
      return <FeaturesStep draft={draft} update={update} />;
    case "integrations":
      return (
        <IntegrationsStep
          draft={draft}
          update={update}
          updateApiWork={updateApiWork}
        />
      );
    case "delivery":
      return <DeliveryStep draft={draft} errors={errors} update={update} />;
    case "commercial":
      return <CommercialStep draft={draft} errors={errors} update={update} />;
    case "review":
      return <ReviewStep draft={draft} goToStep={goToStep} />;
  }
}

function ProjectStep({
  draft,
  errors,
  update,
}: {
  draft: QuoteBuilderDraft;
  errors: FieldErrors;
  update: (path: string, value: string | boolean) => void;
}) {
  return (
    <FieldGroup
      description="These inputs set the basic frame for the planning range."
      legend="Project details"
    >
      <SelectField
        id={fieldId("project.projectType")}
        label="Project type"
        onChange={(event) => update("project.projectType", eventValue(event))}
        options={projectOptions}
        value={draft.project.projectType}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField
          id={fieldId("project.pageCount")}
          inputMode="numeric"
          label="Pages / screens"
          min={1}
          max={100}
          onChange={(event) => update("project.pageCount", eventValue(event))}
          type="number"
          value={draft.project.pageCount}
          error={errorFor(errors, "project.pageCount")}
        />
        <SelectField
          id={fieldId("project.currency")}
          label="Currency"
          onChange={(event) => update("project.currency", eventValue(event))}
          options={currencyOptions}
          value={draft.project.currency}
        />
      </div>
      <TextareaField
        id={fieldId("project.clientContext")}
        label="Project or client context"
        description="Optional display context for your own working draft; it does not change pricing."
        maxLength={80}
        onChange={(event) => update("project.clientContext", eventValue(event))}
        optional
        value={draft.project.clientContext}
      />
    </FieldGroup>
  );
}

function DesignStep({
  draft,
  errors,
  update,
}: {
  draft: QuoteBuilderDraft;
  errors: FieldErrors;
  update: (path: string, value: string | boolean) => void;
}) {
  return (
    <div className="grid gap-8">
      <RadioGroupField
        legend="Design starting point"
        name={fieldId("design.mode")}
        onChange={(event) => update("design.mode", eventValue(event))}
        options={designOptions}
        value={draft.design.mode}
        error={errorFor(errors, "design.mode")}
        variant="cards"
      />
      <RadioGroupField
        description="Choose the level of content work you are pricing, not the client’s industry."
        legend="Content responsibility"
        name={fieldId("content.mode")}
        onChange={(event) => update("content.mode", eventValue(event))}
        options={contentOptions}
        value={draft.content.mode}
        error={errorFor(errors, "content.mode")}
      />
      <CheckboxField
        checked={draft.content.assetSourcing}
        description="Include time to find, prepare, or coordinate suitable assets."
        id={fieldId("content.assetSourcing")}
        label="Asset or image sourcing"
        onChange={(event) =>
          update("content.assetSourcing", event.currentTarget.checked)
        }
      />
    </div>
  );
}

function FeaturesStep({
  draft,
  update,
}: {
  draft: QuoteBuilderDraft;
  update: (path: string, value: string | boolean) => void;
}) {
  return (
    <div className="grid gap-8">
      {featureGroups.map((group) => (
        <fieldset className="grid gap-3" key={group.legend}>
          <legend className="text-base font-semibold text-ink">
            {group.legend}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.items.map((item) => (
              <CheckboxField
                checked={draft.features[item.key]}
                description={item.description}
                id={fieldId(`features.${item.key}`)}
                key={item.key}
                label={item.label}
                onChange={(event) =>
                  update(`features.${item.key}`, event.currentTarget.checked)
                }
              />
            ))}
          </div>
        </fieldset>
      ))}
      <Notice title="Related features are included automatically">
        When one selection requires another, such as subscriptions requiring
        payments, the related feature is included for you.
      </Notice>
    </div>
  );
}

function IntegrationsStep({
  draft,
  update,
  updateApiWork,
}: {
  draft: QuoteBuilderDraft;
  update: (path: string, value: string | boolean) => void;
  updateApiWork: (enabled: boolean) => void;
}) {
  return (
    <div className="grid gap-8">
      <FieldGroup
        description="Use 0 when an integration is not part of this project."
        legend="Standard integrations"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {standardIntegrations.map(({ key, label }) => (
            <InputField
              id={fieldId(`integrations.${key}`)}
              inputMode="numeric"
              key={key}
              label={label}
              max={10}
              min={0}
              onChange={(event) =>
                update(`integrations.${key}`, eventValue(event))
              }
              type="number"
              value={draft.integrations[key]}
            />
          ))}
        </div>
      </FieldGroup>
      <FieldGroup
        description="Turn this on when the scope includes API work. The first count starts at one for a quicker mobile flow."
        legend="API work"
      >
        <CheckboxField
          checked={draft.ui.apiWorkEnabled}
          id={fieldId("ui.apiWorkEnabled")}
          label="Include API work"
          onChange={(event) => updateApiWork(event.currentTarget.checked)}
        />
        {draft.ui.apiWorkEnabled ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <InputField
              id={fieldId("integrations.thirdPartyApi")}
              inputMode="numeric"
              label="Third-party APIs"
              max={10}
              min={0}
              onChange={(event) =>
                update("integrations.thirdPartyApi", eventValue(event))
              }
              type="number"
              value={draft.integrations.thirdPartyApi}
            />
            <InputField
              id={fieldId("integrations.customApi")}
              inputMode="numeric"
              label="Custom APIs"
              max={10}
              min={0}
              onChange={(event) =>
                update("integrations.customApi", eventValue(event))
              }
              type="number"
              value={draft.integrations.customApi}
            />
          </div>
        ) : null}
      </FieldGroup>
    </div>
  );
}

function DeliveryStep({
  draft,
  errors,
  update,
}: {
  draft: QuoteBuilderDraft;
  errors: FieldErrors;
  update: (path: string, value: string | boolean) => void;
}) {
  return (
    <div className="grid gap-8">
      <RadioGroupField
        description="Rush and priority work can add commercial pressure; they do not guarantee a shorter schedule."
        legend="Urgency"
        name={fieldId("delivery.urgency")}
        onChange={(event) => update("delivery.urgency", eventValue(event))}
        options={urgencyOptions}
        value={draft.delivery.urgency}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField
          id={fieldId("delivery.includedRevisionRounds")}
          inputMode="numeric"
          label="Included revision rounds"
          max={5}
          min={0}
          onChange={(event) =>
            update("delivery.includedRevisionRounds", eventValue(event))
          }
          type="number"
          value={draft.delivery.includedRevisionRounds}
          error={errorFor(errors, "delivery.includedRevisionRounds")}
        />
        <InputField
          id={fieldId("delivery.weeklyCapacityHours")}
          inputMode="numeric"
          label="Weekly delivery capacity"
          description="Optional override; leave blank to use the standard planning allowance."
          max={60}
          min={5}
          onChange={(event) =>
            update("delivery.weeklyCapacityHours", eventValue(event))
          }
          optional
          type="number"
          value={draft.delivery.weeklyCapacityHours}
          error={errorFor(errors, "delivery.weeklyCapacityHours")}
          suffix="hours"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          id={fieldId("content.migration")}
          label="Content migration"
          onChange={(event) => update("content.migration", eventValue(event))}
          options={migrationOptions}
          value={draft.content.migration}
        />
        <SelectField
          id={fieldId("delivery.postLaunchSupportDays")}
          label="Post-launch support"
          onChange={(event) =>
            update("delivery.postLaunchSupportDays", eventValue(event))
          }
          options={supportOptions}
          value={draft.delivery.postLaunchSupportDays}
          error={errorFor(errors, "delivery.postLaunchSupportDays")}
        />
        <SelectField
          id={fieldId("delivery.maintenanceTier")}
          label="Maintenance preference"
          onChange={(event) =>
            update("delivery.maintenanceTier", eventValue(event))
          }
          options={maintenanceOptions}
          value={draft.delivery.maintenanceTier}
        />
      </div>
      <RadioGroupField
        legend="Testing level"
        name={fieldId("delivery.testingLevel")}
        onChange={(event) => update("delivery.testingLevel", eventValue(event))}
        options={testingOptions}
        value={draft.delivery.testingLevel}
      />
      <RadioGroupField
        legend="Deployment responsibility"
        name={fieldId("delivery.deploymentOwner")}
        onChange={(event) =>
          update("delivery.deploymentOwner", eventValue(event))
        }
        options={deploymentOptions}
        value={draft.delivery.deploymentOwner}
      />
    </div>
  );
}

function CommercialStep({
  draft,
  errors,
  update,
}: {
  draft: QuoteBuilderDraft;
  errors: FieldErrors;
  update: (path: string, value: string | boolean) => void;
}) {
  return (
    <div className="grid gap-8">
      <FieldGroup
        description="These are your working commercial preferences, not an external market-rate claim."
        legend="Your pricing basis"
      >
        <InputField
          id={fieldId("pricing.hourlyValue")}
          inputMode="decimal"
          label="Minimum hourly value"
          description={`${currencySymbols[draft.project.currency]} ${draft.project.currency} · Enter the minimum hourly value that makes this project worthwhile.`}
          min={0}
          onChange={(event) => update("pricing.hourlyValue", eventValue(event))}
          prefix={currencySymbols[draft.project.currency]}
          type="text"
          value={draft.pricing.hourlyValue}
          error={errorFor(errors, "pricing.hourlyValue")}
        />
        <InputField
          id={fieldId("pricing.targetMarginPercent")}
          inputMode="decimal"
          label="Target gross margin"
          description="Gross margin is the share left after delivery costs; it is not markup."
          max={50}
          min={0}
          onChange={(event) =>
            update("pricing.targetMarginPercent", eventValue(event))
          }
          suffix="%"
          type="text"
          value={draft.pricing.targetMarginPercent}
          error={errorFor(errors, "pricing.targetMarginPercent")}
        />
      </FieldGroup>
      <RadioGroupField
        description="Contingency reflects how much uncertainty to reserve. It is separate from scope complexity."
        legend="Contingency preference"
        name={fieldId("pricing.contingency")}
        onChange={(event) => update("pricing.contingency", eventValue(event))}
        options={contingencyOptions}
        value={draft.pricing.contingency}
      />
      <RadioGroupField
        description="Risk describes delivery exposure and uncertainty, not the amount of functionality."
        legend="Risk level"
        name={fieldId("pricing.riskLevel")}
        onChange={(event) => update("pricing.riskLevel", eventValue(event))}
        options={riskOptions}
        value={draft.pricing.riskLevel}
      />
    </div>
  );
}

function ReviewStep({
  draft,
  goToStep,
}: {
  draft: QuoteBuilderDraft;
  goToStep: (step: BuilderStepId) => void;
}) {
  const selectedFeatures = selectedLabels(draft.features);
  const selectedIntegrations = formatIntegrationSummary(draft.integrations);
  return (
    <div className="grid gap-6">
      <Notice title="Review before calculation">
        Review your project assumptions before calculating the quote. Use Edit
        to change any section.
      </Notice>
      <ReviewSection onEdit={() => goToStep("project")} title="Project">
        <SummaryItem
          label="Project type"
          value={
            projectOptions.find(
              (option) => option.value === draft.project.projectType,
            )?.label ?? draft.project.projectType
          }
        />
        <SummaryItem
          label="Pages / screens"
          value={draft.project.pageCount || "Not entered"}
        />
        <SummaryItem label="Currency" value={draft.project.currency} />
        <SummaryItem
          label="Context"
          value={draft.project.clientContext || "Not provided"}
        />
      </ReviewSection>
      <ReviewSection onEdit={() => goToStep("design")} title="Design & content">
        <SummaryItem
          label="Design starting point"
          value={designLabel(draft.design.mode)}
        />
        <SummaryItem
          label="Content responsibility"
          value={contentLabel(draft.content.mode)}
        />
        <SummaryItem
          label="Asset sourcing"
          value={draft.content.assetSourcing ? "Included" : "Not included"}
        />
      </ReviewSection>
      <ReviewSection onEdit={() => goToStep("features")} title="Features">
        <SummaryItem
          label="Selected features"
          value={
            selectedFeatures.length
              ? selectedFeatures.join(", ")
              : "None selected"
          }
        />
      </ReviewSection>
      <ReviewSection
        onEdit={() => goToStep("integrations")}
        title="Integrations"
      >
        <SummaryItem
          label="Selected integrations"
          value={
            selectedIntegrations.length
              ? selectedIntegrations.join(", ")
              : "None selected"
          }
        />
      </ReviewSection>
      <ReviewSection onEdit={() => goToStep("delivery")} title="Delivery">
        <SummaryItem
          label="Urgency"
          value={urgencyLabel(draft.delivery.urgency)}
        />
        <SummaryItem
          label="Revision rounds"
          value={draft.delivery.includedRevisionRounds}
        />
        <SummaryItem
          label="Migration"
          value={migrationLabel(draft.content.migration)}
        />
        <SummaryItem
          label="Support"
          value={supportLabel(draft.delivery.postLaunchSupportDays)}
        />
        <SummaryItem
          label="Maintenance"
          value={maintenanceLabel(draft.delivery.maintenanceTier)}
        />
        <SummaryItem
          label="Testing"
          value={testingLabel(draft.delivery.testingLevel)}
        />
        <SummaryItem
          label="Deployment"
          value={deploymentLabel(draft.delivery.deploymentOwner)}
        />
      </ReviewSection>
      <ReviewSection
        onEdit={() => goToStep("commercial")}
        title="Commercial terms"
      >
        <SummaryItem
          label="Minimum hourly value"
          value={
            draft.pricing.hourlyValue
              ? `${currencySymbols[draft.project.currency]}${draft.pricing.hourlyValue}`
              : "Not entered"
          }
        />
        <SummaryItem
          label="Target gross margin"
          value={`${draft.pricing.targetMarginPercent}%`}
        />
        <SummaryItem
          label="Contingency"
          value={contingencyLabel(draft.pricing.contingency)}
        />
        <SummaryItem label="Risk" value={riskLabel(draft.pricing.riskLevel)} />
      </ReviewSection>
    </div>
  );
}
