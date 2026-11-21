import "server-only";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { randomToken, sha256 } from "@/lib/crypto";
import { env, isSecureOrigin } from "@/lib/env";

export type Role = "player" | "helper" | "moderator" | "admin" | "owner";
export type SessionUser = {
  id: string;
  email: string;
  username: string;
  role: Role;
  status: "active" | "suspended";
  emailVerifiedAt: Date | null;
  balance: number;
  createdAt: Date;
};

const STAFF: Role[] = ["helper", "moderator", "admin", "owner"];
const ADMINS: Role[] = ["admin", "owner"];

export function isStaff(role: Role): boolean {
  return STAFF.includes(role);
}
export function isAdmin(role: Role): boolean {
  return ADMINS.includes(role);
}

export async function createSession(
  userId: string,
  meta: { ip?: string | null; userAgent?: string | null } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + env.session.days * 86_400_000);
  await db.insert(sessions).values({
    tokenHash: sha256(token),
    userId,
    expiresAt,
    ip: meta.ip ?? null,
    userAgent: meta.userAgent?.slice(0, 400) ?? null,
  });

  const jar = await cookies();
  jar.set(env.session.cookie, token, {
    httpOnly: true,
    secure: isSecureOrigin,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return { token, expiresAt };
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(env.session.cookie)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  }
  jar.delete(env.session.cookie);
}

/**
 * Reads the signed-in user for the current request. Cached per request so
 * multiple server components don't hammer the database.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(env.session.cookie)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      status: users.status,
      emailVerifiedAt: users.emailVerifiedAt,
      balance: users.balance,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const user = rows[0];
  if (!user || user.status === "suspended") return null;
  return user as SessionUser;
});
