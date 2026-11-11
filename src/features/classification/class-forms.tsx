"use client";
import { useActionState, useState } from "react";
import { Button, Dialog, ErrorSummary } from "@/components/ui/primitives";
import type { CategoryRecord, ObjectGroupRecord, TagRecord } from "./service";
import {
  deleteCategoryAction,
  deleteObjectGroupAction,
  deleteTagAction,
  saveCategoryAction,
  saveObjectGroupAction,
  saveTagAction,
  type ClassActionState,
} from "./actions";

const INITIAL: ClassActionState = { ok: false, message: "", errors: {} };
function Messages({ state }: { state: ClassActionState }) {
  if (!state.message && Object.keys(state.errors).length === 0) return null;
  return (
    <ErrorSummary
      title={state.ok ? "Saved" : state.message}
      errors={Object.entries(state.errors).map(([field, message]) => ({
        id: field,
        message: `${field}: ${message}`,
      }))}
    />
  );
}
function Confirm({
  title,
  label,
  action,
  fields,
  text,
}: {
  title: string;
  label: string;
  action: (
    state: ClassActionState,
    formData: FormData,
  ) => Promise<ClassActionState>;
  fields: Record<string, string>;
  text: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, INITIAL);
  return (
    <>
      <Button type="button" tone="danger" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} title={title} onOpenChange={setOpen}>
        <form action={formAction} className="form-stack">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <Messages state={state} />
          <p>{text}</p>
          <label className="checkbox-row">
            <input type="checkbox" name="confirm_delete" value="yes" required />
            <span>I understand this deletion cannot be undone.</span>
          </label>
          <div className="button-row">
            <Button type="submit" tone="danger" disabled={pending}>
              {pending ? "Deleting..." : "Delete"}
            </Button>
            <Button type="button" tone="quiet" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
export function CategoryForm({ category }: { category?: CategoryRecord }) {
  const [state, formAction, pending] = useActionState(
    saveCategoryAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      {category ? (
        <input type="hidden" name="category_id" value={category.id} />
      ) : null}
      <Messages state={state} />
      <div className="field-group">
        <label className="field-label" htmlFor="category-name">
          Name
        </label>
        <input
          className="select"
          id="category-name"
          name="name"
          defaultValue={category?.name ?? ""}
          required
          maxLength={255}
        />
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="category-notes">
          Notes
        </label>
        <textarea
          className="select"
          id="category-notes"
          name="notes"
          rows={3}
          defaultValue={category?.notes ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : category ? "Save category" : "Create category"}
      </Button>
    </form>
  );
}
export function TagForm({ tag }: { tag?: TagRecord }) {
  const [state, formAction, pending] = useActionState(saveTagAction, INITIAL);
  return (
    <form action={formAction} className="form-stack">
      {tag ? (
        <>
          <input type="hidden" name="tag_id" value={tag.id} />
          <input type="hidden" name="original_tag" value={tag.tag} />
        </>
      ) : null}
      <Messages state={state} />
      <div className="field-group">
        <label className="field-label" htmlFor="tag-name">
          Tag
        </label>
        <input
          className="select"
          id="tag-name"
          name="tag"
          defaultValue={tag?.tag ?? ""}
          required
          maxLength={255}
        />
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="tag-description">
          Description
        </label>
        <input
          className="select"
          id="tag-description"
          name="description"
          defaultValue={tag?.description ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : tag ? "Save tag" : "Create tag"}
      </Button>
    </form>
  );
}
export function ObjectGroupForm({ group }: { group: ObjectGroupRecord }) {
  const [state, formAction, pending] = useActionState(
    saveObjectGroupAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      <input type="hidden" name="group_id" value={group.id} />
      <Messages state={state} />
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="group-title">
            Title
          </label>
          <input
            className="select"
            id="group-title"
            name="title"
            defaultValue={group.title}
            required
            maxLength={255}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="group-order">
            Order
          </label>
          <input
            className="select"
            id="group-order"
            name="order"
            inputMode="numeric"
            defaultValue={group.order}
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save object group"}
      </Button>
    </form>
  );
}
export function DeleteCategory({ id, name }: { id: string; name: string }) {
  return (
    <Confirm
      title={`Delete ${name}`}
      label="Delete category"
      action={deleteCategoryAction}
      fields={{ category_id: id }}
      text="This deletes the category through Firefly. Transactions are not reassigned by the frontend."
    />
  );
}
export function DeleteTag({ tag }: { tag: TagRecord }) {
  return (
    <Confirm
      title={`Delete ${tag.tag}`}
      label="Delete tag"
      action={deleteTagAction}
      fields={{ tag_id: tag.id, tag: tag.tag }}
      text="This removes the tag. Tag mass deletion has no supported API and is not offered."
    />
  );
}
export function DeleteObjectGroup({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <Confirm
      title={`Delete ${title}`}
      label="Delete object group"
      action={deleteObjectGroupAction}
      fields={{ group_id: id }}
      text="This deletes the object group through Firefly. Associated resources are not reassigned by the frontend."
    />
  );
}
