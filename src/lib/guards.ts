import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError } from "@/lib/api";

/** Rewards, purchases and linking require a confirmed email address. */
export async function requireVerifiedEmail(userId: string): Promise<void> {
  const rows = await db
    .select({ emailVerifiedAt: users.emailVerifiedAt, status: users.status })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = rows[0];
  if (!user) throw new ApiError(404, "USER_NOT_FOUND", "Account not found.");
  if (user.status === "suspended") {
    throw new ApiError(403, "ACCOUNT_SUSPENDED", "This account is suspended.");
  }
  if (!user.emailVerifiedAt) {
    throw new ApiError(
      403,
      "EMAIL_NOT_VERIFIED",
      "Verify your email address before using this feature.",
    );
  }
}
