import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PdfExportPanel } from "@/components/quote-results/pdf-export-panel";
import * as exporter from "@/features/client-summary/pdf-export";
import { SENDER_PROFILE_STORAGE_KEY } from "@/features/client-summary/sender-profile";
import { buildSampleQuote } from "@/features/sample-quote/sample-quote";

describe("PdfExportPanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves the name and contact line in this browser and exports the document", async () => {
    const user = userEvent.setup();
    const spy = vi
      .spyOn(exporter, "exportClientQuotePdf")
      .mockResolvedValue({ status: "downloaded", filename: "x-quote.pdf" });
    const document = buildSampleQuote();
    render(<PdfExportPanel document={document} />);

    await user.type(
      screen.getByLabelText(/Your name or business name/),
      "Asha Rao Studio",
    );
    await user.type(screen.getByLabelText(/Contact line/), "asha@example.com");
    expect(
      JSON.parse(window.localStorage.getItem(SENDER_PROFILE_STORAGE_KEY)!),
    ).toMatchObject({ name: "Asha Rao Studio", contact: "asha@example.com" });

    await user.click(screen.getByRole("button", { name: "Download PDF" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Downloaded x-quote.pdf.",
      ),
    );
    expect(spy).toHaveBeenCalledWith(document, {
      name: "Asha Rao Studio",
      contact: "asha@example.com",
    });
  });

  it("restores a saved profile", async () => {
    window.localStorage.setItem(
      SENDER_PROFILE_STORAGE_KEY,
      JSON.stringify({ storageVersion: 1, name: "Saved Name", contact: "" }),
    );
    render(<PdfExportPanel document={buildSampleQuote()} />);
    await waitFor(() =>
      expect(screen.getByLabelText(/Your name or business name/)).toHaveValue(
        "Saved Name",
      ),
    );
  });

  it("explains a failure, keeps the quote, and offers retry", async () => {
    const user = userEvent.setup();
    vi.spyOn(exporter, "exportClientQuotePdf").mockResolvedValue({
      status: "failed",
      reason: "render",
    });
    render(<PdfExportPanel document={buildSampleQuote()} />);
    await user.click(screen.getByRole("button", { name: "Download PDF" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      /could not be created.*unchanged.*Copy client summary/,
    );
    expect(screen.getByRole("button", { name: "Try PDF again" })).toBeEnabled();
  });
});
