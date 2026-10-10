import {
  formatAmountInput,
  formatMoney,
  parseMoneyText,
} from "@/features/client-summary/document";

describe("formatMoney", () => {
  it.each([
    [0, "₹0"],
    [100, "₹1"],
    [99_900, "₹999"],
    [100_000, "₹1,000"],
    [1_000_000, "₹10,000"],
    [9_500_000, "₹95,000"],
    [10_000_000, "₹1,00,000"],
    [12_345_600, "₹1,23,456"],
    [123_456_700, "₹12,34,567"],
    [12_345_678_900, "₹12,34,56,789"],
  ])("groups rupees the Indian way: %i minor units -> %s", (minor, text) => {
    expect(formatMoney(minor, "INR")).toBe(text);
  });

  it("keeps paise only when they are not zero", () => {
    expect(formatMoney(12_345_650, "INR")).toBe("₹1,23,456.50");
    expect(formatMoney(12_345_605, "INR")).toBe("₹1,23,456.05");
  });

  it("leaves USD, GBP and EUR unchanged", () => {
    expect(formatMoney(12_345_600, "USD")).toBe("$123,456.00");
    expect(formatMoney(12_345_600, "GBP")).toBe("£123,456.00");
    expect(formatMoney(12_345_600, "EUR")).toBe("€123,456.00");
    expect(formatMoney(150_000, "USD")).toBe("$1,500.00");
    expect(formatMoney(5, "USD")).toBe("$0.05");
  });

  it("round-trips Indian-grouped text through the amount parser", () => {
    expect(parseMoneyText("₹1,23,456".replace("₹", ""), "INR")).toBe(
      12_345_600,
    );
    expect(parseMoneyText("1,23,456.50", "INR")).toBe(12_345_650);
  });
});

describe("formatAmountInput", () => {
  it.each([
    [5_400_000, "INR", "54,000"],
    [12_345_600, "INR", "1,23,456"],
    [12_345_650, "INR", "1,23,456.50"],
    [0, "INR", "0"],
    [5_400_000, "USD", "54,000"],
    [123_456_700, "USD", "1,234,567"],
    [5_400_050, "USD", "54,000.50"],
    [5_400_005, "GBP", "54,000.05"],
    [100_000, "EUR", "1,000"],
    [99, "EUR", "0.99"],
  ] as const)("shows %i minor %s as %s", (minor, currency, text) => {
    expect(formatAmountInput(minor, currency)).toBe(text);
    expect(text).not.toMatch(/\.00$/);
  });

  it("reads back to the same amount, so editing never changes the value", () => {
    for (const currency of ["INR", "USD", "GBP", "EUR"] as const) {
      for (const minor of [
        0, 1, 99, 100, 150_000, 5_400_000, 12_345_650, 987_654_321,
      ]) {
        expect(
          parseMoneyText(formatAmountInput(minor, currency), currency),
        ).toBe(minor);
      }
    }
  });

  it("still accepts typed decimals and grouping", () => {
    expect(parseMoneyText("54000.5", "USD")).toBe(5_400_050);
    expect(parseMoneyText("54,000", "INR")).toBe(5_400_000);
    expect(parseMoneyText("54000.50", "INR")).toBe(5_400_050);
    expect(parseMoneyText("54000.555", "INR")).toBeNull();
    expect(parseMoneyText("abc", "INR")).toBeNull();
  });
});
