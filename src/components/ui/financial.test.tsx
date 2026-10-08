import { render, screen } from "@testing-library/react";

import {
  DefinitionValue,
  formatMinorUnits,
  MoneyDisplay,
  PriceRange,
} from "@/components/ui/financial";

describe("financial display primitives", () => {
  it("formats integer minor units without floating-point input", () => {
    expect(formatMinorUnits(125000, "INR")).toContain("1,250.00");
  });

  it("renders a range and definition row with readable labels", () => {
    render(
      <>
        <PriceRange currency="USD" high={180000} low={120000} />
        <MoneyDisplay amountMinor={150000} currency="USD" size="large" />
        <dl>
          <DefinitionValue
            detail="Calculated"
            label="Timeline"
            value="4 weeks"
          />
        </dl>
      </>,
    );

    expect(screen.getByText(/Recommended planning range/)).toBeInTheDocument();
    expect(screen.getByText(/\$1,200\.00/)).toBeInTheDocument();
    expect(screen.getByText("4 weeks")).toBeInTheDocument();
  });
});
