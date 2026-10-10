import {
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
