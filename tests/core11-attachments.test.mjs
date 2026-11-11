import assert from "node:assert/strict";
import test from "node:test";
import { mapAttachments } from "../src/features/attachments/service.ts";

test("attachment mapping preserves attachable identity and metadata", () => {
  const attachments = mapAttachments({
    data: [
      {
        id: "1",
        attributes: {
          title: "Receipt",
          filename: "r.pdf",
          mime: "application/pdf",
          size: 12,
          attachable_type: "Category",
          attachable_id: "3",
          notes: "n",
          created_at: "2026-01-01",
        },
      },
      { id: "2", attributes: {} },
    ],
  });
  assert.equal(attachments.length, 1);
  assert.equal(attachments[0].attachableType, "Category");
  assert.equal(attachments[0].attachableId, "3");
  assert.equal(attachments[0].size, 12);
  assert.equal(mapAttachments(null).length, 0);
});
