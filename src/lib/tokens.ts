import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { emailTokens } from "@/db/schema";
import { randomToken, sha256 } from "@/lib/crypto";
import { ApiError } from "@/lib/api";

export async function createEmailToken(
  userId: string,
  type: "verify_email" | "reset_password",
  hours: number,
): Promise<string> {
  const token = randomToken(32);
  await db.insert(emailTokens).values({
    userId,
    type,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + hours * 3_600_000),
  });
  return token;
}

export async function consumeEmailToken(
  token: string,
  type: "verify_email" | "reset_password",
): Promise<string> {
  const rows = await db
    .select()
    .from(emailTokens)
    .where(
      and(
        eq(emailTokens.tokenHash, sha256(token)),
        eq(emailTokens.type, type),
        isNull(emailTokens.usedAt),
        gt(emailTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    throw new ApiError(
      400,
      "INVALID_TOKEN",
      "This link is invalid or has expired. Request a new one.",
    );
  }

  await db.update(emailTokens).set({ usedAt: new Date() }).where(eq(emailTokens.id, row.id));
  return row.userId;
}
