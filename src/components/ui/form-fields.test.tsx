import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CheckboxField } from "@/components/ui/checkbox-field";
import { FieldGroup } from "@/components/ui/field-group";
import { InputField } from "@/components/ui/input-field";
import { RadioGroupField } from "@/components/ui/radio-group-field";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";

describe("form field primitives", () => {
  it("associates input help and error text with the control", () => {
    render(
      <InputField
        description="Use the amount below which the project is not viable."
        error="Enter an hourly value."
        id="hourly-value"
        label="Minimum hourly value"
        required
      />,
    );

    const input = screen.getByRole("textbox", {
      name: /Minimum hourly value/,
    });

    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription(
      "Use the amount below which the project is not viable. Enter an hourly value.",
    );
  });

  it("supports native select keyboard interaction", async () => {
    const user = userEvent.setup();

    render(
      <SelectField
        id="currency"
        label="Currency"
        options={[
          { label: "Indian rupee", value: "INR" },
          { label: "US dollar", value: "USD" },
        ]}
      />,
    );

    const select = screen.getByRole("combobox", { name: "Currency" });
    await user.selectOptions(select, "USD");
    expect(select).toHaveValue("USD");
  });

  it("gives a checkbox a useful label and description", () => {
    render(
      <CheckboxField
        description="Adds an explicit maintenance recommendation."
        id="maintenance"
        label="Include maintenance"
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: /Include maintenance/ }),
    ).toHaveAccessibleDescription(
      "Adds an explicit maintenance recommendation.",
    );
  });

  it("supports field groups, optional labels, and textarea descriptions", () => {
    render(
      <FieldGroup
        description="Keep the brief concise."
        legend="Project context"
      >
        <TextareaField
          description="This helps explain the work to a client."
          id="context"
          label="Project context"
          optional
        />
      </FieldGroup>,
    );

    expect(
      screen.getByRole("group", { name: "Project context" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Project context/ }),
    ).toHaveAccessibleDescription("This helps explain the work to a client.");
    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });

  it("uses a fieldset and native radios for conceptual choices", async () => {
    const user = userEvent.setup();

    render(
      <RadioGroupField
        description="Choose the starting point for the project."
        legend="Design starting point"
        name="design"
        options={[
          { label: "Provided design", value: "provided" },
          { label: "Custom design", value: "custom" },
        ]}
      />,
    );

    const custom = screen.getByRole("radio", { name: "Custom design" });
    await user.click(custom);
    expect(custom).toBeChecked();
    expect(custom).toHaveAccessibleDescription(
      "Choose the starting point for the project.",
    );
  });
});
