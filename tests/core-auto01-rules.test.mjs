import assert from "node:assert/strict";
import test from "node:test";
import {
  mapRules,
  rulePayload,
  validateRuleDraft,
} from "../src/features/rules/service.ts";

function draft(overrides = {}) {
  return {
    title: "Rule",
    description: "",
    ruleGroupId: "1",
    trigger: "store-journal",
    strict: false,
    stopProcessing: false,
    active: true,
    triggers: [
      {
        type: "description_contains",
        value: "x",
        active: true,
        stopProcessing: false,
      },
    ],
    actions: [
      {
        type: "set_description",
        value: "y",
        active: true,
        stopProcessing: false,
      },
    ],
    ...overrides,
  };
}

test("rule mapping keeps triggers, actions and group identity", () => {
  const rules = mapRules({
    data: [
      {
        id: "9",
        attributes: {
          title: "R",
          rule_group_id: "2",
          rule_group_title: "G",
          trigger: "store-journal",
          triggers: [
            { id: "1", type: "description_contains", value: "x", active: true },
          ],
          actions: [
            { id: "2", type: "set_description", value: "y", active: true },
          ],
        },
      },
    ],
  });
  assert.equal(rules[0].ruleGroupTitle, "G");
  assert.equal(rules[0].triggers[0].type, "description_contains");
  assert.equal(rules[0].actions[0].value, "y");
});

test("rule validation requires group, trigger and action rows", () => {
  assert.equal(validateRuleDraft(draft()).ok, true);
  const bad = validateRuleDraft(
    draft({ title: "", ruleGroupId: "", triggers: [], actions: [] }),
  );
  assert.equal(bad.ok, false);
  for (const key of ["title", "ruleGroupId", "triggers", "actions"])
    assert.ok(bad.errors[key]);
  const badValue = validateRuleDraft(
    draft({
      triggers: [
        {
          type: "description_contains",
          value: "",
          active: true,
          stopProcessing: false,
        },
      ],
    }),
  );
  assert.ok(badValue.errors["triggers.0.value"]);
});

test("rule payload includes numeric group and normalized rows", () => {
  const payload = rulePayload(
    draft({
      ruleGroupId: "4",
      description: "d",
      triggers: [
        {
          type: "description_contains",
          value: "x",
          active: true,
          stopProcessing: true,
        },
      ],
      actions: [
        {
          type: "clear_category",
          value: "ignored",
          active: true,
          stopProcessing: false,
        },
      ],
    }),
  );
  assert.equal(payload.rule_group_id, 4);
  assert.equal(payload.description, "d");
  assert.equal(payload.triggers[0].stop_processing, true);
  assert.equal(payload.actions[0].value, "");
});
