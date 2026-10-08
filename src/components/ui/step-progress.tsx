import { cx } from "@/lib/classes";

export type ProgressStep = {
  id: string;
  label: string;
};

export type ProgressStepStatus = "complete" | "current" | "upcoming";

export function getProgressStepStatus(
  steps: readonly ProgressStep[],
  currentStep: string,
  index: number,
): ProgressStepStatus {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  if (currentIndex === -1) return "upcoming";
  if (index === currentIndex) return "current";
  if (index > currentIndex) return "upcoming";
  return "complete";
}

export function StepProgress({
  ariaLabel = "Quote progress",
  className,
  currentStep,
  steps,
}: {
  ariaLabel?: string;
  className?: string;
  currentStep: string;
  steps: readonly ProgressStep[];
}) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStep),
  );
  const current = steps[currentIndex] ?? steps[0];
  const currentPosition = currentIndex + 1;
  const progress =
    steps.length > 1 ? (currentPosition / steps.length) * 100 : 100;

  return (
    <nav aria-label={ariaLabel} className={className}>
      <ol className="hidden items-start gap-0 xl:flex">
        {steps.map((step, index) => {
          const status = getProgressStepStatus(steps, currentStep, index);

          return (
            <li
              className={cx(
                "relative flex min-w-0 flex-1 items-start gap-2",
                index < steps.length - 1 ? "pr-2 xl:pr-4" : null,
              )}
              aria-current={status === "current" ? "step" : undefined}
              data-status={status}
              key={step.id}
            >
              <span
                aria-hidden="true"
                className={cx(
                  "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold numeric",
                  status === "complete"
                    ? "border-accent bg-accent text-white"
                    : status === "current"
                      ? "border-accent bg-surface text-accent ring-4 ring-accent-soft"
                      : "border-border-strong bg-canvas text-ink-muted",
                )}
              >
                {status === "complete" ? "✓" : index + 1}
              </span>
              <span className="relative z-10 grid min-w-0 gap-0.5 bg-canvas pr-2 pt-0.5">
                <span
                  className={cx(
                    "text-[0.8125rem] font-semibold leading-5 xl:whitespace-nowrap",
                    status === "upcoming" ? "text-ink-muted" : "text-ink",
                  )}
                >
                  {step.label}
                </span>
                <span className="text-xs text-ink-faint">
                  {status === "complete"
                    ? "Complete"
                    : status === "current"
                      ? "Current"
                      : "Upcoming"}
                </span>
              </span>
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cx(
                    "absolute left-7 right-0 top-3.5 h-px",
                    status === "complete" ? "bg-accent" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-3 xl:hidden">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm font-semibold text-ink">
            Step <span className="numeric">{currentPosition}</span> of{" "}
            {steps.length}
          </p>
          <p className="truncate text-sm text-ink-muted">{current?.label}</p>
        </div>
        <div
          aria-label={`${current?.label ?? "Current step"}, step ${currentPosition} of ${steps.length}`}
          aria-valuemax={steps.length}
          aria-valuemin={1}
          aria-valuenow={currentPosition}
          className="h-1.5 overflow-hidden rounded-full bg-border"
          role="progressbar"
        >
          <span
            className="block h-full rounded-full bg-accent transition-[width] duration-150 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </nav>
  );
}
