"use client";

import { useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Badge, Button, Dialog, Input } from "@/components/ui";

/** Real interactions for reviewing primitives without backend claims. */
export function PreviewControls() {
  const [notice, setNotice] = useState(false);
  const [about, setAbout] = useState(false);
  const [name, setName] = useState("Up17 Gaming");
  return (
    <div className="grid grid-2">
      <section className="card card-raised">
        <div className="card-header">
          <div>
            <h2 className="card-title">Tactile controls</h2>
            <p className="card-description">
              Preview an inline notice, inspect accessibility notes, or edit the local label.
            </p>
          </div>
        </div>
        <div className="row row-wrap">
          <Button variant="primary" icon={<Sparkles size={18} />} onClick={() => setNotice(true)}>
            Preview notice
          </Button>
          <Button
            onClick={() => {
              setNotice(false);
              setName("Up17 Gaming");
            }}
          >
            Reset
          </Button>
          <Button variant="ghost" onClick={() => setAbout(true)}>
            Accessibility
          </Button>
          <Button disabled title="Publishing requires a separately approved integration">
            Publish unavailable
          </Button>
        </div>
        {notice ? (
          <p className="preview-notice" role="status">
            <Check size={18} aria-hidden="true" /> Interface preview only. Nothing was published.
          </p>
        ) : null}
        <hr className="divider" />
        <Input
          label="Preview workspace label"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          hint="This field does not change workspace settings."
        />
      </section>
      <section className="card card-inset">
        <div className="card-header">
          <div>
            <h2 className="card-title">Honest states</h2>
            <p className="card-description">
              Unavailable operations explain why instead of pretending to succeed.
            </p>
          </div>
        </div>
        <div className="stack">
          <div className="row row-wrap">
            <Badge tone="success">Ready</Badge>
            <Badge tone="warning">Needs attention</Badge>
            <Badge tone="danger">Failed</Badge>
            <Badge tone="accent">Demo data</Badge>
          </div>
          <p className="unavailable-note">
            <strong>Publishing unavailable.</strong> No platform accounts are connected in this
            frontend phase.
          </p>
          <Button variant="primary" icon={<ArrowRight size={18} />} onClick={() => setAbout(true)}>
            Read interface notes
          </Button>
        </div>
      </section>
      <Dialog
        open={about}
        onClose={() => setAbout(false)}
        title="Designed for clarity"
        description="Frontend-only design-system review"
        footer={
          <Button variant="primary" onClick={() => setAbout(false)}>
            Got it
          </Button>
        }
      >
        <ul className="notes-list">
          <li>All controls support keyboard focus and visible focus rings.</li>
          <li>Theme preference stays in this browser. System mode follows your device.</li>
          <li>Reduced-motion preferences remove nonessential animation.</li>
          <li>No account connection, upload, AI analysis or publishing is performed.</li>
        </ul>
      </Dialog>
    </div>
  );
}
