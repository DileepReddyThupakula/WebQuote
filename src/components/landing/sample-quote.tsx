import {
  formatMoney,
  type ClientQuoteDocumentV1,
} from "@/features/client-summary/document";

const SHOWN_EXCLUSIONS = 5;
const SHOWN_CHANGE_REQUESTS = new Set([
  "Additional page",
  "Additional revision round",
  "Standard integration",
]);

export function SampleQuote({ document }: { document: ClientQuoteDocumentV1 }) {
  const money = (minor: number) => formatMoney(minor, document.currency);
  const shownExclusions = document.exclusions.slice(0, SHOWN_EXCLUSIONS);
  const hiddenExclusions = document.exclusions.length - shownExclusions.length;
  const changeRequests = document.changeRequests.filter((item) =>
    SHOWN_CHANGE_REQUESTS.has(item.label),
  );

  return (
    <article
      aria-label="Sample client quote"
      className="grid min-w-0 gap-6 rounded-section border border-border bg-surface p-5 sm:p-8"
    >
      <header className="grid gap-2 border-b border-border pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.1em] text-accent">
          Project quote · sample
        </p>
        <h3 className="text-xl font-semibold text-ink">
          {document.projectType}
        </h3>
        <p className="break-words text-3xl font-semibold tracking-[-0.03em] text-ink">
          {money(document.price.quoteMinor)}
        </p>
        <p className="text-sm text-ink-muted">
          Expected delivery: {document.timeline}
        </p>
      </header>

      <section aria-labelledby="sample-scope">
        <h4 className="font-semibold text-ink" id="sample-scope">
          Included scope
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-ink-muted">
          {document.scope.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sample-exclusions">
        <h4 className="font-semibold text-ink" id="sample-exclusions">
          Not included
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-ink-muted">
          {shownExclusions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {hiddenExclusions > 0 ? (
          <p className="mt-2 text-sm text-ink-muted">
            Plus {hiddenExclusions} more standard exclusions in the full quote.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="sample-payments">
        <h4 className="font-semibold text-ink" id="sample-payments">
          Payment plan
        </h4>
        <table className="mt-2 w-full border-collapse text-left text-sm">
          <thead className="sr-only">
            <tr>
              <th scope="col">Milestone</th>
              <th scope="col">Share</th>
              <th scope="col">Amount</th>
            </tr>
          </thead>
          <tbody>
            {document.milestones.map((item) => (
              <tr className="border-b border-border" key={item.label}>
                <th
                  className="break-words py-2 pr-3 font-normal text-ink-muted"
                  scope="row"
                >
                  {item.label}
                </th>
                <td className="whitespace-nowrap py-2 pr-3 text-ink-muted">
                  {item.percentBp / 100}%
                </td>
                <td className="whitespace-nowrap py-2 text-right font-semibold text-ink">
                  {money(item.amountMinor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="sample-terms">
        <h4 className="font-semibold text-ink" id="sample-terms">
          Revisions and changes
        </h4>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {document.revisions.includedRounds} revision rounds are included. An
          extra round is {money(document.revisions.extraRoundPriceMinor)}.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-ink-muted">
          {changeRequests.map((item) => (
            <li key={item.label}>
              {item.label}: from {money(item.priceMinor)}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {document.support}. {document.maintenance}.
        </p>
      </section>
    </article>
  );
}
