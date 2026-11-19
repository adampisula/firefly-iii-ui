import { randomUUID } from "node:crypto";
import { ASSISTANT_LIMITS } from "./config.ts";

type Decision = "approved" | "denied" | "expired";

interface PendingApproval {
  id: string;
  ownerKey: string;
  conversationId: string;
  resolve: (decision: Decision) => void;
  timer: ReturnType<typeof setTimeout>;
}

const pending = new Map<string, PendingApproval>();

export function requestApproval(
  ownerKey: string,
  conversationId: string,
): { approvalId: string; decision: Promise<Decision> } {
  const approvalId = randomUUID();
  const decision = new Promise<Decision>((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(approvalId);
      resolve("expired");
    }, ASSISTANT_LIMITS.approvalTimeoutMs);
    timer.unref?.();
    pending.set(approvalId, {
      id: approvalId,
      ownerKey,
      conversationId,
      resolve,
      timer,
    });
  });
  return { approvalId, decision };
}

export function decideApproval(
  ownerKey: string,
  conversationId: string,
  approvalId: string,
  approve: boolean,
): Decision | null {
  const item = pending.get(approvalId);
  if (
    !item ||
    item.ownerKey !== ownerKey ||
    item.conversationId !== conversationId
  ) {
    return null;
  }
  clearTimeout(item.timer);
  pending.delete(approvalId);
  const decision: Decision = approve ? "approved" : "denied";
  item.resolve(decision);
  return decision;
}

export function cancelApproval(approvalId: string): void {
  const item = pending.get(approvalId);
  if (!item) return;
  clearTimeout(item.timer);
  pending.delete(approvalId);
  item.resolve("denied");
}
