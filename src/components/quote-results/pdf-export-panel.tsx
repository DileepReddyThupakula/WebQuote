"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ClientQuoteDocumentV1 } from "@/features/client-summary/document";
import { exportClientQuotePdf } from "@/features/client-summary/pdf-export";
import {
  EMPTY_SENDER_PROFILE,
  loadSenderProfile,
  saveSenderProfile,
  SENDER_CONTACT_MAX_LENGTH,
  SENDER_NAME_MAX_LENGTH,
  type SenderProfile,
} from "@/features/client-summary/sender-profile";

export function PdfExportPanel({
  document,
}: {
  document: ClientQuoteDocumentV1;
}) {
  const [profile, setProfile] = useState<SenderProfile>(EMPTY_SENDER_PROFILE);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setProfile(loadSenderProfile()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function update(next: SenderProfile) {
    setProfile(next);
    saveSenderProfile(next);
  }

  async function download() {
    setBusy(true);
    setFailed(false);
    setStatus("Preparing your PDF…");
    const outcome = await exportClientQuotePdf(document, profile);
    setBusy(false);
    if (outcome.status === "downloaded") {
      setStatus(`Downloaded ${outcome.filename}.`);
    } else {
      setFailed(true);
      setStatus(
        "The PDF could not be created. Your quote is unchanged. Try again, or use Copy client summary and paste it into your own document.",
      );
    }
  }

  return (
    <div className="grid gap-4 border-t border-border pt-5">
      <div>
        <h4 className="font-semibold">Download as PDF</h4>
        <p className="mt-1 text-sm text-ink-muted">
          The PDF is built in your browser from the client-ready quote above and
          contains only what the client preview shows. Your name and contact
          line are saved in this browser only.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="font-semibold" htmlFor="pdf-sender-name">
            Your name or business name{" "}
            <span className="text-sm font-normal text-ink-muted">
              · Optional
            </span>
          </label>
          <input
            autoComplete="organization"
            className="rounded-control border border-border-strong bg-surface px-3 py-2"
            id="pdf-sender-name"
            maxLength={SENDER_NAME_MAX_LENGTH}
            onChange={(event) =>
              update({ ...profile, name: event.target.value })
            }
            type="text"
            value={profile.name}
          />
        </div>
        <div className="grid gap-2">
          <label className="font-semibold" htmlFor="pdf-sender-contact">
            Contact line{" "}
            <span className="text-sm font-normal text-ink-muted">
              · Optional
            </span>
          </label>
          <input
            className="rounded-control border border-border-strong bg-surface px-3 py-2"
            id="pdf-sender-contact"
            maxLength={SENDER_CONTACT_MAX_LENGTH}
            onChange={(event) =>
              update({ ...profile, contact: event.target.value })
            }
            placeholder="Email, phone or website"
            type="text"
            value={profile.contact}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={busy} onClick={download}>
          {failed ? "Try PDF again" : "Download PDF"}
        </Button>
        <span role="status">{status}</span>
      </div>
    </div>
  );
}
