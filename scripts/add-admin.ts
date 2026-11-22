import "dotenv/config";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { hashPassword } from "../src/lib/crypto";
import { sql } from "drizzle-orm";

async function main() {
  const email = (process.argv[2] ?? "kibaturkey@gmail.com").toLowerCase().trim();
  const password = process.argv[3] ?? "KibaTurkey!2026";
  const username = process.argv[4] ?? "KibaTurkey";

  console.log(`Setting up owner/admin access for: ${email}`);

  const existing = await db
    .select({ id: users.id, role: users.role, username: users.username })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  if (existing.length > 0) {
    const user = existing[0];
    await db
      .update(users)
      .set({
        role: "owner",
        status: "active",
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(sql`${users.id} = ${user.id}`);
    console.log(`✓ Updated existing user ${user.username} (${email}) to role: owner`);
  } else {
    // Check if username is taken
    const existingUsername = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.username}) = lower(${username})`)
      .limit(1);

    const finalUsername = existingUsername.length > 0 ? `${username}_admin` : username;
    const passwordHash = await hashPassword(password);
    const inserted = await db
      .insert(users)
      .values({
        email,
        username: finalUsername,
        passwordHash,
        role: "owner",
        status: "active",
        emailVerifiedAt: new Date(),
        balance: 10000,
      })
      .returning({ id: users.id, username: users.username });

    console.log(`✓ Created new owner account:`);
    console.log(`  Email:    ${email}`);
    console.log(`  Username: ${inserted[0]?.username}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role:     owner (full admin access)`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error setting admin user:", err);
  process.exit(1);
});
