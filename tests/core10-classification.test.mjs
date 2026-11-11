import assert from "node:assert/strict";
import test from "node:test";
import {
  mapCategories,
  mapObjectGroups,
  mapTags,
} from "../src/features/classification/service.ts";
import { resolveOperationPath } from "../src/lib/api/operations.ts";

test("category, tag and object-group mapping keeps names and metadata", () => {
  assert.deepEqual(
    mapCategories({
      data: [
        { id: "1", attributes: { name: "Food", notes: "n" } },
        { id: "2", attributes: {} },
      ],
    }),
    [{ id: "1", name: "Food", notes: "n" }],
  );
  assert.deepEqual(
    mapTags({
      data: [
        {
          id: "3",
          attributes: {
            tag: "Holiday ✓",
            description: "d",
            date: "2026-01-01",
          },
        },
      ],
    }),
    [{ id: "3", tag: "Holiday ✓", description: "d", date: "2026-01-01" }],
  );
  assert.deepEqual(
    mapObjectGroups({
      data: [{ id: "4", attributes: { title: "Media", order: 2 } }],
    }),
    [{ id: "4", title: "Media", order: 2 }],
  );
});

test("tag path parameters allow names, Unicode and reject slashes", () => {
  assert.equal(
    resolveOperationPath("tags.show", { tagOrId: "Holiday ✓" }),
    "tags/Holiday%20%E2%9C%93",
  );
  assert.equal(resolveOperationPath("tags.show", { tagOrId: "12" }), "tags/12");
  assert.throws(
    () => resolveOperationPath("tags.show", { tagOrId: "a/b" }),
    /tag name/,
  );
  assert.throws(
    () => resolveOperationPath("tags.show", { tagOrId: "" }),
    /tag name/,
  );
});
