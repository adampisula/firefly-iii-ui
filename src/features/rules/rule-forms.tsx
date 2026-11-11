"use client";
import { useActionState, useState } from "react";
import { Button, Dialog, ErrorSummary } from "@/components/ui/primitives";
import {
  ACTION_TYPES,
  RULE_MOMENTS,
  TRIGGER_TYPES,
  type RuleGroupRecord,
  type RuleRecord,
  type RuleTriggerRecord,
} from "./service";
import {
  deleteRuleAction,
  deleteRuleGroupAction,
  saveRuleAction,
  saveRuleGroupAction,
  testRuleAction,
  triggerRuleAction,
  validateExpressionAction,
  type RuleActionState,
} from "./actions";

const INITIAL: RuleActionState = { ok: false, message: "", errors: {} };
function Messages({ state }: { state: RuleActionState }) {
  if (!state.message && Object.keys(state.errors).length === 0) return null;
  return (
    <ErrorSummary
      title={state.ok ? "Result" : state.message}
      errors={Object.entries(state.errors).map(([field, message]) => ({
        id: field,
        message: `${field}: ${message}`,
      }))}
    />
  );
}
export function RuleForm({
  rule,
  groups,
}: {
  rule?: RuleRecord;
  groups: readonly RuleGroupRecord[];
}) {
  const [state, formAction, pending] = useActionState(saveRuleAction, INITIAL);
  const [triggers, setTriggers] = useState<RuleTriggerRecord[]>(
    rule?.triggers.length
      ? rule.triggers
      : [
          {
            type: "description_contains",
            value: "",
            active: true,
            stopProcessing: false,
          },
        ],
  );
  const [actions, setActions] = useState<RuleRecord["actions"]>(
    rule?.actions.length
      ? rule.actions
      : [
          {
            type: "set_description",
            value: "",
            active: true,
            stopProcessing: false,
          },
        ],
  );
  function updateTrigger(index: number, patch: Partial<RuleTriggerRecord>) {
    setTriggers((current) =>
      current.map((row, position) =>
        position === index ? { ...row, ...patch } : row,
      ),
    );
  }
  function updateAction(
    index: number,
    patch: Partial<RuleRecord["actions"][number]>,
  ) {
    setActions((current) =>
      current.map((row, position) =>
        position === index ? { ...row, ...patch } : row,
      ),
    );
  }
  return (
    <form action={formAction} className="form-stack">
      {rule ? <input type="hidden" name="rule_id" value={rule.id} /> : null}
      <input type="hidden" name="trigger_count" value={triggers.length} />
      <input type="hidden" name="action_count" value={actions.length} />
      <Messages state={state} />
      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="rule-title">
            Title
          </label>
          <input
            className="select"
            id="rule-title"
            name="title"
            defaultValue={rule?.title ?? ""}
            required
            maxLength={100}
          />
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="rule-group">
            Rule group
          </label>
          <select
            className="select"
            id="rule-group"
            name="rule_group_id"
            defaultValue={rule?.ruleGroupId ?? groups[0]?.id ?? ""}
            required
          >
            <option value="">Choose group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.title}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="rule-moment">
            Rule moment
          </label>
          <select
            className="select"
            id="rule-moment"
            name="trigger"
            defaultValue={rule?.trigger ?? "store-journal"}
          >
            {RULE_MOMENTS.map((moment) => (
              <option key={moment.value} value={moment.value}>
                {moment.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="rule-description">
          Description
        </label>
        <textarea
          className="select"
          id="rule-description"
          name="description"
          rows={2}
          defaultValue={rule?.description ?? ""}
        />
      </div>
      <fieldset className="panel">
        <legend>Triggers</legend>
        {triggers.map((trigger, index) => (
          <div className="form-grid" key={`t-${index}`}>
            <div className="field-group">
              <label className="field-label" htmlFor={`trigger-${index}-type`}>
                Trigger
              </label>
              <select
                className="select"
                id={`trigger-${index}-type`}
                name={`trigger_${index}_type`}
                value={trigger.type}
                onChange={(event) =>
                  updateTrigger(index, { type: event.target.value })
                }
              >
                {TRIGGER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor={`trigger-${index}-value`}>
                Value
              </label>
              <input
                className="select"
                id={`trigger-${index}-value`}
                name={`trigger_${index}_value`}
                value={trigger.value}
                onChange={(event) =>
                  updateTrigger(index, { value: event.target.value })
                }
              />
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                name={`trigger_${index}_active`}
                defaultChecked={trigger.active}
              />
              <span>Active</span>
            </label>
            {triggers.length > 1 ? (
              <Button
                type="button"
                tone="quiet"
                onClick={() =>
                  setTriggers((current) =>
                    current.filter((_, position) => position !== index),
                  )
                }
              >
                Remove
              </Button>
            ) : null}
          </div>
        ))}
        <Button
          type="button"
          tone="quiet"
          onClick={() =>
            setTriggers((current) => [
              ...current,
              {
                type: "description_contains",
                value: "",
                active: true,
                stopProcessing: false,
              },
            ])
          }
        >
          Add trigger
        </Button>
      </fieldset>
      <fieldset className="panel">
        <legend>Actions</legend>
        {actions.map((action, index) => (
          <div className="form-grid" key={`a-${index}`}>
            <div className="field-group">
              <label className="field-label" htmlFor={`action-${index}-type`}>
                Action
              </label>
              <select
                className="select"
                id={`action-${index}-type`}
                name={`action_${index}_type`}
                value={action.type}
                onChange={(event) =>
                  updateAction(index, { type: event.target.value })
                }
              >
                {ACTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor={`action-${index}-value`}>
                Value
              </label>
              <input
                className="select"
                id={`action-${index}-value`}
                name={`action_${index}_value`}
                value={action.value}
                onChange={(event) =>
                  updateAction(index, { value: event.target.value })
                }
              />
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                name={`action_${index}_active`}
                defaultChecked={action.active}
              />
              <span>Active</span>
            </label>
            {actions.length > 1 ? (
              <Button
                type="button"
                tone="quiet"
                onClick={() =>
                  setActions((current) =>
                    current.filter((_, position) => position !== index),
                  )
                }
              >
                Remove
              </Button>
            ) : null}
          </div>
        ))}
        <Button
          type="button"
          tone="quiet"
          onClick={() =>
            setActions((current) => [
              ...current,
              {
                type: "set_description",
                value: "",
                active: true,
                stopProcessing: false,
              },
            ])
          }
        >
          Add action
        </Button>
      </fieldset>
      <div className="checkbox-grid">
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="active"
            defaultChecked={rule?.active ?? true}
          />
          <span>Active rule</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="strict"
            defaultChecked={rule?.strict ?? false}
          />
          <span>Strict matching</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            name="stop_processing"
            defaultChecked={rule?.stopProcessing ?? false}
          />
          <span>Stop processing after match</span>
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : rule ? "Save rule" : "Create rule"}
      </Button>
    </form>
  );
}
export function RuleGroupForm({ group }: { group?: RuleGroupRecord }) {
  const [state, formAction, pending] = useActionState(
    saveRuleGroupAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      {group ? <input type="hidden" name="group_id" value={group.id} /> : null}
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
            defaultValue={group?.title ?? ""}
            required
            maxLength={100}
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
            defaultValue={group?.order ?? ""}
          />
        </div>
      </div>
      <div className="field-group">
        <label className="field-label" htmlFor="group-description">
          Description
        </label>
        <textarea
          className="select"
          id="group-description"
          name="description"
          rows={2}
          defaultValue={group?.description ?? ""}
        />
      </div>
      <label className="checkbox-row">
        <input
          type="checkbox"
          name="active"
          defaultChecked={group?.active ?? true}
        />
        <span>Active group</span>
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : group ? "Save group" : "Create group"}
      </Button>
    </form>
  );
}
export function RuleTestButtons({ ruleId }: { ruleId: string }) {
  const [testState, testAction, testing] = useActionState(
    testRuleAction,
    INITIAL,
  );
  const [triggerState, triggerAction, triggering] = useActionState(
    triggerRuleAction,
    INITIAL,
  );
  return (
    <div className="form-stack">
      <form action={testAction} className="inline-form">
        <input type="hidden" name="rule_id" value={ruleId} />
        <Button type="submit" tone="quiet" disabled={testing}>
          {testing ? "Testing..." : "Test rule matches"}
        </Button>
      </form>
      <form action={triggerAction} className="inline-form">
        <input type="hidden" name="rule_id" value={ruleId} />
        <label className="checkbox-row">
          <input type="checkbox" name="confirm_trigger" value="yes" required />
          <span>Confirm execution</span>
        </label>
        <Button type="submit" tone="danger" disabled={triggering}>
          {triggering ? "Executing..." : "Execute rule"}
        </Button>
      </form>
      <Messages state={testState} />
      <Messages state={triggerState} />
    </div>
  );
}
export function ExpressionValidator() {
  const [state, formAction, pending] = useActionState(
    validateExpressionAction,
    INITIAL,
  );
  return (
    <form action={formAction} className="form-stack">
      <Messages state={state} />
      <div className="field-group">
        <label className="field-label" htmlFor="expression">
          Action expression
        </label>
        <input className="select" id="expression" name="expression" required />
      </div>
      <Button type="submit" tone="quiet" disabled={pending}>
        {pending ? "Validating..." : "Validate expression"}
      </Button>
    </form>
  );
}
export function DeleteRule({ id }: { id: string }) {
  return (
    <DeleteConfirm
      title="Delete rule"
      fields={{ rule_id: id }}
      action={deleteRuleAction}
      label="Delete rule"
    />
  );
}
export function DeleteRuleGroup({ id }: { id: string }) {
  return (
    <DeleteConfirm
      title="Delete rule group"
      fields={{ group_id: id }}
      action={deleteRuleGroupAction}
      label="Delete group"
    />
  );
}
function DeleteConfirm({
  title,
  fields,
  action,
  label,
}: {
  title: string;
  fields: Record<string, string>;
  action: (
    state: RuleActionState,
    formData: FormData,
  ) => Promise<RuleActionState>;
  label: string;
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
          <p>
            Confirm this deletion. Firefly enforces ownership and dependencies.
          </p>
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
