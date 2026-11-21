import "server-only";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function audit(params: {
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorId: params.actorId ?? null,
      action: params.action,
      targetType: params.targetType ?? null,
      targetId: params.targetId ?? null,
      meta: params.meta ?? null,
      ip: params.ip ?? null,
    });
  } catch (error) {
    // Auditing must never break the caller's operation.
    console.error("[audit] failed to write entry", error);
  }
}
