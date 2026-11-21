import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { minecraftAccounts, users } from "@/db/schema";
import {
  assertSameOrigin,
  clientIp,
  jsonOk,
  parseBody,
  requireApiUser,
  route,
  ApiError,
} from "@/lib/api";
import { verifyPassword } from "@/lib/crypto";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({ password: z.string().min(1) });

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  const body = await parseBody(req, schema);

  const rows = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!rows[0] || !(await verifyPassword(body.password, rows[0].passwordHash))) {
    throw new ApiError(400, "WRONG_PASSWORD", "Password is incorrect.", {
      password: "Incorrect password.",
    });
  }

  const deleted = await db
    .delete(minecraftAccounts)
    .where(eq(minecraftAccounts.userId, user.id))
    .returning({ username: minecraftAccounts.username });

  await audit({
    actorId: user.id,
    action: "minecraft.unlinked",
    targetType: "minecraft",
    targetId: deleted[0]?.username,
    ip: clientIp(req),
  });

  return jsonOk({ unlinked: true, username: deleted[0]?.username ?? null });
});
