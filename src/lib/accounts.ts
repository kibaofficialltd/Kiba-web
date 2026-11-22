import "server-only";
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { hashPassword, sha256, verifyPassword } from "@/lib/crypto";
import { ApiError } from "@/lib/api";

/** Build a scrypt hash once so failed logins cost the same as real ones. */
let dummyHash: Promise<string> | null = null;
function getDummyHash() {
  dummyHash ??= hashPassword("not-a-real-password-9f2c");
  return dummyHash;
}

export async function findUserByIdentifier(identifier: string) {
  const value = identifier.toLowerCase();
  const rows = await db
    .select()
    .from(users)
    .where(or(eq(sql`lower(${users.email})`, value), eq(sql`lower(${users.username})`, value)))
    .limit(1);
  return rows[0] ?? null;
}

export async function authenticate(identifier: string, password: string) {
  const user = await findUserByIdentifier(identifier);
  if (!user) {
    await verifyPassword(password, await getDummyHash());
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  if (user.status === "suspended") {
    throw new ApiError(403, "ACCOUNT_SUSPENDED", "This account is suspended. Contact support.");
  }

  return user;
}

export async function emailExists(email: string) {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(sql`lower(${users.email})`, email.toLowerCase()))
    .limit(1);
  return Boolean(rows[0]);
}

export async function usernameExists(username: string) {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(sql`lower(${users.username})`, username.toLowerCase()))
    .limit(1);
  return Boolean(rows[0]);
}

const isOwnerEmail = (email: string) => {
  const normalized = email.toLowerCase().trim();
  return (
    normalized === "kibaturkey@gmail.com" ||
    normalized === (process.env.SEED_ADMIN_EMAIL ?? "owner@kibaofficial.fun").toLowerCase().trim()
  );
};

export async function createUser(input: {
  email: string;
  username: string;
  password: string;
}) {
  const passwordHash = await hashPassword(input.password);
  const isOwner = isOwnerEmail(input.email);
  try {
    const inserted = await db
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        username: input.username,
        passwordHash,
        role: isOwner ? "owner" : "player",
        emailVerifiedAt: isOwner ? new Date() : null,
      })
      .returning({ id: users.id, email: users.email, username: users.username });

    const user = inserted[0];
    if (!user) throw new Error("User insert returned no row");

    await db.insert(notifications).values({
      userId: user.id,
      type: "system",
      title: "Welcome to KIBAOFFICIAL SMP",
      body: "Your portal is ready. Link your Minecraft account to claim rewards and use the coin store.",
      link: "/dashboard/link",
    });

    return user;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError(409, "ACCOUNT_EXISTS", "An account with that email or username already exists.");
    }
    throw error;
  }
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export async function markEmailVerified(userId: string) {
  await db
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(users.id, userId)));
}
