import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ResultWorkspace } from "@/components/quote-results/result-workspace";
import {
  ACTIVE_PRICING_CONFIG,
  calculateQuote,
  PRICING_CONFIG_V1,
  PRICING_CONFIG_V2,
} from "@/domain/quote";
import {
  clearPersistedQuote,
  OVERRIDE_STORAGE_KEY,
  saveLatestResult,
} from "@/features/quote-builder/persistence";
import {
  emptyOverrides,
  loadOverrides,
  REVISION_ROUNDS_LIMITS,
  saveOverrides,
  updateOverride,
} from "@/features/quote-results/overrides";
import { quoteFixtures } from "../../../tests/fixtures/quotes/v1";

const outcome = calculateQuote(
  quoteFixtures.smallBusinessSite,
  ACTIVE_PRICING_CONFIG,
);
if (!outcome.ok) throw new Error("invalid fixture");
const quote = outcome.result;

describe("revision-round limit", () => {
  beforeEach(() => {
    clearPersistedQuote();
    window.localStorage.clear();
  });

  it("is the same maximum the domain and the builder enforce", () => {
    expect(REVISION_ROUNDS_LIMITS.max).toBe(5);
    expect(PRICING_CONFIG_V1.validation.revisionRounds.max).toBe(5);
    expect(PRICING_CONFIG_V2.validation.revisionRounds.max).toBe(5);
    expect(REVISION_ROUNDS_LIMITS).toEqual(
      ACTIVE_PRICING_CONFIG.validation.revisionRounds,
    );
  });

  it("accepts 0 and 5 rounds and refuses 6 in the override layer", () => {
    const base = emptyOverrides(quote);
    for (const rounds of [0, 5]) {
      expect(
        updateOverride(base, "includedRevisionRounds", rounds).values
          .includedRevisionRounds,
      ).toBe(rounds);
    }
    for (const rounds of [6, 20, -1]) {
      const next = updateOverride(base, "includedRevisionRounds", rounds);
      expect(next.values.includedRevisionRounds).toBeUndefined();
    }
    expect(
      saveOverrides(
        {
          ...base,
          values: { includedRevisionRounds: 6 },
        },
        window.localStorage,
      ),
    ).toBe(false);
  });

  it("drops only an out-of-range saved round count and keeps other saved terms", () => {
    const base = emptyOverrides(quote);
    window.localStorage.setItem(
      OVERRIDE_STORAGE_KEY,
      JSON.stringify({
        storageVersion: 1,
        ...base,
        values: { includedRevisionRounds: 12, quoteAmountMinor: 777_000 },
      }),
    );
    const loaded = loadOverrides(quote, window.localStorage);
    expect(loaded.status).toBe("adjusted");
    expect(loaded.overrides.values.includedRevisionRounds).toBeUndefined();
    expect(loaded.overrides.values.quoteAmountMinor).toBe(777_000);
  });

  it("limits the results editor input to the domain maximum and ignores larger typing", async () => {
    const user = userEvent.setup();
    saveLatestResult(quote);
    render(<ResultWorkspace />);
    const input = (await screen.findByRole("spinbutton", {
      name: /Included revision rounds/,
    })) as HTMLInputElement;
    expect(input.max).toBe("5");
    expect(input.min).toBe("0");
    await user.clear(input);
    await user.type(input, "7");
    expect(Number(input.value)).toBeLessThanOrEqual(5);
    await user.clear(input);
    await user.type(input, "4");
    expect(input.value).toBe("4");
  });
});
