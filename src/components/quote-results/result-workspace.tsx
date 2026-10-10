"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button, buttonClassName } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import type { CurrencyCode, QuoteResultV1 } from "@/domain/quote/types";
import {
  clientSummaryText,
  createClientQuoteDocument,
  exclusionLines,
  formatHours,
  formatMoney,
  parseMoneyText,
  scopeLines,
} from "@/features/client-summary/document";
import { copyClientSummary } from "@/features/client-summary/clipboard";
import { PLANNING_RANGE_NOTE } from "@/features/client-summary/planning-range";
import {
  consumeStaleOverrideNotice,
  loadLatestResultState,
  type ResultLoadResult,
} from "@/features/quote-builder/persistence";
import {
  emptyOverrides,
  loadOverrides,
  milestoneTotalBp,
  saveOverrides,
  updateOverride,
  type QuoteOverridesV1,
  type QuoteOverrideValuesV1,
} from "@/features/quote-results/overrides";

type Ready = { result: QuoteResultV1; overrides: QuoteOverridesV1 };
const effortLabels: Record<string, string> = {
  directExpectedEffort: "Expected direct effort",
  complexityAdditionalEffort: "Complexity-added effort",
  testingOverhead: "Testing overhead",
  projectManagementOverhead: "Project management overhead",
  includedRevisionEffort: "Included revision rounds above the baseline",
  postLaunchSupportEffort: "Post-launch support (placeholder estimate)",
  riskContingency: "Risk contingency",
};
const priceLabels: Record<string, string> = {
  expectedLaborValue: "Hourly cost basis",
  targetMarginAdjustment: "Target margin",
  safeFloorAdjustment: "Minimum safe price adjustment",
  urgencySurcharge: "Urgency / rush adjustment",
  commercialRounding: "Rounding",
};
const warningLabels: Record<string, string> = {
  "integration-discovery": "Confirm integration details before quoting.",
  "complex-migration": "Confirm migration scope and source data.",
  "advanced-complexity": "Advanced scope may need discovery.",
  "high-risk": "High project uncertainty increases contingency.",
  "custom-api-discovery": "Confirm custom API requirements.",
  "several-custom-apis": "Several custom APIs may need discovery.",
  "complex-commerce": "Confirm commerce workflows and dependencies.",
  "complex-web-app": "Confirm web application requirements.",
  "large-scope": "Confirm the scope of this larger project.",
  "zero-margin": "The target margin is zero.",
  "rush-capacity-confirmation": "Confirm capacity for the requested urgency.",
};

function minorText(minor: number): string {
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;
}
function percentText(bp: number): string {
  return `${Math.floor(bp / 100)}${
    bp % 100
      ? `.${String(bp % 100)
          .padStart(2, "0")
          .replace(/0+$/, "")}`
      : ""
  }`;
}
function parsePercent(text: string): number | null {
  const match = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(text.trim());
  if (!match) return null;
  const value =
    Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return value <= 10_000 ? value : null;
}

export function ResultWorkspace() {
  const [ready, setReady] = useState<Ready | null>(null);
  const [loadStatus, setLoadStatus] = useState<
    ResultLoadResult["status"] | "checking"
  >("checking");
  const [notice, setNotice] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [quoteText, setQuoteText] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [milestoneText, setMilestoneText] = useState<string[]>([]);
  const [milestoneError, setMilestoneError] = useState("");
  const [resetCount, setResetCount] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const loaded = loadLatestResultState();
      setLoadStatus(loaded.status);
      if (loaded.status !== "restored") return;
      const overrideLoad = loadOverrides(loaded.result);
      setReady({ result: loaded.result, overrides: overrideLoad.overrides });
      setQuoteText(
        minorText(
          overrideLoad.overrides.values.quoteAmountMinor ??
            loaded.result.pricing.recommendedMinor,
        ),
      );
      setMilestoneText(
        (
          overrideLoad.overrides.values.milestonePercentBp ??
          loaded.result.payment.milestones.map((item) => item.percentBp)
        ).map(percentText),
      );
      if (consumeStaleOverrideNotice() || overrideLoad.status === "stale")
        setNotice(
          "The project changed, so previous custom terms were reset. Review the new quote before sharing it.",
        );
      else if (overrideLoad.status === "corrupt")
        setNotice(
          "Saved custom terms could not be read. Calculated values are shown; you can enter new terms.",
        );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (loadStatus === "checking")
    return (
      <p className="text-sm text-ink-muted">
        Checking this browser&apos;s saved quote…
      </p>
    );
  if (!ready)
    return (
      <div className="grid gap-6">
        <div>
          <h1 className="text-[length:var(--text-page-title)] font-semibold tracking-[-0.04em] text-ink">
            No valid quote to show
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
            {loadStatus === "empty"
              ? "Build a quote to see a planning range and client terms."
              : "The saved quote is unavailable or could not be read. Your draft may still be available in the builder."}
          </p>
        </div>
        <Link className={buttonClassName("primary", "w-fit")} href="/quote">
          Build a quote
        </Link>
      </div>
    );

  const { result, overrides } = ready;
  const money = (minor: number) => formatMoney(minor, result.pricing.currency);
  const custom = overrides.values;
  const quotedMinor =
    custom.quoteAmountMinor ?? result.pricing.recommendedMinor;
  const document =
    quoteError || milestoneError
      ? null
      : createClientQuoteDocument(result, overrides);
  const summary = document ? clientSummaryText(document) : "";
  const milestonesValid = milestoneTotalBp(result, overrides) === 10_000;

  function update<K extends keyof QuoteOverrideValuesV1>(
    key: K,
    value: QuoteOverrideValuesV1[K] | undefined,
  ) {
    const next = updateOverride(overrides, key, value);
    if (next === overrides) {
      setNotice(
        "That custom value could not be saved. Check its length or format.",
      );
      return;
    }
    setReady({ result, overrides: next });
    if (!saveOverrides(next))
      setNotice(
        "Browser storage is unavailable. This quote remains available until you close or refresh this tab.",
      );
  }
  function resetAll() {
    const next = emptyOverrides(result);
    setReady({ result, overrides: next });
    setQuoteText(minorText(result.pricing.recommendedMinor));
    setMilestoneText(
      result.payment.milestones.map((item) => percentText(item.percentBp)),
    );
    setQuoteError("");
    setMilestoneError("");
    setResetCount((count) => count + 1);
    saveOverrides(next);
    setNotice("Calculated commercial values restored.");
  }
  function editQuote(text: string) {
    setQuoteText(text);
    const value = parseMoneyText(text, result.pricing.currency);
    if (value === null) {
      setQuoteError(
        "Enter a non-negative amount with up to two decimal places.",
      );
      return;
    }
    setQuoteError("");
    update(
      "quoteAmountMinor",
      value === result.pricing.recommendedMinor ? undefined : value,
    );
  }
  function editMilestone(index: number, text: string) {
    const nextText = [...milestoneText];
    nextText[index] = text;
    setMilestoneText(nextText);
    const parsed = nextText.map(parsePercent);
    if (parsed.some((value) => value === null)) {
      setMilestoneError(
        "Enter percentages from 0 to 100 with up to two decimal places.",
      );
      return;
    }
    setMilestoneError("");
    const values = parsed as number[];
    const original = result.payment.milestones.map((item) => item.percentBp);
    update(
      "milestonePercentBp",
      values.every((value, position) => value === original[position])
        ? undefined
        : values,
    );
  }

  return (
    <div className="grid min-w-0 gap-12 text-ink">
      <header className="grid gap-4">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">
          Your project quote
        </p>
        <h1 className="max-w-3xl text-[length:var(--text-page-title)] font-semibold tracking-[-0.04em]">
          Recommended planning range based on your project scope and pricing
          preferences.
        </h1>
        <p className="max-w-3xl text-base leading-7 text-ink-muted">
          These figures are planning guidance from your inputs and
          WebQuote&apos;s documented effort assumptions, not guaranteed market
          prices.
        </p>
      </header>
      {notice ? (
        <Notice tone="warning" title="Review saved terms">
          <span role="status">{notice}</span>
        </Notice>
      ) : null}
      <section
        aria-labelledby="range-heading"
        className="grid gap-5 border-b border-border pb-10"
      >
        <h2
          id="range-heading"
          className="text-sm font-semibold uppercase tracking-[0.1em] text-ink-muted"
        >
          Recommended range
        </h2>
        <p className="break-words text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          {money(result.pricing.rangeLowMinor)}–
          {money(result.pricing.rangeHighMinor)}
        </p>
        <p className="text-sm text-ink-muted">
          This is your private range, from your minimum safe price to the high
          end. A client-facing planning range starts at the amount you quote.
        </p>
        <p className="text-lg">
          Recommended quote{" "}
          <strong>{money(result.pricing.recommendedMinor)}</strong>
        </p>
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            label="Minimum safe price"
            value={money(result.pricing.minimumSafeMinor)}
          />
          <Metric
            label="Estimated effort · low / expected / high"
            value={`${formatHours(result.effort.delivery.lowQh)} / ${formatHours(result.effort.delivery.expectedQh)} / ${formatHours(result.effort.delivery.highQh)} hours`}
          />
          <Metric
            label="Expected timeline"
            value={`${result.timeline.expectedWeeks} weeks (${result.timeline.lowWeeks}–${result.timeline.highWeeks} planned)`}
          />
          <Metric
            label="Complexity"
            value={`${result.complexity.level} · ${result.complexity.score} points`}
          />
          <Metric
            label="Risk / contingency"
            value={`${result.risk.level} risk · ${formatHours(result.risk.contingencyQh)} hours of uncertainty allowance`}
          />
          <Metric
            label="Suggested deposit"
            value={`${percentText(result.payment.depositPercentBp)}% · ${money(result.payment.depositAmountMinor)}`}
          />
        </dl>
        <p className="max-w-3xl text-sm leading-6 text-ink-muted">
          Complexity adds expected delivery work. Risk adds a separate
          uncertainty allowance. Neither is a hidden location-based price
          adjustment.
        </p>
      </section>
      <section aria-labelledby="breakdown-heading" className="grid gap-5">
        <h2 id="breakdown-heading" className="text-2xl font-semibold">
          Effort breakdown
        </h2>
        <div
          aria-label="Effort breakdown table"
          className="overflow-x-auto rounded-section border border-border"
          role="region"
          tabIndex={0}
        >
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="bg-surface-subtle">
              <tr>
                <th className="px-4 py-3">Category / item</th>
                <th className="px-4 py-3 text-right">Low</th>
                <th className="px-4 py-3 text-right">Expected</th>
                <th className="px-4 py-3 text-right">High</th>
              </tr>
            </thead>
            <tbody>
              {result.effort.lineItems.map((item) => (
                <tr className="border-t border-border" key={item.id}>
                  <th className="px-4 py-3 font-medium">{item.label}</th>
                  <td className="px-4 py-3 text-right">
                    {formatHours(item.effort.lowQh)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatHours(item.effort.expectedQh)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatHours(item.effort.highQh)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <details className="rounded-section border border-border p-4">
          <summary className="cursor-pointer font-semibold">
            How this was calculated · internal details
          </summary>
          <div className="mt-5 grid gap-6 text-sm">
            <p className="text-ink-muted">
              This calculation uses your hourly value and target margin. The
              entries below come from the saved pricing ledger for this quote.
            </p>
            <dl className="grid gap-3">
              {result.ledger.effort.map((item) => (
                <Metric
                  key={item.code}
                  label={effortLabels[item.code] ?? item.code}
                  value={`${formatHours(item.amountQh)} hours · ${item.configPath}`}
                />
              ))}
            </dl>
            <dl className="grid gap-3">
              {result.ledger.pricing.map((item) => (
                <Metric
                  key={item.code}
                  label={priceLabels[item.code] ?? item.code}
                  value={`${item.deltaMinor < 0 ? "−" : "+"}${money(Math.abs(item.deltaMinor))} → ${money(item.outputMinor)}${item.rateBp === undefined ? "" : ` · ${percentText(item.rateBp)}%`} · ${item.configPath}`}
                />
              ))}
            </dl>
            <p>
              Hourly cost basis: {money(result.pricing.hourlyValueMinor)} per
              hour. Target margin: {percentText(result.pricing.targetMarginBp)}
              %. Safe floor: {money(result.pricing.minimumSafeMinor)}. Urgency:{" "}
              {result.pricing.urgency.level}.
            </p>
          </div>
        </details>
      </section>
      <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="grid min-w-0 content-start gap-10">
          <section aria-labelledby="scope-heading" className="grid gap-4">
            <h2 id="scope-heading" className="text-2xl font-semibold">
              Scope and assumptions
            </h2>
            <h3 className="font-semibold">Included</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6">
              {scopeLines(result).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <h3 className="font-semibold">Exclusions</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6">
              {exclusionLines(result).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            {result.warnings.length ? (
              <div>
                <h3 className="font-semibold">Discovery notes</h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">
                  {result.warnings.map((item) => (
                    <li key={item.code}>
                      {warningLabels[item.code] ??
                        "Confirm this assumption before sharing the quote."}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
          <section aria-labelledby="terms-heading" className="grid gap-4">
            <h2 id="terms-heading" className="text-2xl font-semibold">
              Calculated commercial terms
            </h2>
            <p>
              {result.revisions.includedRounds} revision rounds included.
              Additional round:{" "}
              {money(result.revisions.extraRoundPrice.recommendedMinor)}.
            </p>
            <p>
              Change requests require written scope. Additional page:{" "}
              {money(
                result.changeOrders.find(
                  (item) => item.code === "additionalPage",
                )!.price.recommendedMinor,
              )}
              . Out-of-scope hourly work:{" "}
              {money(
                result.changeOrders.find(
                  (item) => item.code === "hourlyOutOfScope",
                )!.price.recommendedMinor,
              )}
              .
            </p>
            <p>
              Suggested deposit: {percentText(result.payment.depositPercentBp)}%
              ({money(result.payment.depositAmountMinor)}).
            </p>
            <p>
              {result.maintenance.included
                ? `${result.maintenance.tier} maintenance recommended at ${money(result.maintenance.monthlyPrice!.recommendedMinor)} per month.`
                : "No ongoing maintenance included."}{" "}
              {result.input.delivery.postLaunchSupportDays} days of post-launch
              support.
            </p>
          </section>
        </div>
        <div className="grid min-w-0 content-start gap-8">
          <section
            aria-labelledby="edit-heading"
            className="grid min-w-0 gap-5 border-t border-border pt-6 lg:border-t-0 lg:pt-0"
          >
            <div>
              <h2 id="edit-heading" className="text-2xl font-semibold">
                Client-facing terms
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Custom values affect the client preview only. The calculated
                result remains available above.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={resetAll} variant="secondary">
                Restore all calculated values
              </Button>
              <Link className={buttonClassName("tertiary")} href="/quote">
                Edit project details
              </Link>
            </div>
            <div className="grid gap-2">
              <label className="font-semibold" htmlFor="quote-amount">
                Final quoted amount{" "}
                {custom.quoteAmountMinor === undefined ? (
                  <span className="text-sm text-ink-muted">· Calculated</span>
                ) : (
                  <span className="text-sm text-accent">· Custom</span>
                )}
              </label>
              <p className="text-sm text-ink-muted">
                Calculated: {money(result.pricing.recommendedMinor)}
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  className="min-w-0 flex-1 rounded-control border border-border-strong bg-surface px-3 py-2 text-ink"
                  id="quote-amount"
                  inputMode="decimal"
                  onChange={(event) => editQuote(event.target.value)}
                  value={quoteText}
                />
                <Button
                  onClick={() => {
                    setQuoteText(minorText(result.pricing.recommendedMinor));
                    setQuoteError("");
                    update("quoteAmountMinor", undefined);
                  }}
                  variant="secondary"
                >
                  Restore
                </Button>
              </div>
              {quoteError ? (
                <p className="text-sm text-danger" role="alert">
                  {quoteError}
                </p>
              ) : null}
              {quotedMinor < result.pricing.minimumSafeMinor && !quoteError ? (
                <Notice tone="warning" title="Below your minimum safe price">
                  <span role="alert">
                    This custom quote is below{" "}
                    {money(result.pricing.minimumSafeMinor)}. You can still use
                    it, but review your costs and scope.
                  </span>
                </Notice>
              ) : null}
            </div>
            <div className="grid gap-2">
              <label className="font-semibold" htmlFor="amount-presentation">
                Client price presentation{" "}
                {custom.amountPresentation ? "· Custom" : "· Calculated"}
              </label>
              <select
                className="rounded-control border border-border-strong bg-surface px-3 py-2"
                id="amount-presentation"
                onChange={(event) =>
                  update(
                    "amountPresentation",
                    event.target.value === "amount" ? undefined : "range",
                  )
                }
                value={custom.amountPresentation ?? "amount"}
              >
                <option value="amount">Proposed amount</option>
                <option value="range">Planning range</option>
              </select>
              <p className="text-sm text-ink-muted">
                A planning range starts at your final quoted amount and goes
                upward. It never shows your minimum safe price.
              </p>
            </div>
            <div className="grid gap-2">
              <label className="font-semibold" htmlFor="delivery-statement">
                Delivery statement{" "}
                {custom.deliveryStatement ? "· Custom" : "· Calculated"}
              </label>
              <input
                className="rounded-control border border-border-strong bg-surface px-3 py-2"
                id="delivery-statement"
                maxLength={240}
                onChange={(event) =>
                  update("deliveryStatement", event.target.value || undefined)
                }
                placeholder={`${result.timeline.lowWeeks}–${result.timeline.highWeeks} weeks`}
                value={custom.deliveryStatement ?? ""}
              />
              <Button
                className="w-fit"
                onClick={() => update("deliveryStatement", undefined)}
                variant="tertiary"
              >
                Restore delivery statement
              </Button>
            </div>
            <fieldset className="grid gap-3">
              <legend className="font-semibold">
                Payment milestones{" "}
                {custom.milestonePercentBp ? "· Custom" : "· Calculated"}
              </legend>
              {result.payment.milestones.map((item, index) => (
                <div className="grid gap-1" key={item.code}>
                  <label className="text-sm" htmlFor={`milestone-${index}`}>
                    {item.label} · calculated {percentText(item.percentBp)}%
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      className="min-w-0 w-28 rounded-control border border-border-strong bg-surface px-3 py-2"
                      id={`milestone-${index}`}
                      inputMode="decimal"
                      onChange={(event) =>
                        editMilestone(index, event.target.value)
                      }
                      value={milestoneText[index] ?? ""}
                    />
                    <span>%</span>
                  </div>
                </div>
              ))}
              <p className="text-sm" role="status">
                Total: {percentText(milestoneTotalBp(result, overrides))}%{" "}
                {milestonesValid
                  ? "· Ready for client preview"
                  : "· Must equal 100% before client preview or copy"}
              </p>
              {milestoneError ? (
                <p className="text-sm text-danger" role="alert">
                  {milestoneError}
                </p>
              ) : null}
              <Button
                className="w-fit"
                onClick={() => {
                  setMilestoneText(
                    result.payment.milestones.map((item) =>
                      percentText(item.percentBp),
                    ),
                  );
                  setMilestoneError("");
                  update("milestonePercentBp", undefined);
                }}
                variant="tertiary"
              >
                Restore milestones
              </Button>
            </fieldset>
            <details className="border-t border-border pt-4" key={resetCount}>
              <summary className="cursor-pointer font-semibold">
                More client presentation fields
              </summary>
              <div className="mt-4 grid gap-4">
                <div className="grid gap-2">
                  <label
                    className="font-semibold"
                    htmlFor="override-revision-rounds"
                  >
                    Included revision rounds{" "}
                    {custom.includedRevisionRounds === undefined
                      ? "· Calculated"
                      : "· Custom"}
                  </label>
                  <p className="text-sm text-ink-muted">
                    Calculated: {result.revisions.includedRounds}
                  </p>
                  <input
                    className="w-28 rounded-control border border-border-strong bg-surface px-3 py-2"
                    id="override-revision-rounds"
                    type="number"
                    min={0}
                    max={20}
                    value={
                      custom.includedRevisionRounds ??
                      result.revisions.includedRounds
                    }
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (
                        Number.isSafeInteger(value) &&
                        value >= 0 &&
                        value <= 20
                      )
                        update(
                          "includedRevisionRounds",
                          value === result.revisions.includedRounds
                            ? undefined
                            : value,
                        );
                    }}
                  />
                  <Button
                    className="w-fit"
                    onClick={() => update("includedRevisionRounds", undefined)}
                    variant="tertiary"
                  >
                    Restore revision rounds
                  </Button>
                </div>
                <MoneyOverride
                  label="Additional revision round"
                  calculated={result.revisions.extraRoundPrice.recommendedMinor}
                  currency={result.pricing.currency}
                  value={custom.extraRevisionAmountMinor}
                  onChange={(value) =>
                    update("extraRevisionAmountMinor", value)
                  }
                  onRestore={() =>
                    update("extraRevisionAmountMinor", undefined)
                  }
                />
                {result.maintenance.included ? (
                  <MoneyOverride
                    label="Monthly maintenance amount"
                    calculated={
                      result.maintenance.monthlyPrice!.recommendedMinor
                    }
                    currency={result.pricing.currency}
                    value={custom.maintenanceAmountMinor}
                    onChange={(value) =>
                      update("maintenanceAmountMinor", value)
                    }
                    onRestore={() =>
                      update("maintenanceAmountMinor", undefined)
                    }
                  />
                ) : null}
                <TextOverride
                  label="Project label"
                  value={custom.projectLabel ?? ""}
                  custom={custom.projectLabel !== undefined}
                  onChange={(value) =>
                    update("projectLabel", value || undefined)
                  }
                  onRestore={() => update("projectLabel", undefined)}
                />
                <TextOverride
                  label="Client label"
                  value={custom.clientLabel ?? ""}
                  custom={custom.clientLabel !== undefined}
                  onChange={(value) =>
                    update("clientLabel", value || undefined)
                  }
                  onRestore={() => update("clientLabel", undefined)}
                />
                <TextOverride
                  label="Maintenance offer"
                  value={custom.maintenanceOffer ?? ""}
                  custom={custom.maintenanceOffer !== undefined}
                  onChange={(value) =>
                    update("maintenanceOffer", value || undefined)
                  }
                  onRestore={() => update("maintenanceOffer", undefined)}
                />
                <TextOverride
                  label="Client notes"
                  value={custom.clientNotes ?? ""}
                  custom={custom.clientNotes !== undefined}
                  onChange={(value) =>
                    update("clientNotes", value || undefined)
                  }
                  onRestore={() => update("clientNotes", undefined)}
                  multiline
                />
                <ListOverride
                  label="Included scope"
                  calculated={scopeLines(result)}
                  value={custom.includedScope}
                  onChange={(value) => update("includedScope", value)}
                  onRestore={() => update("includedScope", undefined)}
                />
                <ListOverride
                  label="Exclusions"
                  calculated={exclusionLines(result)}
                  value={custom.exclusions}
                  onChange={(value) => update("exclusions", value)}
                  onRestore={() => update("exclusions", undefined)}
                />
              </div>
            </details>
          </section>
        </div>
      </div>
      <section
        aria-labelledby="client-heading"
        className="grid min-w-0 gap-5 border-t border-border pt-8"
      >
        <div>
          <h2 id="client-heading" className="text-2xl font-semibold">
            Client-ready preview
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            This preview excludes your hourly cost, margin, minimum safe price,
            risk calculation, and internal ledger.
          </p>
        </div>
        {!document ? (
          <Notice tone="warning" title="Client preview needs review">
            Correct the amount or milestone fields, and set milestone
            percentages to exactly 100%, before previewing or copying client
            text.
          </Notice>
        ) : (
          <>
            <article className="grid min-w-0 gap-5 rounded-section border border-border bg-surface p-5 sm:p-7">
              <header>
                <p className="text-sm font-semibold uppercase tracking-[0.1em] text-accent">
                  Project quote
                </p>
                <h3 className="mt-2 text-xl font-semibold">
                  {document.projectLabel ?? document.projectType}
                </h3>
                {document.clientLabel ? (
                  <p>Prepared for {document.clientLabel}</p>
                ) : null}
                <p className="mt-3 text-2xl font-semibold">
                  {document.price.presentation === "range"
                    ? `${money(document.price.lowMinor)}–${money(document.price.highMinor)}`
                    : money(document.price.quoteMinor)}
                </p>
                {document.price.presentation === "range" ? (
                  <p className="mt-1 text-sm text-ink-muted">
                    {PLANNING_RANGE_NOTE}
                  </p>
                ) : null}
              </header>
              <PreviewList heading="Included scope" items={document.scope} />
              <PreviewList heading="Exclusions" items={document.exclusions} />
              <p>Expected delivery: {document.timeline}</p>
              <p>
                Revision policy: {document.revisions.includedRounds} rounds
                included; additional round{" "}
                {money(document.revisions.extraRoundPriceMinor)}.
              </p>
              <div>
                <h4 className="font-semibold">Payment milestones</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {document.milestones.map((item, index) => (
                    <li key={index}>
                      {item.label}: {percentText(item.percentBp)}% (
                      {money(item.amountMinor)})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">Additional work</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {document.changeRequests.map((item, index) => (
                    <li key={index}>
                      {item.label}: from {money(item.priceMinor)}
                    </li>
                  ))}
                </ul>
              </div>
              <p>Maintenance: {document.maintenance}</p>
              <p>Launch support: {document.support}</p>
              {document.clientNotes ? (
                <p>Notes: {document.clientNotes}</p>
              ) : null}
            </article>
            <div className="grid gap-3">
              <label className="font-semibold" htmlFor="client-summary">
                Client-ready text
              </label>
              <textarea
                className="min-h-52 w-full rounded-control border border-border-strong bg-surface p-3 text-sm leading-6"
                id="client-summary"
                readOnly
                value={summary}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={async () =>
                    setCopyStatus(
                      (await copyClientSummary(summary)) === "copied"
                        ? "Copied client summary."
                        : "Clipboard unavailable or denied. Select and copy the text above manually.",
                    )
                  }
                >
                  Copy client summary
                </Button>
                <span role="status">{copyStatus}</span>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="mt-1 break-words font-semibold">{value}</dd>
    </div>
  );
}
function PreviewList({
  heading,
  items,
}: {
  heading: string;
  items: readonly string[];
}) {
  return (
    <div>
      <h4 className="font-semibold">{heading}</h4>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
function TextOverride({
  label,
  value,
  custom,
  onChange,
  onRestore,
  multiline = false,
}: {
  label: string;
  value: string;
  custom: boolean;
  onChange: (value: string) => void;
  onRestore: () => void;
  multiline?: boolean;
}) {
  const id = `override-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="grid gap-2">
      <label className="font-semibold" htmlFor={id}>
        {label} {custom ? "· Custom" : "· Calculated"}
      </label>
      {multiline ? (
        <textarea
          className="min-h-24 rounded-control border border-border-strong bg-surface p-3"
          id={id}
          maxLength={2000}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      ) : (
        <input
          className="rounded-control border border-border-strong bg-surface px-3 py-2"
          id={id}
          maxLength={240}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      )}
      <Button className="w-fit" onClick={onRestore} variant="tertiary">
        Restore {label.toLowerCase()}
      </Button>
    </div>
  );
}
function MoneyOverride({
  label,
  calculated,
  currency,
  value,
  onChange,
  onRestore,
}: {
  label: string;
  calculated: number;
  currency: CurrencyCode;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onRestore: () => void;
}) {
  const id = `override-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const [text, setText] = useState(minorText(value ?? calculated));
  const [error, setError] = useState("");
  return (
    <div className="grid gap-2">
      <label className="font-semibold" htmlFor={id}>
        {label} {value === undefined ? "· Calculated" : "· Custom"}
      </label>
      <p className="text-sm text-ink-muted">
        Calculated: {formatMoney(calculated, currency)}
      </p>
      <input
        className="rounded-control border border-border-strong bg-surface px-3 py-2"
        id={id}
        inputMode="decimal"
        onChange={(event) => {
          const raw = event.target.value;
          setText(raw);
          const parsed = parseMoneyText(raw, currency);
          if (parsed === null) {
            setError("Enter a valid non-negative amount.");
            return;
          }
          setError("");
          onChange(parsed === calculated ? undefined : parsed);
        }}
        value={text}
      />
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        className="w-fit"
        onClick={() => {
          setText(minorText(calculated));
          setError("");
          onRestore();
        }}
        variant="tertiary"
      >
        Restore {label.toLowerCase()}
      </Button>
    </div>
  );
}
function ListOverride({
  label,
  calculated,
  value,
  onChange,
  onRestore,
}: {
  label: string;
  calculated: string[];
  value: string[] | undefined;
  onChange: (value: string[]) => void;
  onRestore: () => void;
}) {
  const id = `override-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="grid gap-2">
      <label className="font-semibold" htmlFor={id}>
        {label} {value ? "· Custom" : "· Calculated"}
      </label>
      <p className="text-sm text-ink-muted">
        One item per line. Calculated items: {calculated.length}.
      </p>
      <textarea
        className="min-h-32 rounded-control border border-border-strong bg-surface p-3"
        id={id}
        onChange={(event) =>
          onChange(
            event.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          )
        }
        value={(value ?? calculated).join("\n")}
      />
      <Button className="w-fit" onClick={onRestore} variant="tertiary">
        Restore {label.toLowerCase()}
      </Button>
    </div>
  );
}
