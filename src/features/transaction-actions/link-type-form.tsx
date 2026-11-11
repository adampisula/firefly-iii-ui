"use client";

import { useActionState } from "react";
import { Button, ErrorSummary } from "@/components/ui/primitives";
import type { LinkType } from "./service";
import { saveLinkTypeAction, type LinkActionState } from "./actions";

const INITIAL: LinkActionState = { ok: false, message: "", errors: {} };

export function LinkTypeForm({ linkType }: { linkType?: LinkType }) {
  const [state, formAction, pending] = useActionState(
    saveLinkTypeAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      {linkType ? (
        <input type="hidden" name="link_type_id" value={linkType.id} />
      ) : null}
      {state.message ? (
        <ErrorSummary
          title={state.ok ? "Saved" : "Check the link type"}
          errors={[{ id: "link-type-error", message: state.message }]}
        />
      ) : null}
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="link-type-name">
            Name
          </label>
          <input
            className="select"
            id="link-type-name"
            name="name"
            defaultValue={linkType?.name ?? ""}
            required
            maxLength={1024}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="link-type-outward">
            Outward description
          </label>
          <input
            className="select"
            id="link-type-outward"
            name="outward"
            defaultValue={linkType?.outward ?? ""}
            required
            maxLength={1024}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="link-type-inward">
            Inward description
          </label>
          <input
            className="select"
            id="link-type-inward"
            name="inward"
            defaultValue={linkType?.inward ?? ""}
            required
            maxLength={1024}
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending
          ? "Saving..."
          : linkType
            ? "Save link type"
            : "Create link type"}
      </Button>
      <p className="muted-note">
        Link-type creation, editing and deletion are owner operations; the
        backend enforces permission.
      </p>
    </form>
  );
}
