import { createDefaultDraft } from "@/features/quote-builder/defaults";
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

describe("quote builder presentation", () => {
  it("uses customer-facing labels instead of stored enum values", () => {
    expect(designLabel("custom")).toBe("Custom design");
    expect(contentLabel("provided")).toBe("Client supplies content");
    expect(urgencyLabel("standard")).toBe("Normal");
    expect(deploymentLabel("freelancer")).toBe("I handle deployment");
    expect(contingencyLabel("balanced")).toBe("Balanced");
    expect(riskLabel("medium")).toBe("Medium exposure");
    expect(testingLabel("essential")).toBe("Essential testing");
    expect(migrationLabel("none")).toBe("No migration");
    expect(maintenanceLabel("none")).toBe("No maintenance plan");
    expect(supportLabel("0")).toBe("No post-launch support");
  });

  it("omits a count for one integration and preserves larger quantities", () => {
    const integrations = {
      ...createDefaultDraft().integrations,
      analytics: "1",
      maps: "1",
      crm: "3",
      customApi: "2",
    };

    expect(formatIntegrationSummary(integrations)).toEqual([
      "3 CRM integrations",
      "Analytics",
      "Maps",
      "2 custom APIs",
    ]);
  });
});
